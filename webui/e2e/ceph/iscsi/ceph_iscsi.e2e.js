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

const helpers = require("../../common.js");
const CephIscsiTable = require("./CephIscsiTable.js");
const CephIscsiForm = require("./CephIscsiForm.js");
const CephIscsiDetails = require("./CephIscsiDetails.js");
const CephIscsiManageService = require("./CephIscsiManageService");

describe("ceph iscsi", function () {

  const table = new CephIscsiTable();
  const form = new CephIscsiForm();
  const details = new CephIscsiDetails();
  const manageService = new CephIscsiManageService();

  const baseIqn = "iqn.2016-06.org.openattic:storage:disk.";
  const initiatorIqn = baseIqn + "sn-a8675310";
  const addIqn = baseIqn + "tc-add";
  const editIqn = baseIqn + "tc-edit";
  const cloneIqn = baseIqn + "tc-clone";

  const expectDetails = () => {
    expect(details.portalsDD.getText()).toMatch(/.*: \d+\.\d+\.\d+\.\d+/);
    expect(details.imagesDD.getText()).toMatch(/.*: .* \(lun: 0\)/);
    expect(details.noAuthenticationDD.get(0).isPresent()).toBe(false);
    expect(details.userDD.get(0).getText()).toBe("TargetUser");
    expect(details.initiatorDD.get(0).getText()).toBe(initiatorIqn);
    expect(details.mutualUserDD.get(0).getText()).toBe("TargetMutualUser (Enabled)");
    expect(details.discoveryUserDD.get(0).getText()).toBe("TargetDiscoveryUser (Enabled)");
    expect(details.discoveryMutualUserDD.get(0).getText()).toBe("TargetDiscoveryMutualUser (Enabled)");
  };

  const clickSubmit = () => {
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  };

  beforeAll(function () {
    helpers.login();
    helpers.setLocation("ceph/iscsi");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    manageService.startAllIfStopped();
  });

  it("should check the ceph iSCSI list target url", function () {
    helpers.checkLocation("ceph/iscsi");
  });

  it("should check the ceph iSCSI add target url", function () {
  });

  it("should add a target", function () {
    table.addTarget();
    helpers.checkLocation("ceph/.*/iscsi/add");

    helpers.changeInput(form.targetIdInput, addIqn);
    form.addPortal(0);
    form.addImage(0);
    form.authenticationCheckbox.click();
    helpers.changeInput(form.userInput, "TargetUser");
    helpers.changeInput(form.passwordInput, "TargetPassword");
    form.addInitiator();
    helpers.changeInput(form.initiatorsInput.get(0), initiatorIqn);
    form.mutualAuthenticationCheckbox.click();
    helpers.changeInput(form.mutualUserInput, "TargetMutualUser");
    helpers.changeInput(form.mutualPasswordInput, "TargetMutualPassword");
    form.discoveryAuthenticationCheckbox.click();
    helpers.changeInput(form.discoveryUserInput, "TargetDiscoveryUser");
    helpers.changeInput(form.discoveryPasswordInput, "TargetDiscoveryPassword");
    form.discoveryMutualAuthenticationCheckbox.click();
    helpers.changeInput(form.discoveryMutualUserInput, "TargetDiscoveryMutualUser");
    helpers.changeInput(form.discoveryMutualPasswordInput, "TargetDiscoveryMutualPassword");
    clickSubmit();

    table.clickRowByTargetId(addIqn);
    expectDetails();
  });

  it("should edit target", () => {
    table.editTarget(addIqn);
    helpers.checkLocation("ceph/.*/iscsi/edit/" + addIqn);

    helpers.changeInput(form.targetIdInput, editIqn);
    clickSubmit();

    table.clickRowByTargetId(editIqn);
    expectDetails();
  });

  it("should clone target", () => {
    table.cloneTarget(editIqn);
    helpers.checkLocation("ceph/.*/iscsi/clone/" + editIqn);

    helpers.changeInput(form.targetIdInput, cloneIqn);
    clickSubmit();

    table.clickRowByTargetId(cloneIqn);
    expectDetails();
  });

  it("should remove all targets", () => {
    table.removeTarget(editIqn);
    table.removeTarget(cloneIqn);
  });

  afterAll(function () {
    console.log("ceph_iscsi -> ceph_iscsi.e2e.js");
  });

});
