"use strict";

const helpers = require("../../common.js");
const CephPoolCommon = require("./cephPoolCommon.js");

describe("ceph pool creation", () => {
  const cephPoolProperties = new CephPoolCommon();

  beforeAll(() => {
    helpers.login();
    cephPoolProperties.cephPools.click();
    helpers.deleteAllIfExists("e2e_");
  });

  it("should create replicated pool", () => {
    cephPoolProperties.addButton.click();
    cephPoolProperties.createPool("e2e_replicated_with_128_pgs", "replicated", 128, false, "cephfs", "replicated_rule");
  });

  it("should delete replicated pool", () => {
    cephPoolProperties.deletePool("e2e_replicated_with_128_pgs");
  });

  it("should create erasure code pool with overwrite enabled", () => {
    cephPoolProperties.addButton.click();
    cephPoolProperties.fillForm("e2e_erasure_overwrite", "erasure", 32, false, "cephfs", "erasure-code", "default");
    cephPoolProperties.checkCheckboxToBe(element(by.model("$ctrl.data.flags.ec_overwrites")));
    cephPoolProperties.submitForm("e2e_erasure_overwrite", "erasure", 32);
    expect(element(by.className("tc-flag-ec_overwrites")).isDisplayed()).toBe(true);
  });

  it("should delete the created erasure code pool with overwrite enabled", () => {
    cephPoolProperties.deletePool("e2e_erasure_overwrite");
  });

  it("should create erasure code pool with compression", () => {
    cephPoolProperties.addButton.click();
    cephPoolProperties.createPool("e2e_erasure_compression", "erasure", 16, true, "cephfs", "erasure-code", "default");
  });

  it("should delete the created erasure code pool with compression", () => {
    cephPoolProperties.deletePool("e2e_erasure_compression");
  });

  afterAll(() => {
    console.log("ceph_pool_creation -> ceph_pool_creation.e2e.js");
  });
});
