/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2018 SUSE LLC
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

describe("oa-task-queue", () => {
  let ctrl;
  let scope;
  let componentTemplate;
  let currentTemplate;
  let $compile;
  let $componentController;
  let $rootScope;
  let taskQueueFetcher;
  let fakeTasks = {
    tasks: {},
    oldTasks: {}
  };

  const updateTemplate = () => {
    currentTemplate = $compile(angular.element("<div></div>").html(componentTemplate))(scope);
    scope.$digest();
  };

  const addFakeTasks = (listLength, prefix, percent) => {
    const list = [];
    for (let i = 0; i < listLength; i++) {
      list.push({
        description: prefix + i,
        percent: percent || i % 100
      });
    }
    return list;
  };

  const updateOverview = (queued, failed, finished, percent) => {
    fakeTasks.oldTasks = fakeTasks.tasks;
    fakeTasks.tasks = {
      "Running": addFakeTasks(queued, "queued", percent),
      "Not Started": [],
      "Exception": addFakeTasks(failed, "failed", percent),
      "Aborted": [],
      "Finished": addFakeTasks(finished, "finished", 100)
    };
    ctrl.updateTaskOverview();
    updateTemplate();
  };

  beforeEach(angular.mock.module("openattic", "openattic.taskQueue"));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get("$rootScope");
    $componentController = $injector.get("$componentController");
    $compile = $injector.get("$compile");
    taskQueueFetcher = $injector.get("taskQueueFetcher");
  }));

  beforeEach(() => {
    componentTemplate = require("./oa-task-queue.component.html");
    scope = $rootScope.$new();
    ctrl = $componentController("oaTaskQueue", {$scope: scope}, {});
    spyOn(taskQueueFetcher, "loadOverview").and.returnValue(
      {
        then: (callback) => callback(fakeTasks)
      }
    );
  });

  it("should display no running or failed tasks", () => {
    updateOverview(0, 0, 10);
    expect(currentTemplate.text().trim()).toBe("Background-Tasks");
    expect($(currentTemplate.find("a")).attr("uib-tooltip")).toBe("No tasks running");
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-o");
  });

  it("should display 1 running task at 90%", () => {
    updateOverview(1, 0, 0, 90);
    expect(currentTemplate.text().trim()).toBe("1 Background-Task");
    expect($(currentTemplate.find("a")).attr("uib-tooltip")).toBe("90% done in average");
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-end");
  });

  it("should display 200 running tasks at 49%", () => {
    updateOverview(200, 0, 20);
    expect(currentTemplate.text().trim()).toBe("200 Background-Tasks");
    expect($(currentTemplate.find("a")).attr("uib-tooltip")).toBe("49% done in average");
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-half");
  });

  it("should display 1 failed task at 4%", () => {
    updateOverview(10, 1, 30);
    expect(currentTemplate.text().trim()).toBe("1 Failed-Task");
    expect($(currentTemplate.find("a")).attr("uib-tooltip")).toBe("4% done in average");
    expect(ctrl.taskOverview.icon).toBe("fa-warning icon-warning");
  });

  it("should display 100 failed tasks at 4%", () => {
    updateOverview(10, 100, 3);
    expect(currentTemplate.text().trim()).toBe("100 Failed-Tasks");
    expect($(currentTemplate.find("a")).attr("uib-tooltip")).toBe("4% done in average");
    expect(ctrl.taskOverview.icon).toBe("fa-warning icon-warning");
  });

  it("should display start hourglass between 0 and 33 percent", () => {
    updateOverview(1, 0, 0, 0);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-start");
    updateOverview(1, 0, 0, 33);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-start");
    updateOverview(1, 0, 0, 34);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-half");
  });

  it("should display half hourglass between 34 and 67 percent", () => {
    updateOverview(1, 0, 0, 34);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-half");
    updateOverview(1, 0, 0, 67);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-half");
    updateOverview(1, 0, 0, 68);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-end");
  });

  it("should display end hourglass between 68 and 100 percent", () => {
    updateOverview(1, 0, 0, 68);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-end");
    updateOverview(1, 0, 0, 100);
    expect(ctrl.taskOverview.icon).toBe("fa-hourglass-end");
  });

});

