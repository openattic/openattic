var helpers = require('../common.js');

describe('Should delete a Snapshot', function(){

  var volumename = 'protractor_test_volume';
  var snapshotname = 'protractor_test_snap';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  var submitButton = element(by.css('.tc_submitButton'));   
  
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
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(snapshot.isPresent()).toBe(false);
    browser.sleep(400);
  });
  
});