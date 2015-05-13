var helpers = require('../../common.js');

describe('Should add a NFS Share', function(){
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var submitButton = element(by.css('.tc_submitButton'));
  var shareAddress = '172.16.13.19';
  var share = element(by.cssContainingText('td', shareAddress));
  
  beforeEach(function() {
    helpers.login(); 
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
  });

  helpers.create_fsvol();
  
  require('./nfs_share_workflow.e2e.js');

  it('should create the NFS share', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareAdd')).click();
    browser.sleep(400);      
    element(by.model('share.address')).sendKeys(shareAddress);
    browser.sleep();
    submitButton.click();
  });

  it('should display the NFS share in the NFS panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    browser.sleep(400);
    expect(share.isDisplayed()).toBe(true);
  });
  
  it('should remove the NFS share', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    expect(share.isDisplayed()).toBe(true);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    
  });
  
  it('should not show the NFS share anymore', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    expect(share.isPresent()).toBe(false);      
  });  
  
  helpers.delete_volume();
  
});