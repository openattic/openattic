var helpers = require('../common.js');

describe('General', function(){

  var oaLogo = element(by.css('#logo a'));
  var hideBtn = element(by.css('#hide-menu a'));
  var minifyArrow = element(by.css('.minifyme'));
  var fullscreenBtn = element(by.id('fullscreen'));

  var menuItems = element.all(by.css('ul .tc_menuitem > a'));

  var menuStructure = {
    dashboard: element(by.css('ul .tc_menuitem_dashboard > a')), //has to be there
    disks: element(by.css('ul .tc_menuitem_disks > a')),
    pools: element(by.css('ul .tc_menuitem_pools > a')),
    volumes: element(by.css('ul .tc_menuitem_volumes > a')),
    ceph: element(by.css('ul .tc_menuitem_ceph > a')),
    hosts: element(by.css('ul .tc_menuitem_hosts > a')),
    system: element(by.css('ul .tc_menuitem_system > a')) //has to be there
  };

  var menuOrder = [
    'dashboard',
    'disks',
    'pools',
    'volumes',
    'ceph',
    'hosts',
    'system'
  ];

  var systemItems = {
    users: element(by.css('ul .tc_submenuitem_system_users')),
    cmdlogs: element(by.css('ul .tc_submenuitem_system_cmdlogs'))
  };

  var systemOrder = [
    'users',
    'cmdlogs'
  ];

  var cephItems = {
    pools: element(by.css('ul .tc_submenuitem_ceph_pools')),
    crushmap: element(by.css('ul .tc_submenuitem_ceph_crushmap'))
  };

  var cephOrder = [
    'pools',
    'crushmap'
  ];

  beforeAll(function(){
    helpers.login();
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toContain('openATTIC');
  });

  it('should show the name of the current user', function(){
    expect(element(by.css('span .tc_usernameinfo')).getText()).toEqual('Openattic');
  });

  /* Menuitems */
  it('should have all menuitems into the right order', function(){
    var menuCount = 0;
    menuOrder.forEach(function(item){
      if(menuStructure[item]){
        expect(menuStructure[item].getText()).toEqual(menuItems.get(menuCount).getText());
        menuCount++;
      }
    });
  });

  it('should click all menuitems and check the url', function(){
    for(item in menuStructure){
      if(menuStructure[item]){
        if(item != 'system' && item != 'ceph'){
          menuStructure[item].click();
          browser.sleep(400);
          expect(browser.getCurrentUrl()).toContain('/openattic/#/' + item);
        }
      }
    }
  });

  /* Ceph and its subitems */
  if(menuStructure.ceph){
    it('should have subitems under the system menu item', function(){
      menuStructure.ceph.click();
      menuStructure.ceph = menuStructure.ceph.all(by.xpath('..'));
      expect(menuStructure.ceph.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
    });


    it(' (ceph) should have the right orde of all subitems', function(){
      var menuCount = 0;
      var subitems = menuStructure.ceph.all(by.css('ul .tc_submenuitem'));
      cephOrder.forEach(function(item){
        if(cephItems[item]){
          expect(cephItems[item].getText()).toEqual(subitems.get(menuCount).getText());
          menuCount++;
        }
      });
    });

    it(' (ceph) should click all subitems and check the url', function(){
      for(subitem in cephItems){
        cephItems[subitem].click();
        browser.sleep(400);
        expect(browser.getCurrentUrl()).toContain('/openattic/#/ceph/' + subitem);
      }
    });
  }

  /* System and its subitems */
  if(menuStructure.system){
    it('should have subitems under the system menu item', function(){
      menuStructure.system.click();
      menuStructure.system = menuStructure.system.all(by.xpath('..'));
      expect(menuStructure.system.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
    });


    it(' (system) should have the right orde of all subitems', function(){
      var menuCount = 0;
      var subitems = menuStructure.system.all(by.css('ul .tc_submenuitem'));
      systemOrder.forEach(function(item){
        if(systemItems[item]){
          expect(systemItems[item].getText()).toEqual(subitems.get(menuCount).getText());
          menuCount++;
        }
      });
    });

    it(' (system) should click all subitems and check the url', function(){
      for(subitem in systemItems){
        systemItems[subitem].click();
        browser.sleep(400);
        expect(browser.getCurrentUrl()).toContain('/openattic/#/' + subitem);
      }
    });
  }

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
    menuStructure.pools.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/pools');
    oaLogo.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
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
             menuStructure.volumes.click();
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
});
