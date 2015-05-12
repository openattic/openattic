var helpers = require('../../common.js');

describe('should create a clone volume of a snapshot (base: blockvolume)', function(){
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  
  var snapshotname = 'protractor_test_snap';
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  
  var clonename ="protractor_test_clone";
  var clone = element(by.cssContainingText('tr', clonename));
  
  var submitButton = element(by.css('.tc_submitButton'));  
    
  var cloneButton = element.all(by.css('.tc_menudropdown')).get(1);
  
  beforeEach(function() {
    helpers.login(); 
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
  });
  
  helpers.create_blockvol();
  
  it('should create the snapshot', function(){
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
  });
  
  it('should not allow spaces or additional characters', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isDisplayed()).toBe(true);
    snapshot.click();
    browser.sleep(400);
    cloneButton.click();
    browser.sleep(400);
    element(by.css('.tc_snap_clone')).click();
    browser.sleep(400);
    var test = "öasdf 123";
    element(by.model('clone_obj.name')).sendKeys(test);
    browser.sleep(400);
    expect(element(by.css('.tc_cloneNoValidName')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
    expect(element(by.css('.tc_oadatatable_snapshots')).isPresent()).toBe(true);
  });
  
  
  
  it('it should create a clone of the volume', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isDisplayed()).toBe(true);
    snapshot.click();
    cloneButton.click();
    browser.sleep(400);
    element(by.css('.tc_snap_clone')).click();
    browser.sleep(400);
    element(by.model('clone_obj.name')).sendKeys(clonename);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });
  
  
  it('should display the clone in the volumes list', function(){
    browser.sleep(600);
    expect(clone.isDisplayed()).toBe(true);
  });
  
  it('should delete the clone volume', function(){
    expect(clone.isDisplayed()).toBe(true);
    clone.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(400);

    element(by.model('input.enteredName')).sendKeys(clonename);
    element(by.id('bot2-Msg1')).click();        
  });
  
  it('should delete the snapshot', function(){
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
  });
  
  helpers.delete_volume();
    
});
