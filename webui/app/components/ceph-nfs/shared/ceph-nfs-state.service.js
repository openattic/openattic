/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

export default class CephNfsStateService {
  constructor ($q, cephNfsService, taskQueueSubscriber, taskQueueService,
      Notification) {
    this.$q = $q;
    this.cephNfsService = cephNfsService;
    this.taskQueueSubscriber = taskQueueSubscriber;
    this.taskQueueService = taskQueueService;
    this.Notification = Notification;

    this.stopTaskDescr = "NFS-Ganesha stop exports";
    this.deployTaskDescr = "NFS-Ganesha deploy exports";
  }

  getState (host, hostname, notStartedTasksResult, runningTasksResult) {
    let startingHosts = {};
    let stoppingHosts = {};
    notStartedTasksResult.results.forEach((notStartedTask) => {
      const localHostname = notStartedTask.host;
      if (notStartedTask.description === this.stopTaskDescr) {
        stoppingHosts[localHostname] = true;
      } else if (notStartedTask.description === this.deployTaskDescr) {
        startingHosts[localHostname] = true;
      }
    });
    runningTasksResult.results.forEach((runningTask) => {
      const localHostname = runningTask.host;
      if (runningTask.description === this.stopTaskDescr) {
        stoppingHosts[localHostname] = true;
      } else if (runningTask.description === this.deployTaskDescr) {
        startingHosts[localHostname] = true;
      }
    });
    if (startingHosts[hostname] === true) {
      return "STARTING";
    }
    if (stoppingHosts[hostname] === true) {
      return "STOPPING";
    }
    if (host.active === true) {
      return "ACTIVE";
    }
    if (host.active === false) {
      return "INACTIVE";
    }
    if (host.active === undefined) {
      return "LOADING";
    }
    return "UNKNOWN";
  }

  updateStates (fsid, updateHosts) {
    let requests = [];
    requests.push(this.taskQueueService.get({status: "Not Started"}).$promise);
    requests.push(this.taskQueueService.get({status: "Running"}).$promise);
    this.$q.all(requests)
      .then((res) => {
        let notStartedTasksResult = res[0];
        let runningTasksResult = res[1];
        let taskIds = [];

        notStartedTasksResult.results.forEach((notStartedTask) => {
          if (notStartedTask.description === this.stopTaskDescr ||
              notStartedTask.description === this.deployTaskDescr) {
            taskIds.push(notStartedTask.id);
            let hostname = notStartedTask.host;
            let hostsToUpdate = {};
            hostsToUpdate[hostname] = {};
            hostsToUpdate[hostname].state = notStartedTask.description === this.stopTaskDescr ?
              "STOPPING" : "STARTING";
            updateHosts(hostsToUpdate);
          }
        });

        runningTasksResult.results.forEach((runningTask) => {
          if (runningTask.description === this.stopTaskDescr ||
              runningTask.description === this.deployTaskDescr) {
            if (taskIds.indexOf(runningTask.id) === -1) {
              taskIds.push(runningTask.id);
              let hostname = runningTask.host;
              let hostsToUpdate = {};
              hostsToUpdate[hostname] = {};
              hostsToUpdate[hostname].state =
                runningTask.description === this.stopTaskDescr ? "STOPPING" : "STARTING";
              updateHosts(hostsToUpdate);
            }
          }
        });

        taskIds.forEach((taskId) => {
          this.taskQueueSubscriber.subscribe(taskId, () => {
            this.updateStates(fsid, updateHosts);
          });
        });

        this.cephNfsService
          .status({
            fsid: fsid
          })
          .$promise
          .then((hosts) => {
            _.forIn(hosts, (host, hostname) => {
              // angular internal properties
              if (!hostname.startsWith("$")) {
                host.state = this.getState(host, hostname, notStartedTasksResult,
                  runningTasksResult);
                let exports = {};
                if (host.state === "ACTIVE") {
                  host.exports.forEach((exportItem) => {
                    exports[exportItem.export_id] = {
                      state: exportItem.active ? "ACTIVE" : "INACTIVE",
                      message: exportItem.message
                    };
                  });
                }
                host.exports = exports;
              }
            });
            updateHosts(hosts);
          })
          .catch(() => {
            updateHosts();
          });
      })
      .catch(() => {
        updateHosts();
      });
  }

  tryGetStatusAfterStart (host, hostname, fsid, numRetries) {
    this.cephNfsService
      .status({
        fsid: fsid
      })
      .$promise
      .then((res) => {
        if (res[hostname].active) {
          host.active = true;
          host.state = "ACTIVE";
          host.message = res[hostname].message;
          this.Notification.success({
            title: hostname + " started successfully"
          });
        } else {
          if (res[hostname].message.indexOf("Timed out") > -1 && numRetries > 0) {
            this.tryGetStatusAfterStart(host, hostname, fsid, numRetries--);
          } else {
            host.active = false;
            host.state = "INACTIVE";
            host.message = res[hostname].message;
            this.Notification.error({
              title: "Error starting " + hostname
            });
          }
        }
      });
  }

  start (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STARTING";
    delete host.message;
    delete host.messages;
    this.cephNfsService
      .start({
        fsid: fsid,
        host: hostname
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.taskqueue_id, () => {
          this.tryGetStatusAfterStart(host, hostname, fsid, 3);
        });
      });
  }

  stop (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STOPPING";
    delete host.message;
    delete host.messages;
    this.cephNfsService
      .stop({
        fsid: fsid,
        host: hostname
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.taskqueue_id, () => {
          this.cephNfsService
            .status({
              fsid: fsid
            })
            .$promise
            .then((result) => {
              host.active = result[hostname].active;
              host.message = result[hostname].message;
              if (!result[hostname].active) {
                host.state = "INACTIVE";
                this.Notification.success({
                  title: hostname + " stopped successfully"
                });
              } else {
                host.state = "ACTIVE";
                this.Notification.error({
                  title: "Error stopping " + hostname
                });
              }
            });
        });
      });
  }
}
