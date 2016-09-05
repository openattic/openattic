var helpers = require('../../common.js');

describe('CommandLogs', function(){

  var systemItem = element(by.css('ul .tc_menuitem_system'));
  var cmdLogItem = systemItem.element(by.css('ul .tc_submenuitem_system_cmdlogs > a'));
  systemItem = systemItem.all(by.css(' a')).first();
  var volumePoolSelect = element(by.model('data.sourcePool'));
  var volumename = 'protractor_cmdlog_vol';
  var volume = element(by.cssContainingText('tr', volumename));

  beforeAll(function(){
    helpers.login();
    //create a volume to check the lvcreate log entry
    helpers.create_volume(volumename, "lun");
    browser.sleep(400);
    systemItem.click();
    browser.sleep(400);
    cmdLogItem.click();
    browser.sleep(400);
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

  it('should contain the lvcreate log entry', function(){

    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      var exact_poolname = pool.name;
      element.all(by.cssContainingText('option', pool.name)).then(function findMatch(pname){
        if (pool.name === pname){
          exact_poolname = pname;
          return true;
        }
      });

      if(exact_poolname){
        element(by.css('.tc_entries_dropdown')).click();
        browser.sleep(400);
        element(by.css('.tc_entries_100')).click();
        browser.sleep(400);
        var lv_create = element.all(by.cssContainingText('tr', '/sbin/lvcreate')).get(0);
        lv_create.toString();
        expect(lv_create.getText()).toContain('"/sbin/lvcreate" "-L" "100M" "-n" "protractor_cmdlog_vol" "' +
                                              exact_poolname  + '"' + "\n" + 'O Logical volume "protractor_cmdlog_vol" created');
      }

      break;
    }
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('cmdlogs -> cmdLogs.e2e.js');
  });
});
