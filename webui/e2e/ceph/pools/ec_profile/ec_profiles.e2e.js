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

const helpers = require("../../../common.js");
const EcProfilePage = require("./ec_profile.page.js");

describe("test erasure coded profile creation and deletion through ceph pool form", () => {
  const profileName = "e2e_test_profile";
  const ecHelper = new EcProfilePage();

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/pools/add");
    helpers.selectOption(ecHelper.poolHelper.formElements.types.byModel, "Erasure");
    ecHelper.deleteProfile(profileName);
  });

  it("should create new ec profile", () => {
    ecHelper.buttons.addProfile.click();
    helpers.changeInput(ecHelper.name, profileName);
    helpers.changeInput(ecHelper.k, "2");
    helpers.changeInput(ecHelper.m, "6");
    helpers.selectOption(ecHelper.rulesetDomain, 2);
    expect(ecHelper.submitBtn.isEnabled()).toBe(true);
    ecHelper.submitBtn.click();
  });

  it("should delete ec profile", () => {
    helpers.selectOption(ecHelper.selection, "e2e_test_profile");
    ecHelper.deleteProfile(profileName, true);
    ecHelper.deleteProfile(profileName, false);
  });

  afterAll(() => {
    console.log("ec_profiles -> ec_profiles.e2e.js");
  });
});
