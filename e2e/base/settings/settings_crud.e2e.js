'use strict';

var helpers = require('../../common.js');
var SettingsForm = require('./SettingsForm');

describe('settings form', function(){

  var form = new SettingsForm();

  var initialSettings = {
    deepsea: {}
  };

  beforeAll(function(){
    helpers.login();
    helpers.setLocation('settings');
    form.saltApiHost.getAttribute('value').then(function(value){
      initialSettings.deepsea.host = value;
    });
    form.saltApiPort.getAttribute('value').then(function(value){
      initialSettings.deepsea.port = value;
    });
    form.saltApiUsername.getAttribute('value').then(function(value){
      initialSettings.deepsea.username = value;
    });
  });

  it('should save settings', function(){
    form.saltApiHost.clear().sendKeys('e2e-salt-host');
    form.saltApiPort.clear().sendKeys('8001');
    form.saltApiUsername.clear().sendKeys('e2e-username');

    form.checkManagedByDeepSea(false);
    form.rgwHost.clear().sendKeys('e2e-rgw-host');
    form.rgwPort.clear().sendKeys('8002');
    form.rgwAccessKey.clear().sendKeys('e2e-access-key');
    form.rgwSecretKey.clear().sendKeys('e2e-secret-key');
    form.rgwAdminUser.clear().sendKeys('e2e-admin-user');
    form.checkUseSSL(true);

    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should get saved settings', function(){
    browser.refresh();

    expect(form.saltApiHost.getAttribute('value')).toEqual('e2e-salt-host');
    expect(form.saltApiPort.getAttribute('value')).toEqual('8001');
    expect(form.saltApiUsername.getAttribute('value')).toEqual('e2e-username');

    expect(form.rgwManagedByDeepSea.isSelected()).toBe(false);
    expect(form.rgwHost.getAttribute('value')).toEqual('e2e-rgw-host');
    expect(form.rgwPort.getAttribute('value')).toEqual('8002');
    expect(form.rgwAccessKey.getAttribute('value')).toEqual('e2e-access-key');
    expect(form.rgwSecretKey.getAttribute('value')).toEqual('e2e-secret-key');
    expect(form.rgwAdminUser.getAttribute('value')).toEqual('e2e-admin-user');
    expect(form.rgwUseSSL.isSelected()).toBe(true);
  });

  it('should restore initial settings', function(){
    form.saltApiHost.clear().sendKeys(initialSettings.deepsea.host);
    form.saltApiPort.clear().sendKeys(initialSettings.deepsea.port);
    form.saltApiUsername.clear().sendKeys(initialSettings.deepsea.username);
    form.checkManagedByDeepSea(true);
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should get restored initial settings', function(){
    browser.refresh();
    expect(form.saltApiHost.getAttribute('value')).toEqual(initialSettings.deepsea.host);
    expect(form.saltApiPort.getAttribute('value')).toEqual(initialSettings.deepsea.port);
    expect(form.saltApiUsername.getAttribute('value')).toEqual(initialSettings.deepsea.username);
    expect(form.rgwManagedByDeepSea.isSelected()).toBe(true);
  });

  afterAll(function(){
    console.log('settings -> settings_crud.e2e.js');
  });

});
