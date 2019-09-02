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

const helpers = require("../../common.js");
const CephPoolCommon = require("./cephPoolCommon.js");
const EcProfilePage = require("./ec_profile/ec_profile.page.js");

describe("ceph pool creation", () => {
  const cephPoolProperties = new CephPoolCommon();
  const ecHelper = new EcProfilePage();

  beforeAll(() => {
    helpers.login();
    cephPoolProperties.cephPools.click();
    helpers.deleteAllIfExists("e2e_");
  });

  describe("Replicated pool", () => {
    it("should create replicated pool", () => {
      cephPoolProperties.addButton.click();
      cephPoolProperties.createPool("e2e_replicated_with_8_pgs", "replicated", 8, false, "cephfs", "replicated_rule");
    });

    it("should delete replicated pool", () => {
      cephPoolProperties.deletePool("e2e_replicated_with_8_pgs");
    });
  });

  describe("Erasure code pool with overwrite", () => {
    it("should create erasure code pool with overwrite enabled", () => {
      cephPoolProperties.addButton.click();
      cephPoolProperties.fillForm("e2e_erasure_overwrite", "erasure", 32, false, "cephfs", null, "default");
      cephPoolProperties.checkCheckboxToBe(element(by.model("$ctrl.data.flags.ec_overwrites")));
      cephPoolProperties.submitForm("e2e_erasure_overwrite", "erasure", 32);
      expect(element(by.className("tc-flag-ec_overwrites")).isDisplayed()).toBe(true);
    });

    it("should delete the created erasure code pool with overwrite enabled", () => {
      cephPoolProperties.deletePool("e2e_erasure_overwrite");
    });
  });

  describe("Erasure code pool with profile", () => {
    const pool = "e2e_ec_profiled_pool";
    const profile = "e2e_ec_profile_selection_tests";
    const fe = cephPoolProperties.formElements;

    it("should create erasure code pool with profile", () => {
      cephPoolProperties.addButton.click();
      cephPoolProperties.fillForm(pool, "erasure", 4, false, "rgw", null, "default");

      // Create profile
      fe.erasureProfiles.items.addProfile.click();
      helpers.changeInput(ecHelper.name, profile);
      helpers.changeInput(ecHelper.k, "2");
      helpers.changeInput(ecHelper.m, "1");
      ecHelper.submitBtn.click();

      cephPoolProperties.submitForm(pool, "erasure", 4);
    });

    it("should delete pool", () => {
      cephPoolProperties.deletePool(pool);
    });

    it("should delete the profile", () => {
      cephPoolProperties.addButton.click();
      ecHelper.deleteProfile(profile);
      helpers.leaveForm(true);
    });

    it("should not have created a new rule during creation", () => {
      cephPoolProperties.addButton.click();
      helpers.selectOption(cephPoolProperties.getFormElement(fe.types), "Erasure");
      expect(cephPoolProperties.getFormElement(fe.crushRules)
        .all(by.cssContainingText("option", pool)).isPresent()).toBe(false);
      helpers.leaveForm(true);
    });
  });

  describe("Pool with compression", () => {
    it("should create erasure code pool with compression", () => {
      cephPoolProperties.addButton.click();
      cephPoolProperties.createPool(
        "e2e_erasure_compression", "erasure", 16, true, "cephfs", "erasure-code", "default"
      );
    });

    it("should delete the created erasure code pool with compression", () => {
      cephPoolProperties.deletePool("e2e_erasure_compression");
    });
  });

  afterAll(() => {
    console.log("ceph_pool_creation -> ceph_pool_creation.e2e.js");
  });
});
