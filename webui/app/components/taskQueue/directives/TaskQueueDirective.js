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
app.directive("taskQueueDirective", function () {
  return {
    restrict: "A",
    templateUrl: "components/taskQueue/templates/task-queue-directive.html",
    controller: function ($scope, toasty, $uibModal, $resource, taskQueueService) {
      $scope.tasks = {
        overview: {},
        pending: [],
        failed: [],
        finished: []
      };

      $scope.updateTaskOverview = function () {
        var ov = $scope.tasks.overview;
        var avr = ov.queue !== 0 ? ov.queue / ov.sum * 100 : 0;
        var icons = ["fa-hourglass-o", "fa-hourglass-end", "fa-hourglass-half", "fa-hourglass-start"];
        var icon = ov.queue !== 0 ? icons[Math.floor(avr / 33.4) + 1] : icons[0];

        $scope.tasks.overview.avr = avr;
        $scope.tasks.overview.icon = icon;
        $scope.tasks.overview.updated = 1;
        console.log($scope.tasks.overview);
      };

      $scope.loadOverview = function () {
        $scope.tasks.overview.queue = 0;
        $scope.tasks.overview.queueLoad = 0;
        $scope.tasks.overview.updated = 0;
        $scope.tasks.overview.sum = undefined;
        ["Running", "Not Started"].forEach(function (state) {
          taskQueueService.get({
            pageSize: 1,
            status: state
          })
            .$promise
            .then(function (res) {
              $scope.tasks.overview.queue += res.count;
              $scope.tasks.overview.queueLoad++;
            })
            .catch(function (error) {
              error.toasty = {
                title: "Background task loading failure",
                msg: "Background tasks with status " + state + " couldn't be loaded.",
                timeout: 10000
              };
              toasty.error(error.toasty);
              throw error;
            });
        });
        taskQueueService.get({
          pageSize: 1
        })
          .$promise
          .then(function (res) {
            $scope.tasks.overview.sum = res.count;
          })
          .catch(function (error) {
            error.toasty = {
              title: "Background task loading failure",
              msg: "Background tasks couldn't be loaded.",
              timeout: 10000
            };
            toasty.error(error.toasty);
            throw error;
          });
      };

      $scope.$watchCollection("tasks.overview", function () {
        if ($scope.tasks.overview.sum !== undefined && $scope.tasks.overview.queueLoad === 2 &&
            $scope.tasks.overview.updated === 0) {
          $scope.updateTaskOverview();
        } else if ($scope.tasks.overview.updated === 1) {
          setTimeout($scope.loadOverview, 10000);
        }
      });

      $scope.runnersDialog = function (selection) {
        var modalInstance = $uibModal.open({
          windowTemplateUrl: "templates/messagebox.html",
          templateUrl: "components/taskQueue/templates/task-queue-dialog.html",
          controller: "TaskQueueModalCtrl",
          size: "lg",
          animation: false,
          resolve: {
            tasks: function () {
              return $scope.tasks;
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.filterConfig.refresh = new Date();
        });
      };

      $scope.loadOverview()
    }
  };
});
