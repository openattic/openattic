var helpers = require('../common.js');

describe('General', function(){

  var oaLogo = element(by.css('.tc_logo_component a'));

  var menuCheck = function(menu){
    var menuCount = 0;
    var menuItems = element.all(by.css('.tc_menuitem > a'));

    menu.forEach(function(name){
      var item = element(by.css('.tc_menuitem_' + name + ' > a'));
      it('should have ' + name + ' into the right order', function(){
        if(item.isDisplayed()){
          expect(item.getText()).toEqual(menuItems.get(menuCount).getText());
          menuCount++;
        }
      });
      it('should click ' + item + ' and check the url', function(){
        if(item.isDisplayed()){
          if(name != 'system' && name != 'ceph'){
            item.click();
            browser.sleep(400);
            expect(browser.getCurrentUrl()).toContain('/openattic/#/' + name);
          }
        }
      });
    });
  };

  var subitemCheck = function(dropdown){
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
  menuCheck([ //Put here the final menu order
    'dashboard', //has to be there
    'disks',
    'pools',
    'volumes',
    'ceph',
    'hosts',
    'system' //has to be there
  ]);

  /* Ceph and its subitems */
  subitemCheck({
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
  subitemCheck({
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
    element(by.css('.tc_menuitem_pools > a')).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/pools');
    oaLogo.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
  });

  afterAll(function(){
    console.log('general -> general.e2e.js');
  });
});
