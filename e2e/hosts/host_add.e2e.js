'use strict';
var helpers = require('../common.js');

describe('Should add a host and attributes:', function(){
  var hostname = 'protractor_test_host';
  var hostname2 = 'e2e_test_host';
  var host = element(by.cssContainingText('tr', hostname));

  beforeAll(function(){
    helpers.login();
    element(by.css('ul .tc_menuitem_hosts > a')).click();
  });
  
  beforeEach(function(){
    browser.sleep(400);
  });

  it('should create the test hosts', function(){
    helpers.create_host();
    helpers.create_host(null,null,hostname2);
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

  it('should display the edit button if a host is selected', function(){
    host.click();
    expect(element(by.css('.tc_editHost')).isDisplayed()).toBe(true);
  });

  it('should display the edit form correctly', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    expect(element(by.css('.tc_hostEditTitle')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_hostEditTitle')).getText()).toContain('Edit Host:');
    var hostName = element(by.model('host.name'));
    expect(hostName.getAttribute('value')).toEqual('protractor_test_host');
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(false);
    element(by.css('.tc_submitButton')).click();
  });

  it('should not be allowed to rename a host like another existing host', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    var hostName = element(by.model('host.name'));
    hostName.clear();
    hostName.sendKeys(hostname2);
    browser.sleep(400);
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
    element(by.css('.tc_backButton')).click();
  });

  it('should be allowed to rename a host', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    var hostName = element(by.model('host.name'));
    hostName.clear();
    hostName.sendKeys('renamed_protractor_test_host');
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    var edited_host = element(by.cssContainingText('tr', 'renamed_protractor_test_host'));
    expect(edited_host.isDisplayed()).toBe(true);
  });

  it('should delete the test hosts', function(){
    helpers.delete_host('renamed_protractor_test_host');
    helpers.delete_host(hostname2);
  });

  afterAll(function(){
    console.log('hosts -> host_add.e2e.js');
  });
});
