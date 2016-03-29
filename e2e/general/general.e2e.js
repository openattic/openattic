var helpers = require('../common.js');

describe('General', function(){

  var menuItems = element.all(by.css('ul .tc_menuitem > a'));
  var dashboardItem = menuItems.get(0);
  var disksItem = menuItems.get(1);
  var poolsItem = menuItems.get(2);
  var volumesItem = menuItems.get(3);
  var hostsItem = menuItems.get(4);
  var systemItem = menuItems.get(5);

  var oaLogo = element(by.css('#logo a'));
  var hideBtn = element(by.css('#hide-menu a'));
  var minifyArrow = element(by.css('.minifyme'));
  var fullscreenBtn = element(by.id('fullscreen'));

  beforeAll(function(){
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
    systemItem = systemItem.all(by.xpath('..'));
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

  it('should click on dashboard and check the url', function(){
    dashboardItem.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
  });

  it('should click on disks and check the url', function(){
    disksItem.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#/disks');
  });

  it('should click on pools and check the url', function(){
    poolsItem.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#/pools');
  });

  it('should click on volumes and check the url', function(){
    volumesItem.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
  });

  it('should click on hosts and check the url', function(){
    hostsItem.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#/hosts');
  });

  it('should click on System->Users and check the url', function(){
    systemItem.click();
    systemItem.all(by.css('ul .tc_submenuitem')).get(0).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/users');
  });

  it('should click on System->Command Logs and check the url', function(){
    systemItem.click();
    systemItem.all(by.css('ul .tc_submenuitem')).get(1).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/cmdlogs');
  });

  it('should click on System->CRUSH Map and check the url', function(){
    systemItem.click();
    systemItem.all(by.css('ul .tc_submenuitem')).get(2).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/crushmap');
  });

  it('should check the fullscreen mode', function(){
    expect(fullscreenBtn.isPresent()).toBe(true);

    //enter fullscreen mode
    fullscreenBtn.click();

    browser.getCapabilities().then(function(capabilities) {
      browser_name = capabilities.caps_.browserName;

    }).then(function(){

         if(browser_name == 'chrome'){
           console.log('browser: ' + browser_name);
           browser.executeScript('return document.webkitIsFullScreen').then(function(doc){
             expect(doc).toBe(true);
             //click somewhere else and expect that we're still in fullscreen mode
             volumesItem.click();
             expect(doc).toBe(true);
           });

           //leave fullscreen
           fullscreenBtn.click();

           browser.executeScript('return document.webkitIsFullScreen').then(function(doc){
             browser.sleep(400);
             expect(doc).toBe(false);
           });

         } else{
               //this should work for firefox, but for some reasons firefox will return 'true' when fullscreen mode has been left
               //TODO find fix for above mentioned problem
               console.log('browser: ' + browser_name);
               //fullscreenBtn.click();
//                browser.executeScript('return document.mozFullScreen').then(function(doc){
//                  browser.sleep(400);
//                  expect(doc).toBe(true);
//                  browser.sleep(400);
//                  volumesItem.click();
//                  browser.sleep(400);
//                  expect(doc).toBe(true);
//                });

              //leave fullscreen
              fullscreenBtn.click();
              browser.sleep(400);
              console.log('left fullscreen');

//               browser.executeScript('return document.mozFullScreen').then(function(doc){
//                 browser.sleep(400);
//                 expect(doc).toBe(false);
//               });
         }
    });
  });

  afterAll(function(){
    console.log('general -> general.e2e.js');
  });
});
