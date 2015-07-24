var helpers = require('../../common.js');
describe('Volumes resize', function(){
  var volumename = 'protractor_test_volume';
  var pool;

  
  beforeAll(function(){
    helpers.login();    
  });
  
  beforeEach(function(){
    
    //--> volumesItem is not defined    
    //var volumesItem = helpers.configs.menuitems.volumes;
    //element.all(by.css('ul .tc_menuitem')).get(volumesItem).click();
    
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();    
    element(by.css('oadatatable .tc_add_btn')).click();

    for(var key in helpers.configs.pools) {
      element(by.id('volume.name')).sendKeys(volumename);

      pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(volume group,')).get(0).click();

      element(by.model('data.megs')).sendKeys('200mb');
      element(by.css('.tc_submitButton')).click();
      browser.sleep(helpers.configs.sleep);

      break;
    }

    element(by.cssContainingText('tr', volumename)).click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_resize_btn')).click();
    browser.sleep(helpers.configs.sleep);
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

  it('should have a resize and a cancel button', function(){
    expect(element(by.id('bot2-Msg1')).isDisplayed()).toBe(true);
    expect(element(by.id('bot1-Msg1')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
  });

  it('should show a required field error if the submit button is clicked without editing anything', function(){
    element(by.id('bot2-Msg1')).click();
    expect(element(by.css('.tc_required')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
  });

  it('should show a message if the chosen size is smaller than 100mb', function(){
    element(by.id('newsize')).sendKeys('99mb');
    expect(element(by.css('.tc_wrongSize')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
  });

  it('should show a message if the chosen size is higher than the pool size', function(){
    var newsize = pool.size + 201;
    element(by.id('newsize')).sendKeys(newsize + pool.unit);
    expect(element(by.css('.tc_wrongSize')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
  });

  it('should be able to resize a volume with a valid size', function(){
    element(by.id('newsize')).sendKeys('250mb');
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);

    var volume = element(by.cssContainingText('tr', volumename));
    expect(volume.element(by.binding('row.usage.size_text')).getText()).toEqual('250.00MB');
  });

  it('should not allow to shrink the volume', function(){
    element(by.id('newsize')).sendKeys('170mb');
    expect(element(by.css('.tc_wrongSize')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
    console.log('resize volume');
  });
});