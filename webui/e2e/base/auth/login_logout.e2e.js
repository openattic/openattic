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

var helpers = require("../../common.js");

describe("should test the login", function () {

  var name = element(by.model("$ctrl.username"));
  var passwd = element(by.model("$ctrl.password"));
  var nameRequired = element(by.css(".tc_usernameRequired"));
  var passwdRequired = element(by.css(".tc_passwdRequired"));
  var correctInput = element(by.css(".tc_correctInput"));
  var submitBtn = element(by.css('input[type="submit"]'));

  it("should login and get to the dashboard site", function () {
    helpers.login();
    //if login was successful the url should contain /dashboard
    helpers.checkLocation("dashboard");
  });

  it("should go to dashboard when already logged in", function () {
    browser.get(helpers.getUrl("login"));
    helpers.checkLocation("dashboard");
  });

  it("should click any menu entry", function () {
    element(by.css("ul .tc_menuitem_ceph_osds > a")).click();
    helpers.checkLocation("ceph/osds");
  });

  it("should logout again", function () {
    element(by.css(".tc_logout a")).click();
    helpers.checkLocation("login");
  });

  //login workflow

  it("should have an user input field", function () {
    expect(name.isDisplayed()).toBe(true);
  });

  it("should have a password input field", function () {
    expect(element(by.model("$ctrl.password")).isDisplayed()).toBe(true);
  });

  it("should have a 'stay signed in' checkbox", function () {
    expect(element(by.model("$ctrl.staySignedIn")).isPresent()).toBe(true);
  });

  it("should show an error if user input field has no data", function () {
    //make sure that input field username is empty
    name.clear();
    submitBtn.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(element(by.css(".tc_usernameRequired")).getText()).toBe("This field is required.");
  });

  it("should show an error if password input field has no data", function () {
    passwd.clear();
    submitBtn.click();
    expect(passwdRequired.isDisplayed()).toBe(true);
    expect(passwdRequired.getText()).toBe("This field is required.");
  });

  it("should show an error if username and password input fields have no " +
      "input data and submit button was clicked", function () {
    //make sure that user and password fields are empty
    name.clear();
    passwd.clear();
    submitBtn.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(nameRequired.getText()).toBe("This field is required.");
    expect(passwdRequired.isDisplayed()).toBe(true);
    expect(passwdRequired.getText()).toBe("This field is required.");
    expect(correctInput.isPresent()).toBe(false);
  });

  it("should display an error message if given credentials are incorrect", function () {
    name.click();
    browser.sleep(400);
    name.clear();
    name.sendKeys("wer344fv     resfferwwxd");
    passwd.click();
    browser.sleep(400);
    passwd.clear();
    passwd.sendKeys("2943tr3befc vr");
    submitBtn.click();
    expect(correctInput.isDisplayed()).toBe(true);
    expect(correctInput.getText()).toBe("The given credentials are not correct.");
    expect(nameRequired.isPresent()).toBe(false);
    expect(passwdRequired.isPresent()).toBe(false);
  });

  afterAll(function () {
    console.log("auth -> login_logout.e2e.js");
  });
});
