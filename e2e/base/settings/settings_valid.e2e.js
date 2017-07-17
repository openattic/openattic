'use strict';

var helpers = require('../../common.js');
var SettingsForm = require('./SettingsForm');

describe('settings inputs validations', function(){

  var form = new SettingsForm();

  beforeAll(function(){
    helpers.login();
    helpers.setLocation('settings');
  });

  it('should validate salt api host', function(){
    form.saltApiHost.clear();
    expect(form.saltApiHostRequired.isDisplayed()).toBe(true);

    form.saltApiHost.sendKeys('e2e-host');
    expect(form.saltApiHostRequired.isDisplayed()).toBe(false);
  });

  it('should validate salt api port', function(){
    form.saltApiPort.clear();
    expect(form.saltApiPortRequired.isDisplayed()).toBe(true);

    form.saltApiPort.sendKeys('8001');
    expect(form.saltApiPortRequired.isDisplayed()).toBe(false);
  });

  it('should validate salt api eauth', function(){
    form.selectEauth('-- Select the external auth system --');
    expect(form.saltApiEauthRequired.isDisplayed()).toBe(true);

    form.selectEauth('auto');
    expect(form.saltApiEauthRequired.isDisplayed()).toBe(false);
  });

  it('should validate salt api username', function(){
    form.saltApiUsername.clear();
    expect(form.saltApiUsernameRequired.isDisplayed()).toBe(true);

    form.saltApiUsername.sendKeys('e2e-user');
    expect(form.saltApiUsernameRequired.isDisplayed()).toBe(false);
  });

  it('should validate salt api shared secret', function(){
    form.selectEauth('sharedsecret');
    form.saltApiSharedSecret.clear();
    expect(form.saltApiSharedSecretRequired.isDisplayed()).toBe(true);

    form.saltApiSharedSecret.sendKeys('mysecretkey');
    expect(form.saltApiSharedSecretRequired.isDisplayed()).toBe(false);
  });

  it('should disable object gateway fields', function(){
    browser.refresh();
    
    form.checkManagedByDeepSea(true);
    expect(form.rgwHost.isEnabled()).toBe(false);
    expect(form.rgwPort.isEnabled()).toBe(false);
    expect(form.rgwAccessKey.isEnabled()).toBe(false);
    expect(form.rgwSecretKey.isEnabled()).toBe(false);
    expect(form.rgwAdminUser.isEnabled()).toBe(false);
    expect(form.rgwAdminResourcePath.isEnabled()).toBe(false);
    expect(form.rgwUseSSL.isEnabled()).toBe(false);

    form.checkManagedByDeepSea(false);
    expect(form.rgwHost.isEnabled()).toBe(true);
    expect(form.rgwPort.isEnabled()).toBe(true);
    expect(form.rgwAccessKey.isEnabled()).toBe(true);
    expect(form.rgwSecretKey.isEnabled()).toBe(true);
    expect(form.rgwAdminUser.isEnabled()).toBe(true);
    expect(form.rgwAdminResourcePath.isEnabled()).toBe(true);
    expect(form.rgwUseSSL.isEnabled()).toBe(true);
  });

  it('should check salt api connection', function(){
    browser.refresh();

    expect(form.saltApiConnectionSuccess.isDisplayed()).toBe(true);
    expect(form.saltApiConnectionFail.isDisplayed()).toBe(false);

    form.saltApiHost.clear().sendKeys('e2e-host');
    expect(form.saltApiConnectionSuccess.isDisplayed()).toBe(false);
    expect(form.saltApiConnectionFail.isDisplayed()).toBe(true);
  });

  it('should check object gateway connection', function(){
    browser.refresh();

    form.checkManagedByDeepSea(true);
    expect(form.rgwConnectionSuccess.isDisplayed()).toBe(true);
    expect(form.rgwConnectionFail.isDisplayed()).toBe(false);

    form.checkManagedByDeepSea(false);
    expect(form.rgwConnectionSuccess.isDisplayed()).toBe(true);
    expect(form.rgwConnectionFail.isDisplayed()).toBe(false);

    form.rgwHost.clear().sendKeys('e2e-host');
    expect(form.rgwConnectionSuccess.isDisplayed()).toBe(false);
    expect(form.rgwConnectionFail.isDisplayed()).toBe(true);
  });

  it('should check grafana connection', function(){
    expect(form.grafanaConnectionSuccess.isDisplayed()).toBe(true);
    expect(form.grafanaConnectionFail.isDisplayed()).toBe(false);

    form.grafanaHost.clear().sendKeys('e2e-host');
    expect(form.grafanaConnectionSuccess.isDisplayed()).toBe(false);
    expect(form.grafanaConnectionFail.isDisplayed()).toBe(true);
  });

  afterAll(function(){
    browser.refresh();
    console.log('settings -> settings_valid.e2e.js');
  });

});
