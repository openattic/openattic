var helpers = require('../../common.js');

describe('General', function(){

  var oaLogo = element(by.css('.tc_logo_component a'));

  var menuCheck = function(menu){
    var menuCount = 0;
    var menuItems = element.all(by.css('.tc_menuitem > a'));
    var url;

    menu.forEach(function(name){
      var item = element(by.css('.tc_menuitem_' + name + ' > a'));
      it('should have ' + name + ' into the right order', function(){
        if(item.isDisplayed()){
          expect(item.getText()).toEqual(menuItems.get(menuCount).getText());
          menuCount++;
        }
      });
      it('should click ' + item + ' and check the url', function(){
        if(item.isDisplayed() && name != 'system'){
          url = name.replace("_", "/");
          item.click();
          browser.sleep(400);
          expect(browser.getCurrentUrl()).toContain('/openattic/#/' + url);
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

  var notificationsCheck = function(){
    var api_recorder = element(by.css('.tc_api-recorder'));
    var notification_icon = element(by.css('.dropdown-notifications'));

    it('should have recent notifications', function(){
      api_recorder.click();
      api_recorder.click();
      notification_icon.click();
      expect(element(by.css('.dropdown-notifications .notification')).isDisplayed()).toBe(true);
      notification_icon.click();
    });


    it('should remove all recent notifications', function(){
      notification_icon.click();
      element(by.css('.dropdown-toolbar-actions a')).click();
      notification_icon.click();
      expect(element(by.css('.dropdown-notifications .notification')).isPresent()).toBe(false);
      expect(element(by.css('.dropdown-notifications .dropdown-footer')).isDisplayed()).toBe(true);
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
  menuCheck([ //Put here the final menu order
    'dashboard', //has to be there
    'ceph_osds',
    'ceph_rbds',
    'ceph_pools',
    'ceph_nodes',
    'ceph_crushmap',
    'system'
  ]);

  /* System and its subitems */
  subitemCheck({
    name: 'system',
    item: element(by.css('.tc_menuitem_system > a')),
    url: '/openattic/#/',
    subitems: {
      users: element(by.css('.tc_submenuitem_system_users')),
      commandlog: element(by.css('.tc_submenuitem_system_cmdlog'))
    },
    order: [
      'users',
      'commandlog'
    ]
  });

  notificationsCheck();

  it('should check if the openATTIC logo is visible', function(){
    expect(oaLogo.isDisplayed()).toBe(true);
  });

  it('should redirect to dashboard panel when clicking the openATTIC logo', function(){
    //click somewhere else to change the url
    element(by.css('.tc_menuitem_ceph_osds > a')).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/ceph/osds');
    oaLogo.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/dashboard');
  });

  afterAll(function(){
    console.log('general -> general.e2e.js');
  });
});
