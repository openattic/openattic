var helpers = require('../../common.js');
describe('Volumes add with protection', function(){
  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();

    var addBtn = element(by.css('oadatatable .tc_add_btn'));
    addBtn.click();
  });


  it('should have a deletion protection checkbox', function(){
    expect(element(by.id('volume.is_protected')).isPresent()).toBe(true);

    // Does not work because of the awesome bootstrap checkbox style
    // expect(protectedCheck.isDisplayed()).toBe(true);
  });

  it('should create a volume with deletion protection', function(){
    for(var key in helpers.configs.pools){
      // create a protected volume
      var volumename = 'protractor_volume_protected';
      element(by.id('volumeName')).sendKeys(volumename);

      var pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(volume group,')).get(0).click();

      element(by.model('data.megs')).sendKeys('100mb');
      element(by.model('volume.is_protected')).click();
      element(by.css('.tc_submitButton')).click();

      // is it displayed on the volume overview?
      browser.sleep(helpers.configs.sleep);
      var volume = element(by.cssContainingText('tr', volumename));
      var protectedColumn = volume.element(by.id('is_protected'));
      expect(protectedColumn.element(by.className('fa-check')).isDisplayed()).toBe(true);

      // release the protection
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_setProtection')).click();
      browser.sleep(400);

      element(by.id('bot2-Msg1')).click();
      browser.sleep(400);

      // delete the volume
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem')).click();
      browser.sleep(400);

      element(by.model('input.enteredName')).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();

      expect(volume.isPresent()).toBe(false);

      element(by.css('oadatatable .tc_add_btn')).click();
      console.log('volume_protection');
    }
  });
});
