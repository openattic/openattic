var helpers = require('../common.js');

describe('CommandLogs', function(){
  
  var systemItem = element.all(by.css('ul .tc_menuitem')).get(5);
  var cmdLogItem = systemItem.all(by.css('ul .tc_submenuitem')).get(1);
  var volumePoolSelect = element(by.model('data.sourcePool'));
  
  beforeAll(function(){
    helpers.login();
    //create a volume to check the lvcreate log entry
    helpers.create_volume("lun");
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
  
  it('should show the lvcreate log entry', function(){
      
    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      var exact_poolname = pool.name;
        element.all(by.cssContainingText('option', pool.name))      
        .then(function findMatch(pname){
          if (pool.name === pname){
            exact_poolname = pname;
            return true;
          }
        });      
            
      if (exact_poolname){
          
        var lv_create = element.all(by.cssContainingText('tr', '/sbin/lvcreate')).get(0);
        lv_create.toString();
        expect(lv_create.getText()).toContain('"/sbin/lvcreate" "-L" "100M" "-n" "protractor_test_volume" "' +
                                              exact_poolname  + '"' + "\n" + 'O Logical volume "protractor_test_volume" created');
      }
      
      break;
    }      
  });
  
  afterAll(function(){
    helpers.delete_volume();
  });
});