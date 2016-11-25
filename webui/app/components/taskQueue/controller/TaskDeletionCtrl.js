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
app.controller("TaskDeletionCtrl", function ($scope, taskQueueService, $uibModalInstance, taskSelection, $q, toasty) {
  $scope.tasks = taskSelection;
  $scope.waiting = false;
  $scope.done = 0;

  $scope.input = {
    enteredName: "",
    pattern: "yes"
  };

  /**
   * Starts the deletion process and sets the loading screen.
   */
  $scope.deleteTasks = function () {
    $scope.waiting = true;
    $scope.deleteTask($scope.tasks.entries());
  };

  /**
   * Deletes all tasks sequentially and updates how many tasks were successfully deleted.
   * The method calls it self recursively in order to process sequentially.
   * @param {iterator} entries - The iterator contains the remaining tasks.
   */
  $scope.deleteTask = function (entries) {
    var taskE = entries.next().value;
    var task = {};
    if (taskE) {
      task = taskE[1];
      taskQueueService.delete({id: task.id})
        .$promise
        .then(function () {
          $scope.done++;
          $scope.deleteTask(entries);
        }, function (error) {
          error.toasty = {
            title: "Task deletion failure",
            msg: "Task " + task.description + "(" + task.id + ") couldn't be deleted.",
            timeout: 10000
          };
          toasty.error(error.toasty);
          $scope.deleteTask(entries);
          throw error;
        });
    } else {
      $scope.waiting = false;
      $uibModalInstance.close("deleted");
    }
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };
});

