"use strict";

const helpers = require("../../common.js");
const CephRgwCommons = require("./cephRgwCommon.js");

describe("ceph rgw buckets", () => {
  let cephRgwCommons = new CephRgwCommons();
  let testUser = {
    user_id: "e2e_tuxdoe",
    display_name: "Tux Doe"
  };
  let testBucket = {
    name: "e2e_bucket",
    owner: "e2e_tuxdoe"
  };

  let addBucket = () => {
    cephRgwCommons.addBucket();
    helpers.checkLocation("ceph/rgw/buckets/add");
  };

  let editBucket = (name) => {
    cephRgwCommons.editBucket(name);
    helpers.checkLocation("ceph/rgw/buckets/edit/" + name);
  };

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/rgw/buckets");
    helpers.deleteAllIfExists("e2e_");
    helpers.setLocation("ceph/rgw/users");
    helpers.deleteAllIfExists("e2e_");
  });

  it("should create test user 'e2e_tuxdoe'", () => {
    helpers.setLocation("ceph/rgw/users");
    cephRgwCommons.addUser();
    helpers.checkLocation("ceph/rgw/users/add");
    element(by.model("$ctrl.user.user_id")).sendKeys(testUser.user_id);
    element(by.model("$ctrl.user.display_name")).sendKeys(testUser.display_name);
    cephRgwCommons.submitBtn.click();
  });

  it("should display the test user in the users panel", () => {
    helpers.setLocation("ceph/rgw/users");
    expect(helpers.get_list_element(testUser.user_id).isDisplayed()).toBe(true);
  });

  it("should check the invalid bucket name error message", () => {
    helpers.setLocation("ceph/rgw/buckets");
    addBucket();
    element(by.model("$ctrl.bucket.bucket")).sendKeys("xy");
    // Wait some time until the bucket name has been validated via REST API call.
    browser.sleep(helpers.configs.sleep);
    expect(element(by.css(".tc_bucketInvalid")).isDisplayed()).toBe(true);
    helpers.leaveForm();
  });

  it("should create test bucket (owner=admin)", () => {
    addBucket();
    element(by.model("$ctrl.bucket.bucket")).sendKeys(testBucket.name);
    element(by.model("$ctrl.bucket.owner")).sendKeys("admin");
    cephRgwCommons.submitBtn.click();
  });

  it("should display the new bucket in the buckets panel", () => {
    expect(helpers.get_list_element(testBucket.name).isDisplayed()).toBe(true);
    let cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual("admin");
  });

  it("should display the details of the bucket", () => {
    helpers.get_list_element(testBucket.name).click();
    helpers.checkLocation("ceph/rgw/buckets/details");
    expect(element(by.cssContainingText("dt", "Name:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Id:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Owner:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Marker:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Maximum marker:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Version:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Master version:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Modification time:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "S3:")).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText("dt", "Swift:")).isDisplayed()).toBe(true);
  });

  it("should change owner (owner=tuxdoe)", () => {
    editBucket(testBucket.name);
    element(by.model("$ctrl.bucket.owner")).sendKeys(testBucket.owner);
    cephRgwCommons.submitBtn.click();
  });

  it("should display the new bucket owner", () => {
    let cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual(testUser.user_id);
  });

  it("should redirect from the user list to the bucket list", () => {
    helpers.setLocation("ceph/rgw/users");
    // Mark the user row and select the 'List buckets' menu.
    // !!! Note, the data table sort field is set to 'Owner'. !!!
    helpers.get_list_element(testBucket.owner).click();
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_listBucketsItem > a")).click();
    browser.sleep(helpers.configs.sleep);
    // Check whether we are on the correct page?
    helpers.checkLocation("ceph/rgw/buckets");
    // Check the number of buckets owned by the user 'e2e_tuxdoe'.
    expect(element.all(by.tagName("tbody > tr")).count()).toEqual(1);
  });

  it("should delete the test bucket", () => {
    let bucket = helpers.get_list_element(testBucket.name);
    bucket.click();
    helpers.delete_selection(undefined, "$ctrl");
    expect(bucket.isPresent()).toBe(false);
  });

  it("should create test bucket (owner=e2e_tuxdoe)", () => {
    addBucket();
    element(by.model("$ctrl.bucket.bucket")).sendKeys(testBucket.name);
    element(by.model("$ctrl.bucket.owner")).sendKeys(testUser.user_id);
    cephRgwCommons.submitBtn.click();
  });

  it("should delete the test user 'e2e_tuxdoe'", () => {
    // Note, the previously created bucket 'e2e_bucket' should be deleted, too.
    helpers.setLocation("ceph/rgw/users");
    let user = helpers.get_list_element(testUser.user_id);
    user.click();
    helpers.delete_selection(undefined, "$ctrl");
    expect(user.isPresent()).toBe(false);
  });

  it("should not display the bucket after deleting the owner user", () => {
    helpers.setLocation("ceph/rgw/buckets");
    let bucket = helpers.search_for_element(testBucket.name);
    expect(bucket.isPresent()).toBe(false);
  });

  afterAll(() => {
    console.log("ceph_rgw -> ceph_rgw_buckets.e2e.js");
  });
});
