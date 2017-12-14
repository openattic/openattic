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

import _ from "lodash";

export default class TaskQueueFetcher {
  constructor ($http, taskQueueService, authUserService, $q) {
    this.$http = $http;
    this.taskQueueService = taskQueueService;
    this.authUserService = authUserService;
    this.$q = $q;

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
    this.onUpdateChange = undefined;
  }

  /**
   * Loads all tasks and copies the last loaded tasks to oldTasks.
   * @returns <promise>
   */
  loadOverview () {
    if (this.update === false) {
      this.deferredOverview = this.$q.defer();
      this.callOnUpdateChange(this.update, true);
      this.update = true;
    }
    if (this.$http.pendingRequests.length > 0 || !this.authUserService.isLoggedIn()) {
      setTimeout(() => {
        this.loadOverview();
      }, 50);
      return this.deferredOverview.promise;
    }
    this.oldTasks = _.cloneDeep(this.tasks);
    Object.keys(this.tasks).forEach((state) => {
      this.tasks[state] = [];
    });
    this.loadAllTasks().then((res) => {
      this.deferredOverview.resolve(res);
      this.callOnUpdateChange(this.update, false);
      this.update = false;
    });
    return this.deferredOverview.promise;
  }

  /**
   * Loads all tasks.
   * @returns <promise>
   */
  loadAllTasks (pgnum, loading) {
    if (_.isUndefined(loading)) {
      loading = this.$q.defer();
    }
    if (_.isUndefined(pgnum)) {
      pgnum = 1;
    }
    this.taskQueueService.get({
      pageSize: 100,
      page: pgnum
    })
      .$promise
      .then((res) => {
        res.results.forEach((task) => {
          this.tasks[task.status].push(task);
        });
        if (res.next !== null) {
          this.loadAllTasks(++pgnum, loading);
        } else {
          loading.resolve({
            tasks: this.tasks,
            oldTasks: this.oldTasks
          });
        }
      });
    return loading.promise;
  }

  callOnUpdateChange (update, prev) {
    if (_.isFunction(this.onUpdateChange)) {
      this.onUpdateChange(update, prev);
    }
  }

  setOnUpdateChange (onUpdateChange) {
    this.onUpdateChange = onUpdateChange;
  }
}
