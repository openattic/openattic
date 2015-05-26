var helpers = require('../common.js');  

describe('Host form workflow', function(){
  var hostsItem = element.all(by.css('ul .tc_menuitem')).get(4);

  beforeEach(function(){
    hostsItem.click();
    browser.sleep(400);
    element(by.css('.tc_addHost')).click();
    browser.sleep(400);
  });
  
  it('should have a "Create Host" title', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create Host:');
  });
  
  it('Should have a host name input field', function(){
    expect(element(by.id('hostHostname')).isDisplayed()).toBe(true); 
  });
  
  it('should have a submit button', function(){
     expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true); 
  });
  
  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);  
  });
    
  it('should show an error message when hitting the submit button without any data', function(){
    element(by.css('.tc_submitButton')).click();
    expect(element(by.css('.tc_hostnameRequired')).isDisplayed()).toBe(true);
  });
  
  it('should navigate back to the Host overview when hitting the button', function(){
    element(by.css('.tc_backButton')).click();
    expect(element(by.css('.tc_oadatatable_hosts')).isPresent()).toBe(true);
  });
  
});