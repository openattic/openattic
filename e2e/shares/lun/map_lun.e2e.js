var helpers = require('../../common.js');

describe('Should map a LUN to an host', function(){

  var hostsItem = element(by.css('ul .tc_menuitem_hosts > a'));

  var hostSelect = element(by.model('share.host'));
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));

  var volumename = "protractor_iscsiMap_vol";
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";
  var iscsiShareTab = element(by.css('.tc_iscsi_fcTab'));

  beforeAll(function(){
    helpers.login();
    helpers.create_host();
    helpers.create_volume(volumename, "lun");
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    browser.sleep(400);
    //     element(by.css('.tc_entries_dropdown')).click();
    //     element(by.css('.tc_entries_100')).click();
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    iscsiShareTab.click();
    browser.sleep(400);
  });

  it('should add the iqn as attribute of the host', function(){
    hostsItem.click();
    browser.sleep(400);
    expect(host.isPresent()).toBe(true);
    host.click();
    browser.sleep(400);
    element(by.model('data.iscsiInis')).click();
    element.all(by.model('newTag.text')).get(0).sendKeys(iqn);
    browser.sleep(400);
    //get out of the iqn input field in order to save entered iqn
    host.click();
  });

  it('should configure the lun', function(){
    element(by.css('.tc_lunAdd')).click();
    hostSelect.element(by.cssContainingText('option', hostname)).click();
    element(by.css('.tc_submitButton')).click();
  });

  it('should display the lun', function(){
    expect(element(by.cssContainingText('tr', hostname)).isPresent()).toBe(true);
  });

  it('should remove the lun', function(){
    element(by.cssContainingText('tr', hostname)).click();
    element(by.css('.tc_lunDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/luns');
    browser.sleep(800);
  });

  it('should not display the lun anymore', function(){
    expect(element(by.cssContainingText('tr', hostname)).isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('map_lun');
    helpers.delete_volume(volume, volumename);
    helpers.delete_host();
  });

});
