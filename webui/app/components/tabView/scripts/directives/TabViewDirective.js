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

var app = angular.module("openattic.tabView");
/**
 * In order to use the directive correctly and well, you first have to set up your controller as explained in the
 * tabViewService. To use it in the template you just have to add the following:
 *
 *   <tab-view tab-data="tabData" tab-config="tabConfig" selection="selection"></tab-view>
 */
app.directive("tabView", function () {
  return {
    restrict: "E",
    scope: {
      tabData: "=",
      tabConfig: "=",
      selection: "="
    },
    templateUrl: "components/tabView/templates/tab.view.html",
    controller: function ($scope, TabViewService) {
      Object.keys($scope.tabData.tabs).forEach(function (tabName) {
        var tab = $scope.tabData.tabs[tabName];
        if (!tab.show) {
          tab.show = "true";
        }
        if (!tab.class) {
          tab.class = "";
        }
        if (!tab.state || !tab.name) {
          throw "Error wrong tab format in " + tabName;
          throw tab;
        }
      });
      TabViewService.setScope($scope);
      $scope.changeTab = TabViewService.changeTab;
    }
  };
});