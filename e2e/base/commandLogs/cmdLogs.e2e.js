var helpers = require('../../common.js');

describe('CommandLogs', function(){

  var systemItem = element(by.css('ul .tc_menuitem_system'));
  var cmdLogItem = systemItem.element(by.css('ul .tc_submenuitem_system_cmdlogs > a'));
  systemItem = systemItem.all(by.css(' a')).first();
  var volumename = 'protractor_cmdlog_vol';
  var volume = element(by.cssContainingText('tr', volumename));
  var searchField = element(by.model('filterConfig.search'));

  beforeAll(function(){
    helpers.login();
    //create a volume to check the lvcreate log entry
    helpers.create_volume(volumename, "lun");
    browser.sleep(400);
    systemItem.click();
    browser.sleep(400);
    cmdLogItem.click();
    browser.sleep(400);
  });

  it('should display oadatatable', function(){
    expect(element(by.css('.tc_oadatatable_cmdlogs')).isDisplayed()).toBe(true);
  });

  it('should have a delete by date button', function(){
    expect(element(by.css('.tc_deleteByDateBtn')).isDisplayed()).toBe(true);
  });

  it('should have a delete button', function(){
    element(by.css('.tc_menudropdown')).click();
    expect(element(by.css('.tc_deleteBtn')).isDisplayed()).toBe(true);
  });

  it('should contain the lvcreate log entry', function(){
    searchField.click();
    browser.sleep(400);
    searchField.sendKeys(volumename);
    browser.sleep(400);
    expect(element(by.cssContainingText('tr', '"' + volumename + '" created.')).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('cmdlogs -> cmdLogs.e2e.js');
  });
});
