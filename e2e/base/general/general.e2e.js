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
        if(item.isDisplayed()){
          url = name.replace("_", "/");
          item.click();
          browser.sleep(400);
          expect(browser.getCurrentUrl()).toContain('/openattic/#/' + url);
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
    'ceph_osds',
    'ceph_rbds',
    'ceph_pools',
    'ceph_nodes',
    'ceph_crushmap'
  ]);

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
