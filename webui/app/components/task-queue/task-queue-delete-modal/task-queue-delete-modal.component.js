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

class TaskQueueDeleteModalComponent {

  constructor (taskQueueService, Notification) {
    this.Notification = Notification;
    this.taskQueueService = taskQueueService;

    this.waiting = false;
    this.finishedTasks = 0;
    this.pending = ["Running", "Not Started"];
    this.pendingDeletionFailure = [];
  }

  $onInit () {
    //Now it can't be changed by a possible current asynchronous call.
    this.tasks = _.cloneDeep(this.resolve.taskSelection);
  }

  /**
   * To detect a pending task.
   * @return {boolean}
   */
  isPendingTask (task) {
    return this.pending.indexOf(task.status) > -1;
  }

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
  deleteTasks (entries) {
    let taskEntry = entries.next().value;
    let task = {};
    if (taskEntry) {
      if (taskEntry[0] === 0) {
        this.waiting = true;
      }
      task = taskEntry[1];
      this.finishedTasks++;
      if (this.isPendingTask(task)) {
        this.taskQueueService.get({id: task.id})
          .$promise
          .then((res) => {
            if (this.isPendingTask(res)) {
              this.taskDelete(task, entries);
            } else {
              this.pendingDeletionFailure.push([task, res]);
              this.deleteTasks(entries);
            }
          }, () => {
            this.deleteTasks(entries);
          });
      } else {
        this.taskDelete(task, entries);
      }
    } else {
      this.waiting = false;
      if (this.pendingDeletionFailure.length > 0) {
        this.Notification.warning({
          title: "Couldn't delete " + this.pendingDeletionFailure.length + " tasks",
          msg: "More details are shown in the dialog."
        });
      } else {
        this.modalInstance.close("deleted");
      }
    }
  }

  /**
   * This will close the dialog, if there were moved tasks during deletion.
   */
  closeWithWarnings () {
    this.modalInstance.close("Deleted without " + this.pendingDeletionFailure.length + " moved tasks.");
  }

  /**
   * This will delete a task and call deleteTask if successfully deleted the task.
   */
  taskDelete (task, entries) {
    this.taskQueueService.delete({id: task.id})
      .$promise
      .then(() => {
        this.deleteTasks(entries);
      }, (error) => {
        this.Notification.error({
          title: "Task deletion failure",
          msg: "Task " + task.description + "(" + task.id + ") couldn't be deleted.",
          timeout: 10000
        }, error);
        this.deleteTasks(entries);
      });
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./task-queue-delete-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: TaskQueueDeleteModalComponent
};
