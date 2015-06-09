var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_test_volume';
  var snapshotname = 'protractor_test_snap';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  var submitButton = element(by.css('.tc_submitButton'));
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  
  beforeAll(function() {
    helpers.login();
    helpers.create_volume("xfs");
  });

  require('./snapshot_workflow.e2e.js');
  
  beforeEach(function(){
    volumesItem.click();  
  });
  
  it('should create the snapshot "protractor_test_snap"', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    element(by.css('.tc_snapshotAdd')).click();
    browser.sleep(400);
    element(by.id('snap.name')).clear();
    browser.sleep(400);
    element(by.model('snap.name')).sendKeys(snapshotname);
    browser.sleep(400);
    submitButton.click();
    browser.sleep(400);
    
  });
  
  it('should display the snapshot in the snapshots overview panel', function(){
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(true);
  });
  
  it('should delete the "protractor_test_snap" snapshot', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(true);
    snapshot.click();
    browser.sleep(400);
    element(by.css('.tc_deleteSnapItem')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(false);
    browser.sleep(400);      
  });

  afterAll(function(){
    helpers.delete_volume();  
  });
  
});