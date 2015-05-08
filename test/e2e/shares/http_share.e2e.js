var helpers = require('../common.js');

describe('HTTP Share add', function(){
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var sharename = "/media/test";
  var share = element(by.cssContainingText('tr', sharename));
  var submitButton = element(by.css('.tc_submitButton'));
  
  beforeEach(function(){
    helpers.login();
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();

  });
  
  helpers.create_fsvol();
  
  
  function goToHTTPShare(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_httpShareAdd')).click();
    browser.sleep();
  }
  
  it('should create the http-share', function(){
    goToHTTPShare();
    var shareInput = element(by.id('sharePath'));
    shareInput.clear().sendKeys(sharename);
    submitButton.click();
  });
  
  it('should display the created http share in the http shares overview panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    browser.sleep(400);
    expect(share.isPresent()).toBe(true);
  });
  
  
  it('should delete the http-share', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    browser.sleep(400);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_deleteHttpShare')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    browser.sleep(400);
    expect(share.isPresent()).toBe(false);
    browser.sleep(400);
  });
  
  helpers.delete_volume();

});