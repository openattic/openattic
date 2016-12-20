'use strict';
var helpers = require('../../common.js');

describe('Should add a host and attributes', function(){
  var hostname = 'protractor_test_host';
  var hostname2 = 'e2e_test_host';
  var hostname3 = 'e2e_mul_1';
  var hostname4 = 'e2e_mul_2';
  var host = helpers.get_list_element(hostname);
  var iqn = 'iqn.2016-12.org.openattic:storage:disk.sn-a8675309';

  beforeAll(function(){
    helpers.login();
    element(by.css('ul .tc_menuitem_hosts > a')).click();
  });

  beforeEach(function(){
    browser.sleep(400);
  });

  it('should create the test hosts', function(){
    helpers.create_host(iqn);
    helpers.create_host(null,null,hostname2);
    helpers.create_host(null,null,hostname3);
    helpers.create_host(null,null,hostname4);
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
    expect(element.all(by.model('data[key]')).get(0).isDisplayed()).toBe(true);
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

  it('should show Name and IQN', function(){
    host.click();
    expect(element.all(by.binding('selection.item.name')).get(1).getText()).toEqual(hostname);
    expect(element(by.binding('iscsiIqn.text')).getText()).toEqual(iqn);
  });

  it('should remove all IQN if you uncheck the iSCSI checkbox', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    element.all(by.model('type.check')).get(0).click();
    element(by.css('.tc_submitButton')).click();
    host.click();
    expect(element.all(by.binding('selection.item.name')).get(1).getText()).toEqual(hostname);
    expect(element(by.binding('iscsiIqn.text')).isPresent()).toBe(false);
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
    var edited_host = helpers.get_list_element('renamed_protractor_test_host');
    expect(edited_host.isDisplayed()).toBe(true);
  });

  it('should delete the test host 1 and 2', function(){
    helpers.delete_host('renamed_protractor_test_host');
    helpers.delete_host(hostname2);
  });

  it('should delete the test host 3 and 4 via multi deletion', function(){
    helpers.search_for('e2e_mul');
    var host3 = helpers.get_list_element(hostname3);
    var host4 = helpers.get_list_element(hostname4);
    expect(host3.isDisplayed()).toBe(true);
    expect(host4.isDisplayed()).toBe(true);
    element(by.model('selection.checkAll')).click();
    helpers.delete_selection();
    expect(host3.isPresent()).toBe(false);
    expect(host4.isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('host_add -> host_add.e2e.js');
  });
});
