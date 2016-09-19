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
 * You need to define some things in order to use it correctly and well, here is an short example and explanation
 * how to use it in a controller (look at the directive for an directive usage example):
 *
 *   $scope.tabData = {
 *      active: 0, // Can be left as it is.
 *      tabs: {
 *        <name for internal use>: {
 *          name: "<name of the tab>"
 *          state: "<state to link to>",
 *          show: "<condition (optional)>",
 *          class: "<css class for the tab (optional)>",
 *        },
 *        ...
 *      }
 *    };
 *   $scope.tabConfig = {
 *      type: "<route name for the state>",
 *      linkedBy: "<attribute child of $scope.selection.item>",
 *      jumpTo: "<css id of the content element>"
 *    };
 *   TabViewService.setScope($scope); // Update the internal scope.
 *   $scope.changeTab = TabViewService.changeTab; // Only get the definition the function.
 */
app.service("TabViewService", function ($state) {
  var scope = {};
  this.setScope = function ($scope) {
    scope = $scope;
  };
  this.changeTab = function (goHere, index) {
    if (index === undefined) {
      Object.keys(scope.tabData.tabs).some(function (tabName, i) {
        index = i;
        return scope.tabData.tabs[tabName].state === goHere;
      });
    }
    scope.tabData.active = index;
    var stateJump = {};
    stateJump[scope.tabConfig.type] = scope.selection.item[scope.tabConfig.linkedBy];
    stateJump["#"] = scope.tabConfig.jumpTo;
    $state.go(goHere, stateJump);
  };
});

