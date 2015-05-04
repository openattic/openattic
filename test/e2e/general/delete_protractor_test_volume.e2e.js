  var helpers = require('../common.js');
  describe('Should delete the test volume called "protractor_test_volume"', function(){
    var volumename = 'protractor_test_volume';
    var volume = element(by.cssContainingText('tr', volumename));

  it('should delete the protractor_test_volume', function(){
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(400);

    element(by.model('input.enteredName')).sendKeys(volumename);
    element(by.id('bot2-Msg1')).click();

    expect(volume.isPresent()).toBe(false);
  });
});