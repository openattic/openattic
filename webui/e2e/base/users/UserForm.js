"use strict";

const UserForm = function () {

  this.username = element(by.model("$ctrl.user.username"));
  this.password = element(by.model("$ctrl.user.password"));
  this.confirmPassword = element(by.model("$ctrl.user.confirmPassword"));

  this.submit = function () {
    element(by.css(".tc_submitButton")).click();
  };
};
module.exports = UserForm;
