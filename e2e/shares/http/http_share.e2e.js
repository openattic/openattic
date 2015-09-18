var helpers = require('../../common.js');

describe('HTTP Share add', function(){

  var volumename = 'protractor_httpShare_vol';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var share = element(by.css('.tc_http_share'));
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var httpShareTab = element(by.css('.tc_httpShareTab'));


  beforeAll(function(){
    helpers.login();
    volumesItem.click();
    helpers.create_volume(volumename, "xfs");
    volume.click();
    httpShareTab.click();
  });

  function goToHTTPShare(){
    expect(volume.isDisplayed()).toBe(true);
    element(by.css('.tc_httpShareAdd')).click();
    browser.sleep(400);
  }

  it('should create the http-share', function(){
    goToHTTPShare();
    element(by.css('.tc_submitButton')).click();
  });

  it('should display the created http share in the http shares overview panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    expect(share.isPresent()).toBe(true);
  });

  it('should delete the http-share', function(){
    expect(volume.isDisplayed()).toBe(true);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_deleteHttpShare')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });

  it('should not display the share anymore', function(){
    expect(volume.isDisplayed()).toBe(true);
    expect(share.isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('http_share');
    helpers.delete_volume(volume, volumename);
  });
});
