var helpers = require('../../common.js');

describe('should add a CIFS share', function(){

  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var volumename = 'protractor_test_volume';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  var sharename = 'protractor_test_cifsShare';
  var share = element(by.cssContainingText('tr', sharename));
  var submitBtn = element(by.css('.tc_submitButton'));
  var cifsShareTab = element(by.css('.tc_cifsShareTab'));

  beforeAll(function(){
    helpers.login();
    volumesItem.click();
    helpers.create_volume("xfs");
    volume.click();
    cifsShareTab.click();
  });

  it('should create a CIFS share', function(){
    element(by.css('.tc_cifsShareAdd')).click();
    browser.sleep(400);
    element(by.id('shareName')).clear();
    browser.sleep(400);
    element(by.model('share.name')).sendKeys(sharename);
    browser.sleep(400);
    submitBtn.click();
  });

  it('should display the cifs share "protractor_test_cifsShare" in the cifs panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    expect(share.isDisplayed()).toBe(true);

  });
  
  //adds comment, unchecks "Guest ok" checkbox
  it('should edit the cifs share', function(){
    expect(share.isDisplayed()).toBe(true);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareEdit')).click();
    browser.sleep(400);
    //check the current share configuration first
    var cifsName = element(by.model('share.name'));
    expect(cifsName.getAttribute('value')).toEqual(sharename);
    
    var cifsPath = element(by.model('share.path'));
    expect(cifsPath.getAttribute('value')).toEqual('/media/protractor_test_volume');
    browser.sleep(400);
    
    expect(element(by.model('share.available')).isSelected()).toBe(true);
    expect(element(by.model('share.browseable')).isSelected()).toBe(true);
    expect(element(by.model('share.writeable')).isSelected()).toBe(true);
    expect(element(by.model('share.guest_ok')).isSelected()).toBe(false);
    //edit the share configuration
    element(by.model('share.guest_ok')).click();
    browser.sleep(400);
    expect(element(by.model('share.guest_ok')).isSelected()).toBe(true);
    element(by.model('share.comment')).sendKeys('this is a protractor test cifs share');
    browser.sleep(400);
    submitBtn.click();
    browser.sleep(400);
    var guestColumn = share.element(by.id('guest_ok'));
    expect(guestColumn.element(by.className('fa-check')).isPresent()).toBe(true);
    var comment = share.element(by.binding('row.comment'));
    expect(comment.getText()).toEqual('this is a protractor test cifs share');
    
  });

  it('should remove the cifs share', function(){
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    expect(share.isDisplayed()).toBe(true);
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
    expect(share.isPresent()).toBe(false);

  });

  afterAll(function(){
    console.log('cifs_add');
    helpers.delete_volume();
  });
});
