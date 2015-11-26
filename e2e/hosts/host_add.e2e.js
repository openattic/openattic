var helpers = require('../common.js');

describe('Should add a host and attributes', function(){
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var hostsItem = element.all(by.css('ul .tc_menuitem > a')).get(4);

  beforeAll(function(){
    helpers.login();
    hostsItem.click();
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

  it('should edit the created host', function(){
    expect(host.isDisplayed()).toBe(true);
    host.click();
    element(by.css('.tc_editHost')).click();
    browser.sleep(400);
    var hostName = element(by.model('hostName'));
    expect(hostName.getAttribute('value')).toEqual('protractor_test_host');
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
    console.log('host_add test ended');
  });
});
