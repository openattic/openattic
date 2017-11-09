"use strict";

const helpers = require("../../common.js");

describe("should test the user form", function () {
  const name = element(by.model("$ctrl.user.username"));
  const passwd = element(by.model("$ctrl.user.password"));
  const confirmPasswd = element(by.model("$ctrl.user.confirmPassword"));

  const username = "herpderp";

  beforeAll(function () {
    helpers.login();
  });

  beforeEach(function () {
    helpers.setLocation("users");
    // helpers.waitForElement(element(by.css(".tc_addUser")));
    element(by.css(".tc_addUser")).click();
  });

  it('Should have the title "Create User:"', function () {
    expect(element(by.css(".tc_userAddTitle")).getText()).toEqual("Create User:");
  });

  it('should have a "Username" input field', function () {
    expect(name.isDisplayed()).toBe(true);
  });

  it('should have a "Password" input field', function () {
    expect(passwd.isDisplayed()).toBe(true);
  });

  it('should have a "Confirm password" input field', function () {
    expect(confirmPasswd.isDisplayed()).toBe(true);
  });

  it('should have a "Firstname" input field', function () {
    expect(element(by.model("$ctrl.user.first_name")).isDisplayed()).toBe(true);
  });

  it("should have a Lastname input field", function () {
    expect(element(by.model("$ctrl.user.last_name")).isDisplayed()).toBe(true);
  });

  it('should have an "Email Address" input field', function () {
    expect(element(by.model("$ctrl.user.email")).isDisplayed()).toBe(true);
  });

  it("should have three checkboxes", function () {
    expect(element.all(by.css(".form-group input[type=checkbox]")).count()).toEqual(3);
  });

  it('should have a checkbox title "Is active"', function () {
    expect(element(by.id("userActive")).isPresent()).toBe(true);
  });

  it('should not have a checkbox title "Is active", while editing the own profile', function () {
    helpers.setLocation("users");
    element(by.cssContainingText("tr", "openattic")).element(by.css("a")).click();
    expect(element(by.id("userActive")).isPresent()).toBe(false);
  });

  it('should have a chexkbox title "Is administrator"', function () {
    expect(element(by.id("userStaff")).isPresent()).toBe(true);
  });

  it('should have a checkbox title "Has all privileges"', function () {
    expect(element(by.id("userSuperuser")).isPresent()).toBe(true);
  });

  it('should check if an error is displayed when the "Username" is empty',
    function () {
      element(by.model("$ctrl.user.username")).sendKeys(username);
      element(by.model("$ctrl.user.password")).sendKeys("test");
      name.clear();
      expect(element(by.css(".tc_usernameRequired")).isDisplayed()).toBe(true);
    });

  // The password is only required in the user add and not the user edit form
  it('should check if an error is displayed when the "Password" is empty',
    function () {
      name.sendKeys(username);
      passwd.sendKeys("test123");
      passwd.clear();
      // Click another field that the error appears, because of state $touched
      name.click();
      expect(element(by.css(".tc_passwdRequired")).isDisplayed()).toBe(true);
    });

  it('should check if an error is displayed when the "Confirm password" is empty',
    function () {
      name.sendKeys(username);
      confirmPasswd.sendKeys("test123");
      confirmPasswd.clear();
      // Click another field that the error appears, because of state $touched
      name.click();
      expect(element(by.css(".tc_confirmPasswdRequired")).isDisplayed()).toBe(true);
    });

  it('should check if an error is displayed when the length of the "Password" is shorter than 6 chars', function () {
    passwd.sendKeys("test");
    // Click another field that the error appears, because of state $touched
    name.click();
    expect(element(by.css(".tc_passwdMinlength")).isDisplayed()).toBe(true);
  });

  it('should check if an error is displayed when the length of the "Confirm password" is shorter than 6 chars',
    function () {
      confirmPasswd.sendKeys("test");
      // Click another field that the error appears, because of state $touched
      name.click();
      expect(element(by.css(".tc_confirmPasswdMinlength")).isDisplayed()).toBe(true);
    });

  it('should check if an error is displayed when "Password" and "Confirm password" are not equal', function () {
    passwd.sendKeys("test123");
    confirmPasswd.sendKeys("test321");
    // Click another field that the error appears, because of state $touched
    name.click();
    expect(element(by.css(".tc_passwdEqual")).isDisplayed()).toBe(true);
  });

  it('should show an error message when data for field "username" does not match', function () {
    element(by.model("$ctrl.user.username")).sendKeys("öäüfasd  sadof");
    expect(element(by.css(".tc_userNameNotValid")).isDisplayed()).toBe(true);
  });

  it('should show an error message when input for field "Email Address" is not valid', function () {
    element(by.model("$ctrl.user.email")).sendKeys("äü adsfo vfoe");
    expect(element(by.css(".tc_emailNotValid")).isDisplayed()).toBe(true);
  });

  it("should have a submit button", function () {
    expect(element(by.css(".tc_submitButton")).isPresent()).toBe(true);
  });

  it("should have a back button", function () {
    expect(element(by.css(".tc_backButton")).isPresent()).toBe(true);
  });

  it("should navigate to the user overview when hitting the back button", function () {
    helpers.leaveForm();
    expect(element(by.css(".tc_oadatatable_users")).isDisplayed()).toBe(true);
  });

  it("should dismiss form validation and stay on same view", function () {
    name.sendKeys(username);
    passwd.sendKeys("test123");
    confirmPasswd.sendKeys("test123");
    element(by.css(".tc_menuitem_ceph_pools")).click().then(function () {
      element(by.css(".oa-check-form-cancel")).click();
      expect(element(by.css(".oa-check-form-cancel")).isPresent()).toBe(false);
      helpers.checkLocation("users/add");
    });
  });

  it("should confirm form validation and change view", function () {
    name.sendKeys(username);
    passwd.sendKeys("test123");
    confirmPasswd.sendKeys("test123");
    element(by.css(".tc_menuitem_ceph_pools")).click().then(function () {
      element(by.css(".oa-check-form-ok")).click();
      helpers.checkLocation("ceph/pools");
    });
  });

  afterAll(function () {
    console.log("users -> user_form_workflow.e2e.js");
  });
});
