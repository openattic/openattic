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
class CephNfsDetails {

  constructor () {
    this.panelTitle = element(by.css(".tc_panelTitle"));
    this.fsal = element(by.binding("$ctrl.getFsalDesc($ctrl.selection.item.fsal)"));
    this.path = element.all(by.binding("$ctrl.selection.item.path")).get(0);
    this.tag = element(by.binding("$ctrl.selection.item.tag"));
    this.nfsProtocol = element.all(by.repeater("protocol in $ctrl.selection.item.protocols"));
    this.pseudo = element(by.binding("$ctrl.selection.item.pseudo"));
    this.accessType = element.all(by.binding("$ctrl.selection.item.accessType")).get(0);
    this.squash = element(by.binding("$ctrl.selection.item.squash"));
    this.transportProtocol = element.all(by.repeater("transport in $ctrl.selection.item.transports"));
    this.clientAccessType = element.all(by.binding("clientBlock.accessType"));
    this.clientSquash = element.all(by.binding("clientBlock.squash"));
    this.mountCommand = element(by.binding("$ctrl.getMountCommand()"));
  }
}

module.exports = CephNfsDetails;
