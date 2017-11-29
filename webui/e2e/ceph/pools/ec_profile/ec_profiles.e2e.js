"use strict";

const helpers = require("../../../common.js");
const CephPoolCommon = require("./../cephPoolCommon.js");
const EcProfilePage = require("./ec_profile.page.js");

describe("test erasure coded profile creation and deletion through ceph pool form", () => {
  const profileName = "e2e_test_profile";
  const ecHelper = new EcProfilePage();
  const poolHelper = new CephPoolCommon();
  const fe = poolHelper.formElements.erasureProfiles;
  const selection = fe.byClass;
  const buttons = fe.items;
  const deleteProfile = (name, expectation) => {
    helpers.selectOption(selection, name);
    helpers.getOptionText(selection).then(text => {
      if (expectation !== undefined) {
        expect(text === name).toBe(expectation);
      }
      if (text !== name) {
        return;
      }
      buttons.deleteProfile.click();
      ecHelper.submitBtn.click();
    });
  };

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/pools/add");
    helpers.selectOption(poolHelper.formElements.types.byModel, "Erasure");
    deleteProfile(profileName);
  });

  it("should create new ec profile", () => {
    buttons.addProfile.click();
    helpers.changeInput(ecHelper.name, profileName);
    helpers.changeInput(ecHelper.k, "2");
    helpers.changeInput(ecHelper.m, "6");
    helpers.selectOption(ecHelper.rulesetDomain, 2);
    expect(ecHelper.submitBtn.isEnabled()).toBe(true);
    ecHelper.submitBtn.click();
  });

  it("should delete ec profile", () => {
    helpers.selectOption(selection, "e2e_test_profile");
    deleteProfile(profileName, true);
    deleteProfile(profileName, false);
  });

  afterAll(() => {
    console.log("ec_profiles -> ec_profiles.e2e.js");
  });
});
