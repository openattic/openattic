"use strict";

var helpers = require("../../common.js");
var CephRgwCommons = require("./cephRgwCommon.js");

describe("ceph rgw buckets", function () {
  var cephRgwCommons = new CephRgwCommons();
  var testUser = {
    user_id: "e2e_tuxdoe",
    display_name: "Tux Doe"
  };
  var testBucket = {
    name: "e2e_bucket",
    owner: "e2e_tuxdoe"
  };

  var goToUserListView = function () {
    element(by.css(".tc_menuitem_ceph_rgw")).click();
    element(by.css(".tc_submenuitem_ceph_rgw_users")).click();
    browser.sleep(helpers.configs.sleep);
  };

  var addBucket = function () {
    cephRgwCommons.addBucket();
    helpers.checkLocation("ceph/rgw/buckets/add");
  };

  var editBucket = function (name) {
    cephRgwCommons.editBucket(name);
    helpers.checkLocation("ceph/rgw/buckets/edit/" + name);
  };

  beforeAll(function () {
    helpers.login();
  });

  beforeEach(function () {
    helpers.setLocation("ceph/rgw/buckets");
  });

  it("should create test user", function () {
    goToUserListView();
    cephRgwCommons.addUser();
    helpers.checkLocation("ceph/rgw/users/add");
    element(by.model("user.user_id")).sendKeys(testUser.user_id);
    element(by.model("user.display_name")).sendKeys(testUser.display_name);
    cephRgwCommons.submitBtn.click();
  });

  it("should display the test user in the users panel", function () {
    goToUserListView();
    expect(helpers.get_list_element(testUser.user_id).isDisplayed()).toBe(true);
  });

  it("should check the invalid bucket name error message", function () {
    addBucket();
    element(by.model("bucket.bucket")).sendKeys("xy");
    // Wait some time until the bucket name has been validated via REST API call.
    browser.sleep(helpers.configs.sleep);
    expect(element(by.css(".tc_bucketInvalid")).isDisplayed()).toBe(true);
    helpers.leaveForm();
  });

  it("should create test bucket (owner=admin)", function () {
    addBucket();
    element(by.model("bucket.bucket")).sendKeys(testBucket.name);
    element(by.model("bucket.owner")).sendKeys("admin");
    cephRgwCommons.submitBtn.click();
  });

  it("should display the new bucket in the buckets panel", function () {
    expect(helpers.get_list_element(testBucket.name).isDisplayed()).toBe(true);
    var cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual("admin");
  });

  it("should display the details of the bucket", function () {
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
  });

  it("should change owner (owner=tuxdoe)", function () {
    editBucket(testBucket.name);
    element(by.model("bucket.owner")).sendKeys(testBucket.owner);
    cephRgwCommons.submitBtn.click();
  });

  it("should display the new bucket owner", function () {
    var cells = helpers.get_list_element_cells(testBucket.name);
    expect(cells.get(2).getText()).toEqual(testUser.user_id);
  });

  it("should redirect from the user list to the bucket list", function () {
    goToUserListView();
    // Mark the user row and select the 'List buckets' menu.
    helpers.get_list_element(testBucket.owner).click();
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_listBucketsItem > a")).click();
    browser.sleep(helpers.configs.sleep);
    // Check whether we are on the correct page?
    helpers.checkLocation("ceph/rgw/buckets");
    // Check the number of buckets owned by the user 'e2e_tuxdoe'.
    expect(element.all(by.tagName("tbody > tr")).count()).toEqual(1);
  });

  it("should delete the test bucket", function () {
    element(by.cssContainingText("tr", testBucket.name)).click();
    helpers.delete_selection(0, "$ctrl");
  });

  it("should delete the test user", function () {
    helpers.setLocation("ceph/rgw/users");
    element(by.cssContainingText("tr", testUser.user_id)).click();
    helpers.delete_selection(0, "$ctrl");
  });

  afterAll(function () {
    console.log("ceph_rgw -> ceph_rgw_buckets.e2e.js");
  });
});
