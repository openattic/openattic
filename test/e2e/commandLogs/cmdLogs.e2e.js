var helpers = require('../common.js');

describe('CommandLogs', function(){
  
  var systemItem = element.all(by.css('ul .tc_menuitem')).get(5);
  var cmdLogItem = systemItem.all(by.css('ul .tc_submenuitem')).get(1);
  
  beforeAll(function(){
    helpers.login();
    systemItem.click();
    cmdLogItem.click();
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
});