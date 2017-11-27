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

var app = angular.module("openattic.taskQueue");
app.service("taskQueueSubscriber", function ($q, $interval, taskQueueService) {

  var self = this;

  var pendingStatus = ["Not Started", "Running"];
  var finalStatus = ["Exception", "Aborted", "Finished"];

  var isFinalStatus = function (task) {
    return finalStatus.indexOf(task.status) > -1;
  };

  self.pendingTasksPromise = function () {
    let requests = [];
    pendingStatus.forEach((status) => {
      requests.push(
        taskQueueService
          .get({
            status: status
          }).$promise
      );
    });
    return $q.all(requests);
  };

  self.subscribe = function (taskId, callback) {
    let isWaiting = false;
    let stop = $interval(function () {
      if (!isWaiting) {
        isWaiting = true;

        taskQueueService.get({id: taskId})
          .$promise
          .then((res) => {
            if (isFinalStatus(res)) {
              $interval.cancel(stop);
              callback(res);
            }
          })
          .finally(() => {
            isWaiting = false;
          });
      }
    }, 1000);
  };
});
