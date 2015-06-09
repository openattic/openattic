// var helpers = require('../common.js');
// 
// describe('Should create clone of a snapshot', function(){
//   
//   var volumename = 'protractor_test_volume';
//   var volume = element(by.cssContainingText('tr', volumename));
//   
//   var snapshotname = 'protractor_test_snap';
//   var snapshot = element(by.cssContainingText('tr', snapshotname));
//   
//     var clonename ="protractor_test_clone";
//   var clone = element(by.cssContainingText('tr', clonename));
//   
//   var snapMenuBtn = element.all(by.css('.tc_menudropdown')).get(1);
//   
//   it('it should create a clone of the volume', function(){
//     expect(volume.isDisplayed()).toBe(true);
//     volume.click();
//     browser.sleep(400);
//     element(by.css('.tc_snapshotTab')).click();
//     browser.sleep(400);
//     expect(snapshot.isDisplayed()).toBe(true);
//     snapshot.click();
//     snapMenuBtn.click();
//     browser.sleep(400);
//     element(by.css('.tc_snap_clone')).click();
//     browser.sleep(400);
//     element(by.model('clone_obj.name')).sendKeys(clonename);
//     element(by.id('bot2-Msg1')).click();
//     browser.sleep(800);
//   });
// });