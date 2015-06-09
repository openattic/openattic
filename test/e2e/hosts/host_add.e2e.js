 
var helpers = require('../common.js');

describe('Should add a host and attributes', function(){
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var hostsItem = element.all(by.css('ul .tc_menuitem')).get(4);


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
    expect(host.isPresent()).toBe(true);
  });
  
  it('should delete the test host', function(){
    expect(host.isDisplayed()).toBe(true);
    host.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteHost')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();        
  });
});