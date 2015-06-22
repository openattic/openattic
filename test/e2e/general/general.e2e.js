var helpers = require('../common.js');

describe('General', function() {

  beforeAll(function() {
    helpers.login();
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toEqual('openATTIC');
  });

  it('should show the name of the current user', function(){
    expect(element(by.css('span .tc_usernameinfo')).getText()).toEqual('Openattic');
  });

  it('should have dashboard as first nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(0).getText()).toEqual('Dashboard');
  });

  it('should have disks as second nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(1).getText()).toEqual('Disks');
  });

  it('should have pools as third nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(2).getText()).toEqual('Pools');
  });

  it('should have volumes as fourth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(3).getText()).toEqual('Volumes');
  });

  it('should have hosts as fifth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(4).getText()).toEqual('Hosts');
  });

  it('should have system as sixth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(5).getText()).toEqual('System');
  });

  it('should have subitems under the system menu item', function(){
    var systemItem = element.all(by.css('ul .tc_menuitem')).get(5);
    systemItem.click();

    expect(systemItem.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
  });

  it('system should have "User", "Command Logs" and "CRUSH Map" as submenu items', function(){
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(0).getText()).toEqual('Users');
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(1).getText()).toEqual('Command Logs');
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(2).getText()).toEqual('CRUSH Map');    
  });
});
