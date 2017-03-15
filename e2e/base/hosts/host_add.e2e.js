'use strict';
var helpers = require('../../common.js');

describe('Should add a host and attributes', function(){
  var hostPrefix = 'e2e_test_host_';
  var hostnames = ['single_1', 'single_2', 'multi_1', 'multi_2'].map(function(host){
    return hostPrefix + host;
  });
  var host = helpers.get_list_element(hostnames[0]);
  var iqn = 'iqn.2016-12.org.openattic:storage:disk.sn-a8675309';

  beforeAll(function(){
    helpers.login();
    element(by.css('ul .tc_menuitem_hosts > a')).click();
  });

  beforeEach(function(){
    browser.sleep(400);
  });

  it('should create the test hosts', function(){
    helpers.create_host(hostnames[0], iqn);
    for (var i = 1; i < hostnames.length; i++){
      helpers.create_host(hostnames[i]);
    }
  });

  it('should display the created test host', function(){
    expect(host.isDisplayed()).toBe(true);
  });

  it('should not allow adding the same host twice', function(){
    element(by.css('.tc_addHost')).click();
    browser.sleep(400);
    element(by.model('host.name')).sendKeys(hostnames[0]);
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
    expect(hostName.getAttribute('value')).toEqual(hostnames[0]);
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
    hostName.sendKeys(hostnames[1]);
    browser.sleep(400);
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
    element(by.css('.tc_backButton')).click();
  });

  ['Name', 'Primary IP', 'OA Version'].forEach(function(header){
    it('should display the following table header: ' + header, function(){
      expect(element(by.cssContainingText('th', header)).isDisplayed()).toBe(true);
    });
  });

  it('should show the OA Version', function(){
    var host = element.all(by.repeater('row in data.results')).filter(function(e){
      return e.element(by.className('tc-oa-host-version')).getText().then(function(version){
        return version.match(/^\d+\.\d+\.\d+$/);
      });
    }).first().click();
    expect(element(by.binding('selection.item.oa_version.package.VERSION')).getText()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should show Name and IQN', function(){
    host.click();
    expect(element.all(by.binding('selection.item.name')).get(1).getText()).toEqual(hostnames[0]);
    expect(element(by.binding('iscsiIqn.text')).getText()).toEqual(iqn);
  });

  it('should remove all IQN if you uncheck the iSCSI checkbox', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    element.all(by.model('type.check')).get(0).click();
    element(by.css('.tc_submitButton')).click();
    host.click();
    expect(element.all(by.binding('selection.item.name')).get(1).getText()).toEqual(hostnames[0]);
    expect(element(by.binding('iscsiIqn.text')).isPresent()).toBe(false);
  });

  it('should be allowed to rename a host', function(){
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    var hostName = element(by.model('host.name'));
    hostName.clear();
    hostnames[0] += '_renamed';
    hostName.sendKeys(hostnames[0]);
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    var edited_host = helpers.get_list_element(hostnames[0]);
    expect(edited_host.isDisplayed()).toBe(true);
  });

  it('should delete the test host 1 and 2', function(){
    helpers.delete_host(hostnames[0]);
    helpers.delete_host(hostnames[1]);
  });

  it('should delete the test host 3 and 4 via multi deletion', function(){
    helpers.search_for(hostPrefix);
    var host3 = helpers.get_list_element(hostnames[2]);
    var host4 = helpers.get_list_element(hostnames[3]);
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
