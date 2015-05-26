var helpers = require('../common.js');

describe('Should delete the snapshot clone', function(){
 
  var clonename ="protractor_test_clone";
  var clone = element(by.cssContainingText('tr', clonename));
  
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
});