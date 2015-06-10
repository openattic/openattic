var helpers = require('../../common.js');

describe('should add a CIFS share', function(){

  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var volumename = 'protractor_test_volume';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  var sharename = 'protractor_test_cifsShare';
  var share = element(by.cssContainingText('td', sharename));

  beforeAll(function(){
    helpers.login();
    volumesItem.click();
    helpers.create_volume("xfs");
  });

  it('should create a CIFS share', function(){
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareAdd')).click();
    browser.sleep(400);
    element(by.id('shareName')).clear();
    browser.sleep(400);
    element(by.model('share.name')).sendKeys(sharename);
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
  });

  it('should display the cifs share "protractor_test_cifsShare" in the cifs panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    element(by.css('.tc_cifsShareTab')).click();
    browser.sleep(400);
    expect(share.isDisplayed()).toBe(true);

  });

  it('should remove the cifs share', function(){
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    element(by.css('.tc_cifsShareTab')).click();
    browser.sleep(600);
    //expect(share.isDisplayed()).toBe(true);
    browser.sleep(400);
    share.click();
    browser.sleep(400);
    element.all(by.css('.tc_menudropdown')).get(1).click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);

  });


  it('should not show the cifs share anymore', function(){
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    volume.click();
    element(by.css('.tc_cifsShareTab')).click();
    browser.sleep(400);
    expect(share.isPresent()).toBe(false);

  });

  afterAll(function(){
    helpers.delete_volume();
  });
});
