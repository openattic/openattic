/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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
app.controller("TaskDeleteCtrl", function ($scope, taskQueueService, $uibModalInstance, taskSelection,
    Notification) {
  $scope.tasks = angular.copy(taskSelection); //Now it can't be changed by a possible current asynchronous call.
  $scope.waiting = false;
  $scope.finishedTasks = 0;
  var pending = ["Running", "Not Started"];
  $scope.pendingDeletionFailure = [];

  $scope.input = {
    enteredName: "",
    pattern: "yes"
  };

  /**
   * To detect a pending task.
   * @return {boolean}
   */
  $scope.isPendingTask = function (task) {
    return pending.indexOf(task.status) > -1;
  };

  /**
   * Deletes all tasks sequentially.
   * Checks the status of all pending task just before the deletion, if
   * the task isn't running anymore at that point, it won't be deleted.
   * Updates how many tasks were processed and failed to delete so far.
   * If pending tasks are deleted and some of them won't be, the details
   * will be provided by the dialog.
   * The method calls it self recursively in order to process sequentially.
   * @param {iterator} entries - The iterator contains the remaining tasks.
   */
  $scope.deleteTasks = function (entries) {
    var taskEntry = entries.next().value;
    var task = {};
    if (taskEntry) {
      if (taskEntry[0] === 0) {
        $scope.waiting = true;
      }
      task = taskEntry[1];
      $scope.finishedTasks++;
      if ($scope.isPendingTask(task)) {
        taskQueueService.get({id: task.id})
          .$promise
          .then(function (res) {
            if ($scope.isPendingTask(res)) {
              $scope.taskDelete(task, entries);
            } else {
              $scope.pendingDeletionFailure.push([task, res]);
              $scope.deleteTasks(entries);
            }
          }, function () {
            $scope.deleteTasks(entries);
          });
      } else {
        $scope.taskDelete(task, entries);
      }
    } else {
      $scope.waiting = false;
      if ($scope.pendingDeletionFailure.length > 0) {
        Notification.warning({
          title: "Couldn't delete " + $scope.pendingDeletionFailure.length + " tasks",
          msg: "More details are shown in the dialog."
        });
      } else {
        $uibModalInstance.close("deleted");
      }
    }
  };

  /**
   * This will close the dialog, if there were moved tasks during deletion.
   */
  $scope.closeWithWarnings = function () {
    $uibModalInstance.close("Deleted without " + $scope.pendingDeletionFailure.length + " moved tasks.");
  };

  /**
   * This will delete a task and call deleteTask if successfully deleted the task.
   */
  $scope.taskDelete = function (task, entries) {
    taskQueueService.delete({id: task.id})
      .$promise
      .then(function () {
        $scope.deleteTasks(entries);
      }, function (error) {
        Notification.error({
          title: "Task deletion failure",
          msg: "Task " + task.description + "(" + task.id + ") couldn't be deleted.",
          timeout: 10000
        }, error);
        $scope.deleteTasks(entries);
      });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };
});

