var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_test_volume';
  var snapshotname = 'protractor_test_snap';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  var submitButton = element(by.css('.tc_submitButton'));
  
  beforeEach(function() {
    helpers.login(); 
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
  });

  helpers.create_blockvol();
  
  require('./snapshot_workflow.e2e.js');
  
  helpers.create_snapshot();
  
  it('should display the snapshot in the snapshots overview panel', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(true);
  });
  
  helpers.delete_snapshot();

  helpers.delete_volume();
});