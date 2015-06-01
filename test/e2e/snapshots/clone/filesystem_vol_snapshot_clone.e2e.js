var helpers = require('../../common.js');

describe('should create a clone volume of a snapshot (base: filesystem volume)', function(){
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  
  var snapshotname = 'protractor_test_snap';
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  
  var clonename ="protractor_test_clone";
  var clone = element(by.cssContainingText('tr', clonename));
    
  var snapMenuBtn = element.all(by.css('.tc_menudropdown')).get(1);
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  
  beforeAll(function(){
    helpers.login();
    helpers.create_volume("xfs");
  });
  
  beforeEach(function() {
    volumesItem.click();
  });
  
  helpers.create_snapshot();
  
  helpers.create_snap_clone();
  browser.sleep(600);
  
  
  it('should display the clone in the volumes list', function(){
    browser.sleep(800);
    expect(clone.isDisplayed()).toBe(true);
  });
  
  helpers.delete_snap_clone();  
  
  helpers.delete_snapshot();
  
  
  afterAll(function(){
    helpers.delete_volume();  
  });
});
