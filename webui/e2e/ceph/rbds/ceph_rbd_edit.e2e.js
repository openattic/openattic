"use strict";

const helpers = require("../../common.js");
const RbdCommons = require("./cephRbdCommon.js");

describe("ceph rbd editing", () => {
  const rbdProperties = new RbdCommons();
  const rbdName = "e2e_rbd_edit";

  beforeAll(function () {
    helpers.login();
    rbdProperties.cephRBDs.click();
    helpers.deleteAllIfExists(rbdName);
  });

  it("Should create a RBD", () => {
    let features = [0, 0, 0, 1, 0, 0, -1];

    rbdProperties.selectPool("iscsi-images");
    rbdProperties.createRbd(rbdName, "11.00 MiB", "4.00 MiB", features);
  });

  it("Should change the size and features", () => {
    helpers.selectAndEdit(rbdName);

    helpers.changeInput(rbdProperties.size, "22.00 MiB");
    let feature = element(by.css("." + rbdProperties.formElements.features.items["object-map"].class));
    rbdProperties.checkCheckboxToBe(feature, true);

    rbdProperties.submitButton.click();
  });

  it("Should confirm changes", () => {
    helpers.get_list_element(rbdName).click();
    helpers.checkDetailIsDisplayed("22.00 MiB");
    helpers.checkDetailIsDisplayed("Object map");
  });

  it("Should delete the RBD", () => {
    rbdProperties.deleteRbd(rbdName);
  });

  afterAll(function () {
    console.log("ceph_rbd_creation -> ceph_rbd_creation.e2e.js");
  });
});
