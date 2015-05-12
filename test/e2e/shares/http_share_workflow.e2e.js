var helpers = require('../common.js');  

describe('HTTP Share workflow', function(){  
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var submitButton = element(by.css('.tc_submitButton'));
 
  function goToHTTPShare(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_httpShareAdd')).click();
    browser.sleep();
  }
  
  it('should have a "Create HTTP Share" title', function(){
    goToHTTPShare();
    expect(element(by.css('h2')).getText()).toEqual('Create HTTP Share');    
  });

  it('should have one input field', function(){
    goToHTTPShare();
    expect(element(by.id('sharePath')).isDisplayed()).toBe(true);
  });
  
  it('should should have a back button', function(){
    goToHTTPShare();
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });
  
  it('should have a submit button', function(){
    goToHTTPShare();
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });
  
  it('should show an error message when hitting the submit button without any data', function(){
    goToHTTPShare();
    element(by.id('sharePath')).clear();
    submitButton.click();
    expect(element(by.css('.tc_pathRequired')).isDisplayed()).toBe(true);
  });
  
  it('should navigate back to the HTTP-Shares overview when hitting the button', function(){
    goToHTTPShare();
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_http_shares')).isPresent()).toBe(true);    
  });
});