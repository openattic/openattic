/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.shared");
app.component("oaTabSet", {
  templateUrl: "components/shared/oa-tab-set/oa-tab-set.component.html",
  bindings: {
    tabData: "=",
    tabConfig: "=",
    selection: "="
  },
  controller: function (oaTabSetService) {
    var self = this;

    self.$onInit = function () {
      Object.keys(self.tabData.tabs).forEach(function (tabName) {
        var tab = self.tabData.tabs[tabName];
        if (!tab.show) {
          tab.show = "true";
        }
        if (!tab.class) {
          tab.class = "";
        }
        if (!tab.state || !tab.name) {
          throw "Error wrong tab format in " + tab;
        }
      });
    };

    self.changeTab = function (state, index) {
      oaTabSetService.changeTab(state, self.tabData, self.tabConfig, self.selection, index);
    };

    self.showTabSet = function () {
      return Object.keys(self.tabData.tabs).filter(function (tabName) {
        return self.$eval(self.tabData.tabs[tabName].show);
      }).length > 1;
    };
  }
});
