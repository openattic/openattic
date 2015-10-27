var helpers = require('../common.js');

describe('General', function() {

  var dashboardItem = element.all(by.css('ul .tc_menuitem')).get(0);
  var disksItem     = element.all(by.css('ul .tc_menuitem')).get(1);
  var poolsItem     = element.all(by.css('ul .tc_menuitem')).get(2);
  var volumesItem   = element.all(by.css('ul .tc_menuitem')).get(3);
  var hostsItem     = element.all(by.css('ul .tc_menuitem')).get(4);
  var systemItem    = element.all(by.css('ul .tc_menuitem')).get(5);

  var oaLogo = element(by.id('logo'));
  var hideBtn = element(by.id('hide-menu'));
  var minifyArrow = element(by.css('.minifyme'));

  beforeAll(function() {
    helpers.login();
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toContain('openATTIC');
  });

  it('should show the name of the current user', function(){
    expect(element(by.css('span .tc_usernameinfo')).getText()).toEqual('Openattic');
  });

  it('should have dashboard as first nav item', function(){
    expect(dashboardItem.getText()).toEqual('Dashboard');
  });

  it('should have disks as second nav item', function(){
    expect(disksItem.getText()).toEqual('Disks');
  });

  it('should have pools as third nav item', function(){
    expect(poolsItem.getText()).toEqual('Pools');
  });

  it('should have volumes as fourth nav item', function(){
    expect(volumesItem.getText()).toEqual('Volumes');
  });

  it('should have hosts as fifth nav item', function(){
    expect(hostsItem.getText()).toEqual('Hosts');
  });

  it('should have system as sixth nav item', function(){
    expect(systemItem.getText()).toEqual('System');
  });

  it('should have subitems under the system menu item', function(){
    systemItem.click();
    expect(systemItem.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
  });

  it('system should have "User", "Command Logs" and "CRUSH Map" as submenu items', function(){
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(0).getText()).toEqual('Users');
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(1).getText()).toEqual('Command Logs');
    expect(systemItem.all(by.css('ul .tc_submenuitem')).get(2).getText()).toEqual('CRUSH Map');
  });

  it('should have a collapse menu button', function(){
    expect(hideBtn.isDisplayed()).toBe(true);
  });

  it('should click "collapse menu" button and check if associated css class is set', function(){
    hideBtn.click();
    expect(element(by.css('.hidden-menu')).isPresent()).toBe(true);
    hideBtn.click();
    expect(element(by.css('.hidden-menu')).isPresent()).toBe(false);
  });

  it('should check minify arrow ', function(){
    minifyArrow.click();
    expect(element(by.css('.minified')).isPresent()).toBe(true);

    minifyArrow.click();
    expect(element(by.css('.minified')).isPresent()).toBe(false);
  });

  it('should check if the openATTIC logo is visible', function(){
    expect(oaLogo.isDisplayed()).toBe(true);
  });

  it('should redirect to dashboard panel when clicking the openATTIC logo', function(){
    //click somewhere else to change the url
    poolsItem.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/pools');
    oaLogo.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
  });

  //TODO check full screen button

});