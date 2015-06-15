var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_test_volume';
  var snapshotname = 'protractor_test_snap';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  
  beforeAll(function() {
    helpers.login();
    element.all(by.css('ul .tc_menuitem')).get(3).click();
    helpers.create_volume("lun");
    helpers.create_snapshot();
  });
  
  it('should display the snapshot in the snapshots overview panel', function(){
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(true);
  });
  
  afterAll(function(){
    helpers.delete_snapshot();
    helpers.delete_volume();
  });
  
});