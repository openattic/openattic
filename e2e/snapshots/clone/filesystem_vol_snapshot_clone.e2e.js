var helpers = require('../../common.js');

describe('should create a clone volume of a snapshot (base: filesystem volume)', function(){

  var clonename = "protractor_clone";
  var clone = element.all(by.cssContainingText('tr', clonename)).get(0);
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var volumename = 'protractor_clone_fsVol';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  beforeAll(function(){
    helpers.login();
    volumesItem.click();
    helpers.create_volume(volumename, "xfs");
    helpers.create_snapshot(volume);
    helpers.create_snap_clone(volume);
    browser.sleep(800);
  });

  it('should display the clone in the volumes list', function(){
    browser.sleep(800);
    expect(clone.isDisplayed()).toBe(true);
  });

  afterAll(function(){
    console.log('filesystem_vol_snapshot_clone');
    helpers.delete_snap_clone();
    browser.sleep(600);
    helpers.delete_snapshot(volume);
    browser.sleep(600);
    helpers.delete_volume(volume, volumename);
  });

});