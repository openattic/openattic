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

  describe("test tab texts", () => {
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
