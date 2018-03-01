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

describe("task-queue-delete-modal", () => {
  let ctrl;
  let scope;
  let modalTemplate;
  let currentTemplate;
  let $compile;
  let $componentController;
  let $rootScope;
  let taskQueueService;

  const modalInstance = {
    closeMessage: "",
    close: (msg) => {
      modalInstance.closeMessage = msg;
    }
  };

  const deletion = (n, state, tasks, failures, msg) => {
    expect(ctrl.finishedTasks).toBe(0);
    expect(ctrl.pendingDeletionFailure.length).toBe(0);
    if (state === "Running" || state === "Not Started") {
      fakeGet(tasks);
    }
    ctrl.tasks = createTasks(n, [state]);
    ctrl.deleteTasks(ctrl.tasks.entries());
    expect(ctrl.finishedTasks).toBe(n);
    expect(ctrl.pendingDeletionFailure.length).toBe(failures);
    expect(modalInstance.closeMessage).toBe(msg);
  };

  const fakeGet = (tasks) => {
    tasks = tasks.slice().reverse();
    spyOn(taskQueueService, "get").and.returnValue(
      {
        $promise: {
          then: callback => callback(tasks.pop())
        }
      }
    );
  };

  const createTasks = (n, states, description) => {
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push(createTask(states[i % states.length], i, description + "_" + i));
    }
    return list;
  };

  const createTask = (status, id, description) => ({
    status: status,
    id: id,
    description: description,
    last_modified: "2018-02-27T16:13:02.120463"
  });

  beforeEach(angular.mock.module("openattic", "openattic.taskQueue"));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get("$rootScope");
    $componentController = $injector.get("$componentController");
    $compile = $injector.get("$compile");
    taskQueueService = $injector.get("taskQueueService");
  }));

  beforeEach(() => {
    modalTemplate = require("./task-queue-delete-modal.component.html");
    scope = $rootScope.$new();
    ctrl = $componentController("taskQueueDeleteModalComponent", {$scope: scope}, {});
    modalInstance.closeMessage = "";
    ctrl.modalInstance = modalInstance;
    spyOn(taskQueueService, "delete").and.returnValue(
      {
        $promise: {
          then: callback => callback()
        }
      }
    );
  });

  describe("template", () => {
    const updateTemplate = () => {
      currentTemplate = $compile(angular.element("<div></div>").html(modalTemplate))(scope);
      scope.$digest();
    };

    const getElement = (search) => $(currentTemplate).find(search);

    const expectHidden = ($e, b) => expect($e.hasClass("ng-hide")).toBe(b);

    const expectMsg = ($e, s) => expect($e.text().trim().replace(/\n/g, "").replace(/ +/g, " ")).toBe(s);

    it("should show the tasks description for a single deletion", () => {
      ctrl.tasks = createTasks(1, ["Finished"], "taskUnit");
      updateTemplate();
      const $msg = getElement(".tc_delete_one");
      expectHidden($msg, false);
      expectMsg($msg, "You are about to delete taskUnit_0 task which is finished " +
                  "and was last modified on Feb 27, 2018 4:13:02 PM.");
    });

    it("should not show the multi deletion dialog on a single delete", () => {
      ctrl.tasks = createTasks(1, ["Failed"], "taskUnit");
      updateTemplate();
      expectHidden(getElement(".tc_delete_multiple"), true);
    });

    it("should show pending deletion warning", () => {
      ctrl.tasks = createTasks(2, ["Not Started", "Running"], "taskUnit");
      updateTemplate();
      const $msg = getElement(".text-danger");
      expectMsg($msg, "If you delete running tasks, it will abort the execution" +
                           " and won't roll back what has been done so far!");
      expectHidden($msg, false);
    });

    it("should not show pending deletion warning if no tasks have a pending status", () => {
      ctrl.tasks = createTasks(2, ["Failed", "Finished"], "taskUnit");
      updateTemplate();
      expectHidden(getElement(".text-danger"), true);
    });

    it("should show the multi deletion dialog", () => {
      ctrl.tasks = createTasks(10, ["Failed"], "taskUnit");
      updateTemplate();
      const $msg = getElement(".tc_delete_multiple");
      const $list = getElement(".tc-tasks-to-delete");
      expectHidden($msg, false);
      expectMsg($msg, "You are about to delete 10 tasks.");
      expectHidden($list, false);
      expect($list.find("li").length).toBe(10);
    });

    it("should only show the waiting dialog if processing", () => {
      ctrl.tasks = createTasks(15, ["Running"], "taskUnit");
      ctrl.waiting = true;
      updateTemplate();
      expectHidden(getElement(".tc-confirm-dialog"), true);
      expectHidden(getElement(".tc-waiting"), false);
    });

    it("should show a progress in the waiting dialog", () => {
      const getUpdatedElement = () => getElement(".tc-waiting").children();
      const isProgressMsg = (s) => {
        updateTemplate();
        expectMsg(getUpdatedElement().first(), s);
      };
      ctrl.tasks = createTasks(20, ["Finished"], "taskUnit");
      ctrl.waiting = true;
      ctrl.finishedTasks = 11;
      isProgressMsg("Processing deletion requests: 11 of 20");
      ctrl.finishedTasks++;
      isProgressMsg("Processing deletion requests: 12 of 20");
      expectHidden(getUpdatedElement().last(), true);
    });

    it("should show failed in the waiting dialog", () => {
      deletion(25, "Running", createTasks(25, ["Running", "Finished"]), 12, "");
      ctrl.waiting = true;
      updateTemplate();
      const $msg = getElement(".tc-waiting").children().last();
      expectHidden($msg, false);
      expectMsg($msg, "Couldn't delete 12 tasks.");
    });

    it("should show the moved tasks dialog", () => {
      deletion(30, "Not Started", createTasks(30, ["Running", "Failed", "Finished"]), 20, "");
      updateTemplate();
      const $dialog = getElement(".tc-moved-tasks");
      const $list = $dialog.find("li").children();
      expectHidden($dialog.parent(), false);
      expectMsg($dialog.find(".panel-title"), "Couldn't delete the following 20 Tasks");
      expect($list.length).toBe(20);
      expectMsg($list.first(), "undefined_1 changed from Not Started to Failed");
      expectMsg($list.last(), "undefined_29 changed from Not Started to Finished");
    });

    it("should show the default footer if not processing and no failed tasks", () => {
      ctrl.tasks = createTasks(35, ["Finished"], "taskUnit");
      updateTemplate();
      const $footer = getElement(".openattic-modal-footer").children();
      const $defaultFooter = $footer.first();
      const $buttons = $defaultFooter.children();
      expectHidden($defaultFooter, false);
      expectHidden($footer.last(), true);
      expectMsg($buttons.first(), "Delete");
      expectMsg($buttons.last(), "Cancel");
      expect($buttons.length).toBe(2);
    });

    it("should show the waiting/failed footer if processing or for failed tasks", () => {
      deletion(40, "Not Started", createTasks(40, ["Running", "Finished"]), 20, "");
      updateTemplate();
      const $footer = getElement(".openattic-modal-footer").children();
      const $waitingFooter = $footer.last();
      const $buttons = $waitingFooter.children();
      expectHidden($footer.first(), true);
      expectHidden($waitingFooter, false);
      expectMsg($buttons.first(), "Close");
      expect($buttons.length).toBe(1);
    });
  });

  describe("controller", () => {
    const successfulDeletion = (n, state) => {
      deletion(n, state, createTasks(n, [state]), 0, "deleted");
    };

    it("should test isPendingTask", () => {
      expect(ctrl.isPendingTask(createTask("Not Started"))).toBe(true);
      expect(ctrl.isPendingTask(createTask("Running"))).toBe(true);
      expect(ctrl.isPendingTask(createTask("Failed"))).toBe(false);
      expect(ctrl.isPendingTask(createTask("Finished"))).toBe(false);
    });

    it("should test 'Not Started' deletion without state change", () => {
      successfulDeletion(5, "Not Started");
    });

    it("should test 'Not Started' deletion with state change to 'Running'", () => {
      deletion(10, "Not Started", createTasks(10, ["Running"]), 0, "deleted");
    });

    it("should test 'Running' deletion without state change", () => {
      successfulDeletion(15, "Running");
    });

    it("should test 'Running' deletion with state change to 'Failed'", () => {
      deletion(20, "Running", createTasks(20, ["Running", "Failed"]), 10, "");
      // get dialog is still open stuff
    });

    it("should test 'Running' deletion with state change to 'Finished'", () => {
      deletion(25, "Running", createTasks(25, ["Running", "Finished"]), 12, "");
      // get dialog is still open stuff
    });

    it("should test 'Failed' deletion", () => {
      successfulDeletion(30, "Failed");
    });

    it("should test 'Finished' deletion", () => {
      successfulDeletion(35, "Finished");
    });
  });
});

