'use strict';

var CephRgwCommons = function(){
  var helpers = require('../../common.js');

  this.submitBtn = element(by.css('.tc_submitButton'));
  this.backBtn = element(by.css('.tc_backButton'));
  this.addSubuserBtn = element(by.css('.tc_addSubuserButton'));
  this.submitSubuserBtn = element(by.css('.tc_submitSubuserButton'));
  this.cancelSubuserBtn = element(by.css('.tc_cancelSubuserButton'));
  this.addS3KeyBtn = element(by.css('.tc_addS3KeyButton'));
  this.submitS3KeyBtn = element(by.css('.tc_submitS3KeyButton'));
  this.addCapBtn = element(by.css('.tc_addCapButton'));
  this.submitCapBtn = element(by.css('.tc_submitCapButton'));

  this.userDetailAttributes = [
    'Username',
    'Full name',
    'Email address',
    'Suspended',
    'Maximum buckets'
  ];

  this.addUser = function() {
    element(by.css('.tc_addUser')).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.editUser = function(uid){
    helpers.get_list_element(uid).click();
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_editUser > a')).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.addBucket = function() {
    element(by.css('.tc_addBucket')).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.editBucket = function(name){
    helpers.get_list_element(name).click();
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_editBucket > a')).click();
    browser.sleep(helpers.configs.sleep);
  };
};
module.exports = CephRgwCommons;
