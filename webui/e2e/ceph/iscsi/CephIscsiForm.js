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

var CephIscsiForm = function () {

  this.panelTitle = element(by.css(".tc_panelTitle"));

  this.imageSettingsModalDialog = element(by.tagName("ceph-iscsi-form-image-settings-modal"));

  this.targetIdInput = element(by.model("$ctrl.model.targetId"));
  this.targetIdRequired = element(by.css(".tc_targetIdRequired"));
  this.targetIdInvalid = element(by.css(".tc_targetIdInvalid"));

  this.portalsRequired = element(by.css(".tc_portalsRequired"));

  this.imagesRequired = element(by.css(".tc_imagesRequired"));
  this.imageFeatureError = element(by.css(".tc_addImageFeatureError"));

  this.authenticationCheckbox = element(by.model("$ctrl.model.authentication.hasAuthentication"));
  this.userInput = element(by.model("$ctrl.model.authentication.user"));
  this.userRequired = element(by.css(".tc_userRequired"));
  this.passwordInput = element(by.model("$ctrl.model.authentication.password"));
  this.passwordRequired = element(by.css(".tc_passwordRequired"));

  this.initiatorsInput = element.all(by.model("$ctrl.model.authentication.initiators[$index]"));
  this.initiatorsRequired = element.all(by.css(".tc_InitiatorRequired"));
  this.initiatorsInvalid = element.all(by.css(".tc_InitiatorInvalid"));

  this.lunIdInput = element(by.model("$ctrl.settings.lun"));
  this.lunIdRequired = element(by.css(".tc_imageLunRequired"));

  this.mutualAuthenticationCheckbox = element(by.model("$ctrl.model.authentication.hasMutualAuthentication"));
  this.mutualUserInput = element(by.model("$ctrl.model.authentication.mutualUser"));
  this.mutualUserRequired = element(by.css(".tc_mutualUserRequired"));
  this.mutualPasswordInput = element(by.model("$ctrl.model.authentication.mutualPassword"));
  this.mutualPasswordRequired = element(by.css(".tc_mutualPasswordRequired"));

  this.discoveryAuthenticationCheckbox = element(by.model("$ctrl.model.authentication.hasDiscoveryAuthentication"));
  this.discoveryUserInput = element(by.model("$ctrl.model.authentication.discoveryUser"));
  this.discoveryUserRequired = element(by.css(".tc_discoveryUserRequired"));
  this.discoveryPasswordInput = element(by.model("$ctrl.model.authentication.discoveryPassword"));
  this.discoveryPasswordRequired = element(by.css(".tc_discoveryPasswordRequired"));

  this.discoveryMutualAuthenticationCheckbox =
    element(by.model("$ctrl.model.authentication.hasDiscoveryMutualAuthentication"));
  this.discoveryMutualUserInput = element(by.model("$ctrl.model.authentication.discoveryMutualUser"));
  this.discoveryMutualUserRequired = element(by.css(".tc_discoveryMutualUserRequired"));
  this.discoveryMutualPasswordInput = element(by.model("$ctrl.model.authentication.discoveryMutualPassword"));
  this.discoveryMutualPasswordRequired = element(by.css(".tc_discoveryMutualPasswordRequired"));

  this.submitButton = element(by.css(".tc_submitButton"));
  this.backButton = element(by.css(".tc_backButton"));

  this.addPortal = function (index) {
    element(by.css(".tc_addPortalButton")).click();
    element.all(by.css(".tc_addPortalItem")).get(index).click();
  };

  this.addImage = function (index) {
    element(by.css(".tc_addImageButton")).click();
    element.all(by.css(".tc_addImageItem")).get(index).click();
  };

  this.addImageByName = function (imageName) {
    element(by.css(".tc_addImageButton")).click();
    element(by.cssContainingText(".tc_addImageItem", imageName)).click();
  };

  this.openImageSettingsModal = function (index) {
    element.all(by.css(".tc_imageSettingsButton")).get(index).click();
  };

  this.confirmImageSettingsModal = function () {
    element.all(by.css(".tc_submitButton")).first().click();
  };

  this.addInitiator = function () {
    element(by.css(".tc_addInitiatorButton")).click();
  };

  this.removeInitiator = function (index) {
    element.all(by.css(".tc_initiatorRemoveButton")).get(index).click();
  };
};
module.exports = CephIscsiForm;
