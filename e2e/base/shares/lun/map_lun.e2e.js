var helpers = require('../../../common.js');

describe('Should map a LUN to an host', function(){

  var hostSelect = element(by.model('share.host'));
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));

  var volumename = "protractor_iscsiMap_vol";
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";
  var iscsiShareTab = function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    browser.sleep(400);
    //     element(by.css('.tc_entries_dropdown')).click();
    //     element(by.css('.tc_entries_100')).click();
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_iscsi_fcTab')).click();
    browser.sleep(400);
  };

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, "lun");
  });

  it('should add the host with iqn as attribute', function(){
    helpers.create_host(iqn);
    browser.sleep(400);
    expect(host.isPresent()).toBe(true);
  });

  it('should configure the lun', function(){
    iscsiShareTab();
    element(by.css('.tc_lunAdd')).click();
    hostSelect.element(by.cssContainingText('option', hostname)).click();
    element(by.css('.tc_submitButton')).click();
  });

  it('should display the lun', function(){
    iscsiShareTab();
    expect(element(by.cssContainingText('tr', hostname)).isPresent()).toBe(true);
  });

  it('should remove the lun', function(){
    iscsiShareTab();
    element(by.cssContainingText('tr', hostname)).click();
    element(by.css('.tc_lunDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/luns');
    browser.sleep(800);
  });

  it('should not display the lun anymore', function(){
    iscsiShareTab();
    expect(element(by.cssContainingText('tr', hostname)).isPresent()).toBe(false);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    helpers.delete_host();
    console.log('lun -> map_lun.e2e.js');
  });

});
