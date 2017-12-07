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

import globalConfig from "globalConfig";
import _ from "lodash";

class OaTaskQueueComponent {
  constructor (Notification, $uibModal, taskQueueFetcher) {
    this.Notification = Notification;
    this.$uibModal = $uibModal;
    this.taskQueueFetcher = taskQueueFetcher;

    this.taskOverview = {
      firstUpdate: true,
      avr: 0,
      queue: 0,
      icon: "fa-hourglass-o",
      percent: 0,
      tooltip: "No tasks running."
    };
    this.refresh = true;

  }

  $onInit () {
    setInterval(() => {
      this.updateTaskOverview();
    },
    globalConfig.GUI.defaultTaskReloadTime);
  }

  /**
   * Update all needed parts.
   *
   * Hourglass update:
   * The hourglass has four different states which will be set according to
   * the percentage of all running tasks in relation to their count. If
   * there are failed task a warn symbol will be present instead of the
   * hourglass.
   *
   * Tooltip update:
   * The tooltip shows the average percent done over all running tasks.
   *
   * If toasties are needed:
   * Toasties are created if there is a change between the finalized tasks
   * from the last and the current task update.
   */
  updateTaskOverview () {
    if (!this.refresh) {
      return;
    }
    this.taskQueueFetcher.loadOverview().then((allTasks) => {
      let ov = this.taskOverview;
      let tasks = allTasks.tasks;
      ov.percent = 0;
      tasks.Running.forEach((task) => {
        ov.percent += task.percent;
      });
      ov.queue = tasks.Running.length + tasks["Not Started"].length;
      ov.avr = ov.queue !== 0 ? ov.percent / ov.queue : 0;
      ov.icons = ["fa-hourglass-o", "fa-hourglass-start", "fa-hourglass-half", "fa-hourglass-end"];
      ov.icon = ov.queue !== 0 ? ov.icons[Math.floor(ov.avr / 30) + 1] : ov.icons[0];
      ov.tooltip = ov.queue === 0 ? "No tasks running" : parseInt(ov.avr, 10) + "% done in average";
      if (ov.firstUpdate) {
        ov.firstUpdate = false;
      } else {
        this.createNeededToasties(allTasks);
      }
      this.taskOverview = ov;
      ov.failed = tasks.Exception.length + tasks.Aborted.length;
      if (ov.failed) {
        ov.icon = "fa-warning icon-warning";
      }
    });
  }

  /**
   * Opens task queue dialog, stops the refresh timeout and refreshes on close.
   */
  runnersDialog () {
    let taskDialog = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "taskQueueModalComponent",
      size: "lg",
      animation: false
    });
    taskDialog.opened.then(() => {
      this.refresh = false;
    });
    taskDialog.closed.then(() => {
      this.refresh = true;
      this.updateTaskOverview();
    });
  }

  /**
   * Find out which tasks changed to a final state, by comparing the previous and the current fetched tasks.
   * @returns {Array} - Containing all changed task ids.
   */
  getNewFinalTasks (allTasks) {
    let older = allTasks.oldTasks;
    let newer = allTasks.tasks;
    let oldIds = [];
    let newIds = [];
    ["Exception", "Aborted", "Finished"].forEach((state) => {
      if (older[state].length !== newer[state].length) {
        older[state].forEach((task) => {
          oldIds.push(task.id);
        });
        newer[state].forEach((task) => {
          newIds.push(task.id);
        });
      }
    }, this);
    return newIds.filter((id) => {
      return oldIds.indexOf(id) === -1;
    });
  }

  /**
   * One notification for each state is created if one or more tasks changed to
   * final state.
   * The notification will sum up all tasks that changed to this state. At max
   * there will be three notifications.
   * @param {Object} allTasks
   * @param {Object[]} allTasks.tasks[<status>]
   */
  createNeededToasties (allTasks) {
    let moved = this.getNewFinalTasks(allTasks); //id's
    let tasks = allTasks.tasks;
    if (moved.length !== 0) {
      let categories = {
        Finished: {
          tasks: [],
          toastType: "success"
        },
        Aborted: {
          tasks: [],
          toastType: "warning"
        },
        Exception: {
          tasks: [],
          toastType: "error"
        }
      };
      Object.keys(tasks).forEach((state) => {
        tasks[state].forEach((task) => {
          if (moved.indexOf(task.id) !== -1) {
            categories[task.status].tasks.push(task);
          }
        });
      });
      _.forIn(categories, (category, status) => {
        if (category.tasks.length > 0 && category.toastType !== "success") {
          this.Notification[category.toastType]({
            title: status,
            msg: category.tasks.map((task) => {
              return task.description;
            }).join("<br>")
          });
        }
      });
    }
  }
}

export default{
  template: require("./oa-task-queue.component.html"),
  controller: OaTaskQueueComponent
};
