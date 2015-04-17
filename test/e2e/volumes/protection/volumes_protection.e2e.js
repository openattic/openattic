var helpers = require('../../common.js');
describe('Volume protection dialog', function() {
  var volumename = 'protractor_test_volume';

  beforeEach(function() {
    helpers.login();

    element.all(by.css('ul .tc_menuitem')).get(3).click();
    element(by.css('oadatatable .tc_add_btn')).click();

    for(var key in helpers.configs.pools) {
      element(by.id('volume.name')).sendKeys(volumename);

      var pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();

      element(by.model('data.megs')).sendKeys('100mb');
      element(by.css('.tc_submitButton')).click();
      browser.sleep(helpers.configs.sleep);

      break;
    }
  });

  afterEach(function() {
    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.model('input.enteredName')).sendKeys(volumename);
    element(by.id('bot2-Msg1')).click();
  });

  it('should have a deletion protection checkbox', function(){
    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_setProtection')).click();
    browser.sleep(helpers.configs.sleep);

    expect(element(by.model('volume.is_protected')).isPresent()).toBe(true);

    element(by.id('bot1-Msg1')).click();
    browser.sleep(helpers.configs.sleep);
  });
});