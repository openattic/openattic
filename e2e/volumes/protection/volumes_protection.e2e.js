var helpers = require('../../common.js');
describe('Volume protection dialog', function(){
  var volumename = 'protractor_test_volume';

  beforeEach(function(){
    helpers.login();

    element.all(by.css('ul .tc_menuitem')).get(3).click();
    element(by.css('oadatatable .tc_add_btn')).click();

    helpers.create_volume(volumename, "lun");

    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_setProtection')).click();
    browser.sleep(helpers.configs.sleep);
  });

  afterEach(function(){
    helpers.delete_volume(volume, volumename);
  });

  it('should have a deletion protection checkbox', function(){
    expect(element(by.model('volume.is_protected')).isPresent()).toBe(true);

    element(by.id('bot1-Msg1')).click();
    browser.sleep(helpers.configs.sleep);
  });

  it('should be able to set the volume protection', function(){
    // set volume protection and close dialog window
    element(by.model('volume.is_protected')).click();
    element(by.id('bot2-Msg1')).click();

    // is the volume protection set?
    var volume = element(by.cssContainingText('tr', volumename));
    var protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isDisplayed()).toBe(true);

    // release volume protection
    volume.click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_setProtection')).click();
    browser.sleep(helpers.configs.sleep);

    element(by.model('volume.is_protected')).click();
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);

    // is the volume protection released?
    volume = element(by.cssContainingText('tr', volumename));
    protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isPresent()).toBe(false);
  });

  it('should not allow to delete a protected volume', function(){
    // set volume protection and close dialog window
    element(by.model('volume.is_protected')).click();
    element(by.id('bot2-Msg1')).click();

    // try to delete the volume
    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(helpers.configs.sleep);

    // the volume management should show an error message
    expect(element(by.css('.tc_notDeletable')).isPresent()).toBe(true);

    // release volume protection
    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_setProtection')).click();
    browser.sleep(helpers.configs.sleep);
    element(by.model('volume.is_protected')).click();
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);
    console.log('volumes_protection in protection dir');
  });
});
