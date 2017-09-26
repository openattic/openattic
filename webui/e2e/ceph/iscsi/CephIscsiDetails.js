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
