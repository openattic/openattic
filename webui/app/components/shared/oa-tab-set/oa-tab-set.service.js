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

import _ from "lodash";

/**
 * You need to define some things in order to use it correctly and well, here is an short example and explanation
 * how to use it in a controller (look at the directive for an directive usage example):
 *
 *   tabData = {
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
 *   tabConfig = {
 *      type: "<route name for the state>",
 *      linkedBy: "<attribute child of $scope.selection.item>",
 *      jumpTo: "<css id of the content element>"
 *    };
 */
export default class OaTabSetService {
  constructor ($state) {
    this.$state = $state;
  }
  changeTab (goHere, tabData, tabConfig, selection, index) {
    if (_.isUndefined(index)) {
      Object.keys(tabData.tabs).some((tabName, i) => {
        index = i;
        return tabData.tabs[tabName].state === goHere;
      });
    }
    tabData.active = index;
    // Make sure that the first object in the selection is an object.
    if (!_.isArray(selection.items) || !selection.items.length ||
        !_.isObjectLike(selection.items[0])) {
      return;
    }
    let stateJump = {};
    stateJump[tabConfig.type] = selection.items[0][tabConfig.linkedBy];
    stateJump["#"] = tabConfig.jumpTo;
    this.$state.go(goHere, stateJump);
  }
}
