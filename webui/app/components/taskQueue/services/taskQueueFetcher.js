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
app.service("taskQueueFetcher", function ($http, $interval, taskQueueService, $rootScope, $q, toasty) {
  this.taskTimeout = {};
  this.tasks = {
    "Running": [],
    "Not Started": [],
    "Exception": [],
    "Aborted": [],
    "Finished": []
  };
  this.oldTasks = {};
  this.deferredOverview = {};
  this.update = false;

  /**
   * Loads all tasks and copies the last loaded tasks to oldTasks.
   * @returns <promise>
   */
  this.loadOverview = function () {
    if (self.update === false) {
      self.deferredOverview = $q.defer();
      self.update = true;
    }
    if ($http.pendingRequests.length > 0 || !$rootScope.user) {
      self.taskTimeout = $interval(self.loadOverview, 50, 1);
      return self.deferredOverview.promise;
    }
    angular.copy(self.tasks, self.oldTasks);
    Object.keys(self.tasks).forEach(function (state) {
      self.tasks[state] = [];
    });
    self.loadAllTasks().then(function (res) {
      self.deferredOverview.resolve(res);
      self.update = false;
    });
    return self.deferredOverview.promise;
  };

  /**
   * Loads all tasks.
   * @throws <toasty> - If a fetch fails.
   * @returns <promise>
   */
  this.loadAllTasks = function (pgnum, loading) {
    if (loading === undefined) {
      loading = $q.defer();
    }
    if (pgnum === undefined) {
      pgnum = 1;
    }
    taskQueueService.get({
      pageSize: 100,
      page: pgnum
    })
      .$promise
      .then(function (res) {
        res.results.forEach(function (task) {
          self.tasks[task.status].push(task);
        });
        if (res.next !== null) {
          self.loadAllTasks(++pgnum, loading);
        } else {
          loading.resolve({
            tasks: self.tasks,
            oldTasks: self.oldTasks
          });
        }
      })
      .catch(function (error) {
        error.toasty = {
          title: "Background task loading failure",
          msg: "Background tasks page " + pgnum + " couldn't be loaded.",
          timeout: globalConfig.GUI.defaultToastTimes.error
        };
        toasty.error(error.toasty);
        throw error;
      });
    return loading.promise;
  };

  var self = this;
});

