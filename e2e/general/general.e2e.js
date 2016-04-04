var helpers = require('../common.js');

describe('General', function(){

  var oaLogo = element(by.css('.tc_logo_component a'));
  var menuItems = element.all(by.css('.tc_menuitem > a'));

  var menu = {
    items: {
      dashboard: element(by.css('.tc_menuitem_dashboard > a')), //has to be there
      disks: element(by.css('.tc_menuitem_disks > a')),
      pools: element(by.css('.tc_menuitem_pools > a')),
      volumes: element(by.css('.tc_menuitem_volumes > a')),
      ceph: element(by.css('.tc_menuitem_ceph > a')),
      hosts: element(by.css('.tc_menuitem_hosts > a')),
      system: element(by.css('.tc_menuitem_system > a')) //has to be there
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

  var subitemTests = function(dropdown){
    var subitems = dropdown.item.all(by.xpath('..')).all(by.css('ul .tc_submenuitem'));
    var menuCount = 0;

    it('should have subitems under the ' + dropdown.name + ' menu item', function(){
      if(dropdown.item.isDisplayed()){
        dropdown.item.click();
        expect(subitems.count()).toBeGreaterThan(0);
      }
    });

    dropdown.order.forEach(function(item){
      it('should have ' + dropdown.name + ' subitem ' + item + ' in the right order', function(){
        if(dropdown.item.isDisplayed()){
          dropdown.item.click();
          expect(dropdown.subitems[item].getText()).toEqual(subitems.get(menuCount).getText());
          menuCount++;
        }
      });
      it('should click ' + dropdown.name + ' subitem ' + item + ' and check the url', function(){
        if(dropdown.item.isDisplayed()){
          browser.refresh();
          dropdown.item.click();
          dropdown.subitems[item].click();
          expect(browser.getCurrentUrl()).toContain(dropdown.url + item);
        }
      });
    });
  }


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
  var menuCount = 0;
  menu.order.forEach(function(item){
    it('should have ' + item + ' into the right order', function(){
      if(menu.items[item].isDisplayed()){
        expect(menu.items[item].getText()).toEqual(menuItems.get(menuCount).getText());
        menuCount++;
      }
    });
    it('should click ' + item + ' and check the url', function(){
      if(menu.items[item].isDisplayed()){
        if(item != 'system' && item != 'ceph'){
          menu.items[item].click();
          browser.sleep(400);
          expect(browser.getCurrentUrl()).toContain('/openattic/#/' + item);
        }
      }
    });
  });

  /* Ceph and its subitems */
  subitemTests({
    name: 'ceph',
    item: element(by.css('.tc_menuitem_ceph > a')),
    url: '/openattic/#/ceph/',
    subitems: {
      pools: element(by.css('.tc_submenuitem_ceph_pools')),
      crushmap: element(by.css('.tc_submenuitem_ceph_crushmap'))
    },
    order: [
      'pools',
      'crushmap'
    ]
  });

  /* System and its subitems */
  subitemTests({
    name: 'system',
    item: element(by.css('.tc_menuitem_system > a')),
    url: '/openattic/#/',
    subitems: {
      users: element(by.css('.tc_submenuitem_system_users')),
      cmdlogs: element(by.css('.tc_submenuitem_system_cmdlogs'))
    },
    order: [
      'users',
      'cmdlogs'
    ]
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
