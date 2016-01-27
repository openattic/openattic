var helpers = require('../../common.js');
describe('Volume protection dialog', function(){
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var dropdown_menu = element(by.css('.tc_menudropdown'));
  var protected_volume = element(by.model('volume.is_protected'));
  var protection = element(by.css('.tc_setProtection > a'));
  var submit_button = element(by.id('bot2-Msg1'));
  var cancel_button = element(by.id('bot1-Msg1'));

  beforeAll(function(){
    helpers.login();

    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    element(by.css('oadatatable .tc_add_btn')).click();

    helpers.create_volume(volumename, "lun");

    volume.click();
    browser.sleep(helpers.configs.sleep);
    dropdown_menu.click();
    browser.sleep(helpers.configs.sleep);
    protection.click();
    browser.sleep(helpers.configs.sleep);
  });

  it('should have a deletion protection checkbox', function(){
    expect(protected_volume.isPresent()).toBe(true);

    cancel_button.click();
    browser.sleep(helpers.configs.sleep);
  });

  it('should be able to set the volume protection', function(){
    // set volume protection and close dialog window
    protected_volume.click();
    submit_button.click();

    // is the volume protection set?
    var protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isDisplayed()).toBe(true);

    // release volume protection
    volume.click();
    browser.sleep(helpers.configs.sleep);
    dropdown_menu.click();
    browser.sleep(helpers.configs.sleep);
    protection.click();
    browser.sleep(helpers.configs.sleep);

    protected_volume.click();
    submit_button.click();
    browser.sleep(helpers.configs.sleep);

    // is the volume protection released?
    protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isPresent()).toBe(false);
  });

  it('should not allow to delete a protected volume', function(){
    // set volume protection and close dialog window
    protected_volume.click();
    submit_button.click();

    // try to delete the volume
    volume.click();
    browser.sleep(helpers.configs.sleep);
    dropdown_menu.click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_deleteItem > a')).click();
    browser.sleep(helpers.configs.sleep);

    // the volume management should show an error message
    expect(element(by.css('.tc_notDeletable')).isDisplayed()).toBe(true);

    // release volume protection
    volume.click();
    browser.sleep(helpers.configs.sleep);
    dropdown_menu.click();
    browser.sleep(helpers.configs.sleep);
    protection.click();
    browser.sleep(helpers.configs.sleep);
    protected_volume.click();
    submit_button.click();
    browser.sleep(helpers.configs.sleep);
    console.log('volumes_protection in protection dir');
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
  });
});