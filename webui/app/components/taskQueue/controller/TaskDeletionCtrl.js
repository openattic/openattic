/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
  $scope.tasks = taskSelection.slice();
  $scope.waiting = false;
  $scope.done = 0;
  $scope.donePrc = 0;

  $scope.input = {
    enteredName: "",
    pattern: "yes"
  };

  $scope.deleteTask = function (entries) {
    var taskE = entries.next().value;
    if (taskE) {
      var task = taskE[1];
      taskQueueService.delete({id: task.id})
        .$promise
        .then(function () {
          $scope.done++;
          $scope.deleteTask(entries);
        }, function (error) {
          error.toasty = {
            title: "Task deletion failure",
            msg: "Task couldn't be deleted.",
            timeout: 10000
          };
          toasty.error(error.toasty);
          throw error;
        });
    } else {
      $scope.waiting = false;
      $uibModalInstance.close("deleted");
    }
  };

  $scope.deleteTasks = function () {
    $scope.waiting = true;
    $scope.deleteTask($scope.tasks.entries());
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };
});

