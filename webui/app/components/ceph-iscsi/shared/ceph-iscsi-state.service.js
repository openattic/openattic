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

export default class CephIscsiStateService {

  constructor (taskQueueSubscriber, taskQueueService, Notification, cephIscsiService) {
    this.taskQueueSubscriber = taskQueueSubscriber;
    this.taskQueueService = taskQueueService;
    this.Notification = Notification;
    this.cephIscsiService = cephIscsiService;

    this.stopTaskDescr = "iSCSI stop exports";
    this.deployTaskDescr = "iSCSI deploy exports";
  }

  _updateStates (fsid, updateHosts) {
    let state;
    let taskIds = [];
    this.taskQueueService
      .get({
        status: "Not Started"
      })
      .$promise
      .then((notStartedTasksResult) => {
        notStartedTasksResult.results.forEach((notStartedTask) => {
          if (notStartedTask.description === this.stopTaskDescr ||
              notStartedTask.description === this.deployTaskDescr) {
            taskIds.push(notStartedTask.id);
            state = notStartedTask.description === this.stopTaskDescr ? "STOPPING" : "STARTING";
            updateHosts(state);
          }
        });

        this.taskQueueService
          .get({
            status: "Running"
          })
          .$promise
          .then((runningTasksResult) => {
            runningTasksResult.results.forEach((runningTask) => {
              if (runningTask.description === this.stopTaskDescr || runningTask.description === this.deployTaskDescr) {
                if (taskIds.indexOf(runningTask.id) === -1) {
                  taskIds.push(runningTask.id);
                  state = runningTask.description === this.stopTaskDescr ? "STOPPING" : "STARTING";
                  updateHosts(state);
                }
              }
            });
            taskIds.forEach((taskId) => {
              this.taskQueueSubscriber.subscribe(taskId, () => {
                this._updateStates(fsid, updateHosts);
              });
            });

            if (!state) {
              this.cephIscsiService
                .iscsistatus({
                  fsid: fsid
                })
                .$promise
                .then((res) => {
                  updateHosts(res.status ? "RUNNING" : "STOPPED");
                })
                .catch(() => {
                  updateHosts();
                });
            }
          })
          .catch(() => {
            updateHosts();
          });
      })
      .catch(() => {
        updateHosts();
      });
  }

  update (fsid, deployed) {
    deployed.state = "LOADING";
    this._updateStates(fsid, (state) => {
      deployed.state = state;
    });
  }

  start (fsid, deployed) {
    deployed.state = "STARTING";
    this.cephIscsiService
      .iscsideploy({
        fsid: fsid
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.task_id, () => {
          this._updateStates(fsid, (state) => {
            deployed.state = state;
            if (state === "RUNNING") {
              this.Notification.success({
                msg: "iSCSI targets started successfully"
              });
            } else if (state === "STOPPED") {
              this.Notification.error({
                msg: "Failed to start iSCSI targets"
              });
            }
          });
        });
      })
      .catch(() => {
        deployed.state = undefined;
      });
  }

  stop (fsid, deployed) {
    deployed.state = "STOPPING";
    this.cephIscsiService
      .iscsiundeploy({
        fsid: fsid
      })
      .$promise
      .then((res) => {
        this.taskQueueSubscriber.subscribe(res.task_id, () => {
          this._updateStates(fsid, (state) => {
            deployed.state = state;
            if (state === "STOPPED") {
              this.Notification.success({
                msg: "iSCSI targets stopped successfully"
              });
            } else if (state === "RUNNING") {
              this.Notification.error({
                msg: "Failed to stop iSCSI targets"
              });
            }
          });
        });
      })
      .catch(() => {
        deployed.state = undefined;
      });
  }

}
