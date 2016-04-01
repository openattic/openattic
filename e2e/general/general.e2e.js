var helpers = require('../common.js');

describe('General', function(){

  var oaLogo = element(by.css('#logo a'));
  var hideBtn = element(by.css('#hide-menu a'));
  var minifyArrow = element(by.css('.minifyme'));
  var fullscreenBtn = element(by.id('fullscreen'));

  var menuItems = element.all(by.css('ul .tc_menuitem > a'));

  var menu = {
    items: {
      dashboard: element(by.css('ul .tc_menuitem_dashboard > a')), //has to be there
      disks: element(by.css('ul .tc_menuitem_disks > a')),
      pools: element(by.css('ul .tc_menuitem_pools > a')),
      volumes: element(by.css('ul .tc_menuitem_volumes > a')),
      ceph: element(by.css('ul .tc_menuitem_ceph > a')),
      hosts: element(by.css('ul .tc_menuitem_hosts > a')),
      system: element(by.css('ul .tc_menuitem_system > a')) //has to be there
    },
    order: [
      'dashboard',
      'disks',
      'pools',
      'volumes',
      'ceph',
      'hosts',
      'system'
    ]
  };

  var system = {
    items: {
      users: element(by.css('ul .tc_submenuitem_system_users')),
      cmdlogs: element(by.css('ul .tc_submenuitem_system_cmdlogs'))
    },
    order: [
      'users',
      'cmdlogs'
    ]
  };

  var ceph = {
    items: {
      pools: element(by.css('ul .tc_submenuitem_ceph_pools')),
      crushmap: element(by.css('ul .tc_submenuitem_ceph_crushmap'))
    },
    order: [
      'pools',
      'crushmap'
    ]
  };

  beforeAll(function(){
    helpers.login();
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toContain('openATTIC');
  });

  it('should show the name of the current user', function(){
    expect(element(by.css('.tc_usernameinfo')).getText()).toEqual('openattic');
  });

  /* Menuitems */
  it('should have all menuitems into the right order', function(){
    var menuCount = 0;
    menu.order.forEach(function(item){
      if(menu.items[item].isDisplayed()){
        expect(menu.items[item].getText()).toEqual(menuItems.get(menuCount).getText());
        menuCount++;
      }
    });
  });

  it('should click all menuitems and check the url', function(){
    for(item in menu.items){
      if(menu.items[item].isDisplayed()){
        if(item != 'system' && item != 'ceph'){
          menu.items[item].click();
          browser.sleep(400);
          expect(browser.getCurrentUrl()).toContain('/openattic/#/' + item);
        }
      }
    }
  });

  /* Ceph and its subitems */
  it('should have subitems under the system menu item', function(){
    if(menu.items.ceph.isDisplayed()){
      menu.items.ceph.click();
      menu.items.ceph = menu.items.ceph.all(by.xpath('..'));
      expect(menu.items.ceph.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
    }
  });


  it('(ceph) should have the right order of all subitems', function(){
    if(menu.items.ceph.isDisplayed()){
      var menuCount = 0;
      var subitems = menu.items.ceph.all(by.css('ul .tc_submenuitem'));
      ceph.order.forEach(function(item){
        if(ceph.items[item]){
          expect(ceph.items[item].getText()).toEqual(subitems.get(menuCount).getText());
          menuCount++;
        }
      });
    }
  });

  it('(ceph) should click all subitems and check the url', function(){
    if(menu.items.ceph.isDisplayed()){
      for(subitem in ceph.items){
        ceph.items[subitem].click();
        browser.sleep(400);
        expect(browser.getCurrentUrl()).toContain('/openattic/#/ceph/' + subitem);
      }
    }
  });

  /* System and its subitems */
  it('should have subitems under the system menu item', function(){
    menu.items.system.click();
    menu.items.system = menu.items.system.all(by.xpath('..'));
    expect(menu.items.system.all(by.css('ul .tc_submenuitem')).count()).toBeGreaterThan(0);
  });


  it('(system) should have the right order of all subitems', function(){
    var menuCount = 0;
    var subitems = menu.items.system.all(by.css('ul .tc_submenuitem'));
    system.order.forEach(function(item){
      expect(system.items[item].getText()).toEqual(subitems.get(menuCount).getText());
      menuCount++;
    });
  });

  it('(system) should click all subitems and check the url', function(){
    for(subitem in system.items){
      system.items[subitem].click();
      browser.sleep(400);
      expect(browser.getCurrentUrl()).toContain('/openattic/#/' + subitem);
    }
  });

  /*Buttons*/
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
    menu.items.pools.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/pools');
    oaLogo.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
  });

  afterAll(function(){
    console.log('general -> general.e2e.js');
  });
});
