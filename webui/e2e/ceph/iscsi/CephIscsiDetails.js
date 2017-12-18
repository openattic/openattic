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

var CephIscsiDetails = function () {

  this.panelTitle = element(by.css(".tc_panelTitle"));
  this.portalsDD = element(by.repeater("portal in $ctrl.selection.item.portals"));
  this.imagesDD = element(by.repeater("image in $ctrl.selection.item.images"));
  this.noAuthenticationDD = element.all(by.css(".tc_noAuthentication"));
  this.userDD = element.all(by.binding("$ctrl.selection.item.authentication.user"));
  this.initiatorDD = element.all(by.repeater("initiator in $ctrl.selection.item.authentication.initiators"));
  this.mutualUserDD = element.all(by.binding("$ctrl.selection.item.authentication.mutualUser"));
  this.discoveryUserDD = element.all(by.binding("$ctrl.selection.item.authentication.discoveryUser"));
  this.discoveryMutualUserDD = element.all(by.binding("$ctrl.selection.item.authentication.discoveryMutualUser"));
};
module.exports = CephIscsiDetails;
