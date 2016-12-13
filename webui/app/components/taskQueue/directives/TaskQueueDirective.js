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
app.directive("taskQueueDirective", function () {
  return {
    restrict: "A",
    templateUrl: "components/taskQueue/templates/task-queue-directive.html",
    controller: function ($scope, toasty, $uibModal, $resource, taskQueueService, $interval, $http, taskQueueFetcher) {
      $scope.taskOverview = {
        firstUpdate: true,
        avr: 0,
        queue: 0,
        icon: "fa-hourglass-o",
        percent: 0,
        tooltip: "No tasks running."
      };

      /**
       * Update all needed parts.
       *
       * Hourglass update:
       * The hourglass has four different states which will be set according to the percentage of all running tasks in
       * relation to their count.
       *
       * Tooltip update:
       * The tooltip shows the average percent done over all running tasks.
       *
       * If toasties are needed:
       * Toasties are created if their is a change between the finalized tasks from the last and the current task
       * update.
       */
      $scope.updateTaskOverview = function () {
        taskQueueFetcher.loadOverview().then(function (allTasks) {
          var ov = $scope.taskOverview;
          ov.percent = 0;
          allTasks.tasks.Running.forEach(function (task) {
            ov.percent += task.percent;
          });
          ov.queue = allTasks.tasks.Running.length + allTasks.tasks["Not Started"].length;
          ov.avr = ov.queue !== 0 ? ov.percent / ov.queue : 0;
          ov.icons = ["fa-hourglass-o", "fa-hourglass-start", "fa-hourglass-half", "fa-hourglass-end"];
          ov.icon = ov.queue !== 0 ? ov.icons[Math.floor(ov.avr / 30) + 1] : ov.icons[0];
          ov.tooltip = ov.avr === 0 ? "No tasks running" : parseInt(ov.avr, 10) + "% done in average";
          if (ov.firstUpdate) {
            ov.firstUpdate = false;
          } else {
            $scope.createNeededToasties(allTasks);
          }
          $scope.taskOverview = ov;
          $scope.taskTimeout = $interval($scope.updateTaskOverview, globalConfig.GUI.defaultTaskReloadTime, 1);
        });
      };

      /**
       * Toasties are created if their is a change between the finalized tasks from the last and the current task
       * update.
       */
      $scope.createNeededToasties = function (allTasks) {
        var moved = $scope.getNewFinalTasks(allTasks); //id's
        var tasks = allTasks.tasks;
        if (moved.length !== 0) {
          Object.keys(tasks).forEach(function (state) {
            tasks[state].forEach(function (task) {
              if (moved.indexOf(task.id) !== -1) {
                var toast = {
                  title: task.status + ": " + task.description,
                  msg: task.description
                };
                if (task.status === "Finished") {
                  toast.timeout = globalConfig.GUI.defaultToastTimes.success;
                  toast.msg += " has finished.";
                  toasty.success(toast);
                } else if (task.status === "Aborted") {
                  toast.timeout = globalConfig.GUI.defaultToastTimes.warning;
                  toast.msg += " was aborted.";
                  toasty.warning(toast);
                } else if (task.status === "Exception") {
                  toast.timeout = globalConfig.GUI.defaultToastTimes.error;
                  toast.title = "Error: " + task.description;
                  toast.msg += " has failed.";
                  toasty.error(toast);
                }
              }
            });
          });
        }
      };

      /**
       * Find out which tasks changed to a final state, by comparing the previous and the current fetched tasks.
       * @returns {Array} - Containing all changed task ids.
       */
      $scope.getNewFinalTasks = function (allTasks) {
        var older = allTasks.oldTasks;
        var newer = allTasks.tasks;
        var oldIds = [];
        var newIds = [];
        ["Exception", "Aborted", "Finished"].forEach(function (state) {
          if (older[state].length !== newer[state].length) {
            older[state].forEach(function (task) {
              oldIds.push(task.id);
            });
            newer[state].forEach(function (task) {
              newIds.push(task.id);
            });
          }
        });
        return newIds.filter(function (id) {
          return oldIds.indexOf(id) === -1;
        });
      };

      /**
       * Opens task queue dialog, stops the refresh timeout and refreshes on close.
       */
      $scope.runnersDialog = function () {
        var taskDialog = $uibModal.open({
          windowTemplateUrl: "templates/messagebox.html",
          templateUrl: "components/taskQueue/templates/task-queue-dialog.html",
          controller: "TaskQueueModalCtrl",
          size: "lg",
          animation: false
        });

        taskDialog.opened.then(function () {
          $interval.cancel($scope.taskTimeout);
        });

        taskDialog.closed.then(function () {
          $scope.updateTaskOverview();
        });
      };

      // Initial load.
      $scope.updateTaskOverview();
    }
  };
});
