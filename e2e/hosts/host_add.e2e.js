'use strict';
var helpers = require('../common.js');

describe('Should add a host and attributes', function(){
  var hostname = 'protractor_test_host';
  var host = element(by.cssContainingText('tr', hostname));

  beforeAll(function(){
    helpers.login();
    element(by.css('ul .tc_menuitem_hosts > a')).click();
  });

  it('should create a test host', function(){
    element(by.css('.tc_addHost')).click();
    element(by.model('host.name')).sendKeys(hostname);
    element(by.css('.tc_submitButton')).click();
    browser.sleep(400);
  });

  it('should display the created test host', function(){
    expect(host.isDisplayed()).toBe(true);
  });

  it('should not allow adding the same host twice', function(){
    element(by.css('.tc_addHost')).click();
    browser.sleep(400);
    element(by.model('host.name')).sendKeys('protractor_test_host');
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_noUniqueName')).getText()).toEqual('The chosen host name is already in use.');
    element(by.css('.tc_backButton')).click();
  });

  it('should edit the created host', function(){
    var firstName = element.all(by.css('tr.ng-scope')).first().all(by.css('a')).getInnerHtml();
    expect(host.isDisplayed()).toBe(true);
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    expect(element(by.css('.tc_hostEditTitle')).isDisplayed()).toBe(true);
    browser.sleep(400);
    expect(element(by.css('.tc_hostEditTitle')).getText()).toContain('Edit Host:');
    browser.sleep(400);
    var hostName = element(by.model('host.name'));
    expect(hostName.getAttribute('value')).toEqual('protractor_test_host');
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(false);
    hostName.clear();
    hostName.sendKeys(firstName);
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
    hostName.clear();
    hostName.sendKeys('renamed_protractor_test_host');
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    var edited_host = element(by.cssContainingText('tr', 'renamed_protractor_test_host'));
    expect(edited_host.isDisplayed()).toBe(true);
  });

  it('should delete the test host', function(){
    expect(host.isDisplayed()).toBe(true);
    host.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteHost > a')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
  });

  it('should not list the host any longer', function(){
    expect(host.isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('hosts -> host_add.e2e.js');
  });
});
