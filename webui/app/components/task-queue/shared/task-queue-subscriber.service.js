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

export default class TaskQueueSubscriber {
  constructor ($q, taskQueueService) {
    this.$q = $q;
    this.taskQueueService = taskQueueService;

    this.pendingStatus = ["Not Started", "Running"];
    this.finalStatus = ["Exception", "Aborted", "Finished"];
  }

  isFinalStatus (task) {
    return this.finalStatus.indexOf(task.status) > -1;
  }

  pendingTasksPromise () {
    let requests = [];
    this.pendingStatus.forEach((status) => {
      requests.push(
        this.taskQueueService
          .get({
            status: status
          }).$promise
      );
    });
    return this.$q.all(requests);
  }

  subscribe (taskId, callback) {
    let isWaiting = false;
    let stop = setInterval(() => {
      if (!isWaiting) {
        isWaiting = true;

        this.taskQueueService.get({id: taskId})
          .$promise
          .then((res) => {
            if (this.isFinalStatus(res)) {
              clearInterval(stop);
              callback(res);
            }
          })
          .finally(() => {
            isWaiting = false;
          });
      }
    }, 1000);
  }
}
