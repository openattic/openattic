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

describe("task-queue-modal", () => {
  let ctrl;
  let scope;
  let modalTemplate;
  let currentTemplate;
  let $compile;
  let $componentController;
  let $rootScope;

  const updateTemplate = () => {
    currentTemplate = $compile(angular.element("<div></div>").html(modalTemplate))(scope);
    scope.$digest();
  };

  beforeEach(angular.mock.module("openattic", "openattic.taskQueue"));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get("$rootScope");
    $componentController = $injector.get("$componentController");
    $compile = $injector.get("$compile");
  }));

  beforeEach(() => {
    modalTemplate = require("./task-queue-modal.component.html");
    scope = $rootScope.$new();
    ctrl = $componentController("taskQueueModalComponent", {$scope: scope}, {});
  });

  describe("template", () => {
    describe("tab texts", () => {
      beforeEach(() => {
        Object.keys(ctrl.tabs).forEach((key, index) => {
          ctrl.tabs[key].count = index + 1;
        });
        updateTemplate();
      });

      it("should display 0 pending tasks", () => {
        ctrl.tabs.pending.count = 0;
        updateTemplate();
        const tabText = $(currentTemplate.find("a")[0]).text();
        expect(tabText).toMatch("Pending");
        expect(tabText).toMatch("(0)");
      });

      it("should display 1 pending task", () => {
        const tabText = $(currentTemplate.find("a")[0]).text();
        expect(tabText).toMatch("Pending");
        expect(tabText).toMatch("(1)");
      });

      it("should display 2 failed tasks", () => {
        const tabText = $(currentTemplate.find("a")[1]).text();
        expect(tabText).toMatch("Failed");
        expect(tabText).toMatch("(2)");
      });

      it("should display 3 finished tasks", () => {
        const tabText = $(currentTemplate.find("a")[2]).text();
        expect(tabText).toMatch("Finished");
        expect(tabText).toMatch("(3)");
      });
    });
  });

  describe("component controller", () => {
    const setTabCount = (pending, failed, finished) => {
      ctrl.tabs.pending.count = pending;
      ctrl.tabs.failed.count = failed;
      ctrl.tabs.finished.count = finished;
      ctrl.selectUrgentTab();
    };

    const expectTabToBe = (name) => {
      const tabs = ["Pending", "Failed", "Finished"];
      expect(ctrl.modalTabData.active).toBe(tabs.indexOf(name));
      expect(ctrl.getActiveTab().name).toBe(name);
    };

    it("should select pending", () => {
      setTabCount(0, 0, 0);
      expectTabToBe("Pending");
      setTabCount(20, 0, 0);
      expectTabToBe("Pending");
      setTabCount(20, 0, 238);
      expectTabToBe("Pending");
    });

    it("should select failed", () => {
      setTabCount(0, 1, 0);
      expectTabToBe("Failed");
      setTabCount(10, 1, 0);
      expectTabToBe("Failed");
      setTabCount(0, 1, 20);
      expectTabToBe("Failed");
      setTabCount(30, 15, 45);
      expectTabToBe("Failed");
    });

    it("should select finished", () => {
      setTabCount(0, 0, 1);
      expectTabToBe("Finished");
    });
  });

  describe("timeBetween", () => {
    let testArray;

    const oldT = {
      "status": "Running",
      "estimated": null,
      "result": null,
      "id": 56,
      "created": "2019-02-14T14:27:51.171715",
      "last_modified": "2019-02-14T14:27:54.510558",
      "percent": 0,
      "description": "wait"
    };

    const newT = {
      "status": "Finished",
      "estimated": null,
      "result": true,
      "id": 56,
      "created": "2019-02-14T14:27:51.171715",
      "last_modified": "2019-02-14T14:29:49.265645",
      "percent": 100,
      "description": "wait"
    };

    const mockTask = (created, modified, id = 1, percentage = 0) => ({
      status: "Running",
      estimated: null,
      result: null,
      id: id,
      created: created,
      last_modified: modified,
      percentage: percentage,
      description: "mock-task"
    });

    beforeEach(() => {
      testArray = [
        oldT,
        newT,
        mockTask("2020-02-20T20:20:20.265645", "2020-02-24T23:26:25.265645", 1, 50),
        mockTask("2020-02-21T21:21:21.265644-0800", "2020-02-24T23:26:25.265645-0800", 2, 25),
        mockTask("2020-02-22T22:22:22.265645+0300", "2020-02-24T23:26:25.265645+0300", 3, 0),
        mockTask("2020-02-20T20:20:20.265645", "2020-02-20T20:20:21.265645", 4, 2)
      ];
    });

    it("test calc run time", () => {
      testArray.forEach(ctrl.calcRuntime, ctrl);
      [
        "3s",
        "1m 58s",
        "4d 3h 6m 5s",
        "3d 2h 5m 4s",
        "2d 1h 4m 3s",
        "1s"
      ].forEach((expected, index) => {
        expect(testArray[index].approxFormat).toBe(expected);
      });
    });

    it("test calc approx", () => {
      testArray.forEach(ctrl.calcApprox, ctrl);
      [
        ["NA", null],
        ["NA", null],
        ["4d 3h 6m", "2020-02-29T01:32:30.265Z"],
        ["9d 6h 15m", "2020-03-05T13:41:37.265Z"],
        ["NA", null],
        ["< 1m", "2020-02-20T19:21:10.265Z"]
      ].forEach((expected, index) => {
        const approxFormat = expected[0];
        const estimated = expected[1];
        const task = testArray[index];
        expect(task.approxFormat).toBe(approxFormat);
        expect(task.estimated && task.estimated.toISOString()).toBe(estimated);
      });
    });

    it("test calc run time in different timezone", () => {
      /**
       * It's not possible to really test different timezones as Date will always rely on system time.
       * But it's possible to do assumptions like if getHours would return the same as getUTCHours,
       * the result should not differ. If it does, something is calculated on a specific time zone bases.
       */
      // eslint-disable-next-line no-extend-native
      Date.prototype.getHours = Date.prototype.getUTCHours;

      testArray.forEach(ctrl.calcRuntime, ctrl);
      [
        "3s",
        "1m 58s",
        "4d 3h 6m 5s",
        "3d 2h 5m 4s",
        "2d 1h 4m 3s",
        "1s"
      ].forEach((expected, index) => {
        expect(testArray[index].approxFormat).toBe(expected);
      });
    });
  });
});
