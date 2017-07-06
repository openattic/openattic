'use strict';

var helpers = require('../../common.js');
var CephIscsiTable = require('./CephIscsiTable.js');
var CephIscsiForm = require('./CephIscsiForm.js');

describe('ceph iscsi', function(){

  var table = new CephIscsiTable();
  var form = new CephIscsiForm();

  beforeAll(function(){
    helpers.login();
    element(by.css('.tc_menuitem_ceph_iscsi')).click();
  });

  beforeEach(function(){
    table.addTarget();
  });

  it('should validate target id', function(){
    form.targetIdInput.clear().sendKeys('iqn.2017-1-27-112013306.org.linux-iscsi.igw.x86');
    expect(form.targetIdRequired.isDisplayed()).toBe(false);
    expect(form.targetIdInvalid.isDisplayed()).toBe(true);

    form.targetIdInput.clear();
    expect(form.targetIdRequired.isDisplayed()).toBe(true);
    expect(form.targetIdInvalid.isDisplayed()).toBe(false);

    form.targetIdInput.clear().sendKeys('iqn.2016-06.org.openattic:storage:disk.sn-a8675309');
    expect(form.targetIdInvalid.isDisplayed()).toBe(false);
    expect(form.targetIdRequired.isDisplayed()).toBe(false);
  });

  it('should validate lun', function(){
    form.addImage(0);
    form.openImageSettingsModal(0);
    form.lunIdInput.clear();
    expect(form.lunIdRequired.isDisplayed()).toBe(true);

    form.lunIdInput.sendKeys(1);
    expect(form.lunIdRequired.isDisplayed()).toBe(false);

    form.confirmImageSettingsModal();
  });

  it('should validate user', function(){
    form.authenticationCheckbox.click();
    form.userInput.sendKeys('...').clear();
    expect(form.userRequired.isDisplayed()).toBe(true);

    form.userInput.clear().sendKeys('TargetUser');
    expect(form.userRequired.isDisplayed()).toBe(false);
  });

  it('should validate password', function(){
    form.authenticationCheckbox.click();
    form.passwordInput.sendKeys('...').clear();
    expect(form.passwordRequired.isDisplayed()).toBe(true);

    form.passwordInput.clear().sendKeys('TargetPassword');
    expect(form.passwordRequired.isDisplayed()).toBe(false);
  });

  it('should validate initiators', function(){
    form.authenticationCheckbox.click();
    form.addInitiator();
    form.initiatorsInput.get(0).clear().sendKeys('...');
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(false);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(true);

    form.initiatorsInput.get(0).clear();
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(true);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(false);

    form.removeInitiator(0);
    form.addInitiator();
    form.initiatorsInput.get(0).clear().sendKeys('iqn.2016-06.org.openattic:storage:disk.sn-a8675310');
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(false);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(false);
  });

  it('should validate mutual user', function(){
    form.authenticationCheckbox.click();
    form.mutualAuthenticationCheckbox.click();
    form.mutualUserInput.sendKeys('...').clear();
    expect(form.mutualUserRequired.isDisplayed()).toBe(true);

    form.mutualUserInput.sendKeys('TargetMutualUser');
    expect(form.mutualUserRequired.isDisplayed()).toBe(false);
  });

  it('should validate mutual password', function(){
    form.authenticationCheckbox.click();
    form.mutualAuthenticationCheckbox.click();
    form.mutualPasswordInput.sendKeys('...').clear();
    expect(form.mutualPasswordRequired.isDisplayed()).toBe(true);

    form.mutualPasswordInput.sendKeys('TargetMutualPassword');
    expect(form.mutualPasswordRequired.isDisplayed()).toBe(false);
  });

  it('should validate discovery user', function(){
    form.authenticationCheckbox.click();
    form.discoveryAuthenticationCheckbox.click();
    form.discoveryUserInput.sendKeys('...').clear();
    expect(form.discoveryUserRequired.isDisplayed()).toBe(true);

    form.discoveryUserInput.sendKeys('TargetDiscoveryUser');
    expect(form.discoveryUserRequired.isDisplayed()).toBe(false);
  });

  it('should validate discovery password', function(){
    form.authenticationCheckbox.click();
    form.discoveryAuthenticationCheckbox.click();
    form.discoveryPasswordInput.sendKeys('...').clear();
    expect(form.discoveryPasswordRequired.isDisplayed()).toBe(true);

    form.discoveryPasswordInput.sendKeys('TargetDiscoveryPassword');
    expect(form.discoveryPasswordRequired.isDisplayed()).toBe(false);
  });

  it('should validate discovery mutual user', function(){
    form.authenticationCheckbox.click()
    form.discoveryAuthenticationCheckbox.click();
    form.discoveryMutualAuthenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryMutualUserInput.sendKeys('...').clear();
    expect(form.discoveryMutualUserRequired.isDisplayed()).toBe(true);

    form.discoveryMutualUserInput.sendKeys('TargetDiscoveryMutualUser');
    expect(form.discoveryMutualUserRequired.isDisplayed()).toBe(false);
  });

  it('should validate discovery mutual password', function(){
    form.authenticationCheckbox.click();
    form.discoveryAuthenticationCheckbox.click();
    form.discoveryMutualAuthenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryMutualPasswordInput.sendKeys('...').clear();
    expect(form.discoveryMutualPasswordRequired.isDisplayed()).toBe(true);

    form.discoveryMutualPasswordInput.sendKeys('TargetDiscoveryMutualPassword');
    expect(form.discoveryMutualPasswordRequired.isDisplayed()).toBe(false);
  });

  it('should validate submit button', function(){
    expect(form.submitButton.isEnabled()).toBe(false);

    form.targetIdInput.clear().sendKeys('iqn.2016-06.org.openattic:storage:disk.sn-a8675309');
    expect(form.submitButton.isEnabled()).toBe(false);

    form.addPortal(0);
    expect(form.submitButton.isEnabled()).toBe(false);

    form.addImage(0);
    expect(form.submitButton.isEnabled()).toBe(true);

    form.authenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.userInput.clear().sendKeys('TargetUser');
    expect(form.submitButton.isEnabled()).toBe(false);

    form.passwordInput.clear().sendKeys('TargetPassword');
    expect(form.submitButton.isEnabled()).toBe(true);

    form.addInitiator();
    form.initiatorsInput.get(0).clear().sendKeys('iqn.2016-06.org.openattic:storage:disk.sn-a8675310');
    expect(form.submitButton.isEnabled()).toBe(true);

    form.mutualAuthenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.mutualUserInput.sendKeys('TargetMutualUser');
    expect(form.submitButton.isEnabled()).toBe(false);

    form.mutualPasswordInput.sendKeys('TargetMutualPassword');
    expect(form.submitButton.isEnabled()).toBe(true);

    form.discoveryAuthenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryUserInput.sendKeys('TargetDiscoveryUser');
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryPasswordInput.sendKeys('TargetDiscoveryPassword');
    expect(form.submitButton.isEnabled()).toBe(true);

    form.discoveryMutualAuthenticationCheckbox.click();
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryMutualUserInput.sendKeys('TargetDiscoveryMutualUser');
    expect(form.submitButton.isEnabled()).toBe(false);

    form.discoveryMutualPasswordInput.sendKeys('TargetDiscoveryMutualPassword');
    expect(form.submitButton.isEnabled()).toBe(true);
  });

  afterEach(function(){
    helpers.leaveForm();
  });

  afterAll(function(){
    console.log('ceph_iscsi -> ceph_iscsi_valid.e2e.js');
  });

});
