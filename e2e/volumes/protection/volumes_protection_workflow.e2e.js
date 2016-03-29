var helpers = require('../../common.js');
describe('Volume protection dialog', function(){
  var volumename = 'protractor_test_protected_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var dropdown_menu = element(by.css('.tc_menudropdown'));
  var protected_volume = element(by.model('volume.is_protected'));
  var protection = element(by.css('.tc_setProtection > a'));
  var submit_button = element(by.id('bot2-Msg1'));
  var cancel_button = element(by.id('bot1-Msg1'));
  var closePopup = function(){
    var popup = element(by.css('.SmallBox .textoFull'));
    if (popup.isDisplayed()){
      popup.click();
    }
  }

  beforeAll(function(){
    helpers.login();

    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    element(by.css('oadatatable .tc_add_btn')).click();

    helpers.create_volume(volumename, "lun");
  });

  beforeEach(function(){
    volume.click();
    browser.sleep(400);
    dropdown_menu.click();
    browser.sleep(400);
    protection.click();
    browser.sleep(400);
  });

  it('should have a submit button named "Set protection"', function(){
    expect(submit_button.getText()).toBe("Set protection");

    cancel_button.click();
    closePopup();
  });

  it('should be able to set the volume protection', function(){
    // set volume protection and close dialog window
    submit_button.click();

    // is the volume protection set?
    var protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isDisplayed()).toBe(true);
  });

  it('should not allow to delete a protected volume', function(){
    // set volume protection and close dialog window
    cancel_button.click();
    closePopup();

    // try to delete the volume
    volume.click();
    browser.sleep(400);
    dropdown_menu.click();
    element(by.css('.tc_deleteItem > a')).click();
    browser.sleep(400);

    // the volume management should show an error message
    expect(element(by.css('.tc_notDeletable')).isDisplayed()).toBe(true);
    closePopup();
  });

  it('should have a submit button named "Unset protection"', function(){
    expect(submit_button.getText()).toBe("Unset protection");

    cancel_button.click();
    closePopup();
  });

  it('should be able to unset the volume protection', function(){
    // release volume protection
    submit_button.click();
    browser.sleep(400);

    // is the volume protection released?
    var protectedColumn = volume.element(by.id('is_protected'));
    expect(protectedColumn.element(by.className('fa-check')).isPresent()).toBe(false);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('volumes_protection -> volumes_protection_workflow.e2e.js');
  });
});
