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
const helpers = require("../../common.js");
class CephNfsManageService {

  constructor () {
    this.manageServiceButton = element(by.css(".tc_manageService"));

    this.state = element.all(by.css(".tc_state"));
    this.stopServiceButton = element.all(by.css(".tc_stopService"));
    this.startServiceButton = element.all(by.css(".tc_startService"));

    this.closeButton = element.all(by.id("close"));
  }

  startAllIfStopped () {
    this.manageServiceButton.click();
    browser.findElements(by.css(".tc_startService")).then(() => {
      this.startServiceButton.click();
      this.state.count().then((count) => {
        for (let n = 0; n < count; n++) {
          this.waitForState("Running", n);
        }
        this.closeButton.click();
      });
    }).catch(() => {
      this.closeButton.click();
    });
  }

  /**
   * Waits until state @n reaches @state
   *
   * @param {any} state name of the desired state
   * @param {any} n position of the state in the list
   * @memberof CephNfsManageService
   */
  waitForState (state, n) {
    let nState = this.state.get(n);
    let nSpan = nState.element(by.cssContainingText("span span", state));
    helpers.waitForElement(nSpan);
  }
}

module.exports = CephNfsManageService;
