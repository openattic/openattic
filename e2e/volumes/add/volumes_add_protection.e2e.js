var helpers = require('../../common.js');
describe('Volumes add with protection', function(){

  var protection = element(by.model('result.is_protected'));
  var volumename = 'protractor_volume_protected';
  var volumePoolSelect = element(by.model('pool'));
  var volume = element(by.cssContainingText('tr', volumename));
  var protectedColumn = volume.element(by.id('is_protected'));

  var protectedVolumeTest = function(pool){
    it('should create a volume with deletion protection on ' + pool, function(){
        // create a protected volume
        element(by.model('result.name')).sendKeys(volumename);

        volumePoolSelect.click();
        element.all(by.cssContainingText('option', '(volume group,')).get(0).click();

        element(by.model('data.megs')).sendKeys('100mb');
        protection.click();
        element(by.css('.tc_submitButton')).click();

        // is it displayed on the volume overview?
        browser.sleep(helpers.configs.sleep);
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
    });
  }

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();

    var addBtn = element(by.css('oadatatable .tc_add_btn'));
    addBtn.click();
  });


  it('should have a deletion protection checkbox', function(){
    expect(protection.isPresent()).toBe(true);
  });

  for(var key in helpers.configs.pools){
    protectedVolumeTest(helpers.configs.pools[key]);
  }

  afterAll(function(){
    console.log('volumes_add -> volumes_add_protection.e2e.js');
  });
});
