var helpers = require('../../common.js');

describe('HTTP Share add', function(){
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var share = element(by.css('.tc_http_share'));
  var submitButton = element(by.css('.tc_submitButton'));
  
  beforeEach(function(){
    helpers.login();
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();

  });
  
  helpers.create_fsvol();
  
  require('./http_share_workflow.e2e.js');
  
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
    submitButton.click();
  });
  
  it('should display the created http share in the http shares overview panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    share.click();
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
    
  });
  
  it('should not display the share anymore', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_httpShareTab')).click();
    expect(share.isPresent()).toBe(false);
  });
  
  helpers.delete_volume();

});