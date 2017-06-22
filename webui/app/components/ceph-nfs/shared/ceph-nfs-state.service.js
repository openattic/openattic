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

var app = angular.module("openattic.cephNfs");
app.service("cephNfsStateService", function (cephNfsService, taskQueueSubscriber, taskQueueService,
    Notification) {

  var self = this;

  var stopTaskDescr = "NFS-Ganesha stop exports";
  var deployTaskDescr = "NFS-Ganesha deploy exports";

  var getState = function (host, hostname, notStartedTasksResult, runningTasksResult) {
    var startingHosts = {};
    var stoppingHosts = {};
    angular.forEach(notStartedTasksResult.results, function (notStartedTask) {
      var hostname = notStartedTask.host;
      if (notStartedTask.description === stopTaskDescr) {
        stoppingHosts[hostname] = true;
      } else if (notStartedTask.description === deployTaskDescr) {
        startingHosts[hostname] = true;
      }
    });
    angular.forEach(runningTasksResult.results, function (runningTask) {
      var hostname = runningTask.host;
      if (runningTask.description === stopTaskDescr) {
        stoppingHosts[hostname] = true;
      } else if (runningTask.description === deployTaskDescr) {
        startingHosts[hostname] = true;
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
  };

  self.updateStates = function (fsid, updateHosts) {
    var taskIds = [];
    taskQueueService
      .get({
        status: "Not Started"
      })
      .$promise
      .then(function (notStartedTasksResult) {
        angular.forEach(notStartedTasksResult.results, function (notStartedTask) {
          if (notStartedTask.description === stopTaskDescr || notStartedTask.description === deployTaskDescr) {
            taskIds.push(notStartedTask.id);
            var hostname = notStartedTask.host;
            var hostsToUpdate = {};
            hostsToUpdate[hostname] = {};
            hostsToUpdate[hostname].state = notStartedTask.description === stopTaskDescr ? "STOPPING" : "STARTING";
            updateHosts(hostsToUpdate);
          }
        });

        taskQueueService
          .get({
            status: "Running"
          })
          .$promise
          .then(function (runningTasksResult) {
            angular.forEach(runningTasksResult.results, function (runningTask) {
              if (runningTask.description === stopTaskDescr || runningTask.description === deployTaskDescr) {
                if (taskIds.indexOf(runningTask.id) === -1) {
                  taskIds.push(runningTask.id);
                  var hostname = runningTask.host;
                  var hostsToUpdate = {};
                  hostsToUpdate[hostname] = {};
                  hostsToUpdate[hostname].state = runningTask.description === stopTaskDescr ? "STOPPING" : "STARTING";
                  updateHosts(hostsToUpdate);
                }
              }
            });
            angular.forEach(taskIds, function (taskId) {
              taskQueueSubscriber.subscribe(taskId, function () {
                self.updateStates(fsid, updateHosts);
              });
            });

            cephNfsService
              .status({
                fsid: fsid
              })
              .$promise
              .then(function (res) {
                var hosts = res;
                angular.forEach(hosts, function (host, hostname) {
                  // angular internal properties
                  if (!hostname.startsWith("$")) {
                    host.state = getState(host, hostname, notStartedTasksResult, runningTasksResult);
                    var exports = {};
                    if (host.state === "ACTIVE") {
                      angular.forEach(host.exports, function (exportItem) {
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
              });
          });
      });
  };

  var tryGetStatusAfterStart = function (host, hostname, fsid, numRetries) {
    cephNfsService
      .status({
        fsid: fsid
      })
      .$promise
      .then(function (res) {
        if (res[hostname].active) {
          host.active = true;
          host.state = "ACTIVE";
          host.message = res[hostname].message;
          Notification.success({
            title: hostname + " started successfully"
          });
        } else {
          if (res[hostname].message.indexOf("Timed out") > -1 && numRetries > 0) {
            tryGetStatusAfterStart(host, hostname, fsid, numRetries--);
          } else {
            host.active = false;
            host.state = "INACTIVE";
            host.message = res[hostname].message;
            Notification.error({
              title: "Error starting " + hostname
            });
          }
        }
      });
  };

  self.start = function (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STARTING";
    delete host.message;
    delete host.messages;
    cephNfsService
      .start({
        fsid: fsid,
        host: hostname
      })
      .$promise
      .then(function (res) {
        taskQueueSubscriber.subscribe(res.task_id, function () {
          tryGetStatusAfterStart(host, hostname, fsid, 3);
        });
      });
  };

  self.stop = function (host, hostname, fsid) {
    host.active = undefined;
    host.state = "STOPPING";
    delete host.message;
    delete host.messages;
    cephNfsService
      .stop({
        fsid: fsid,
        host: hostname
      })
      .$promise
      .then(function (res) {
        taskQueueSubscriber.subscribe(res.task_id, function () {
          cephNfsService
            .status({
              fsid: fsid
            })
            .$promise
            .then(function (res) {
              host.active = res[hostname].active;
              host.message = res[hostname].message;
              if (!res[hostname].active) {
                host.state = "INACTIVE";
                Notification.success({
                  title: hostname + " stopped successfully"
                });
              } else {
                host.state = "ACTIVE";
                Notification.error({
                  title: "Error stopping " + hostname
                });
              }
            });
        });
      });
  };

});
