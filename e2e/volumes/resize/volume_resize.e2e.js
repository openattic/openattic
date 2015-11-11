var helpers = require('../../common.js');
describe('Volumes resize', function(){
  var volumename = 'protractor_test_volume';
  var pool;
  var volume = element(by.cssContainingText('tr', volumename));
  var wrongSize = function(new_size){
    element(by.id('newsize')).sendKeys(new_size);
    expect(element(by.css('.tc_wrongSize')).isDisplayed()).toBe(true);
    element(by.id('bot1-Msg1')).click();
  };


  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){

    //--> volumesItem is not defined    
    //var volumesItem = helpers.configs.menuitems.volumes;
    //element.all(by.css('ul .tc_menuitem')).get(volumesItem).click();

    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    pool = helpers.create_volume(volumename, "lun", "200mb", pool);

    volume.click();
    browser.sleep(helpers.configs.sleep);
    element(by.css('.tc_resize_btn')).click();
    browser.sleep(helpers.configs.sleep);
  });

  afterEach(function(){
    helpers.delete_volume(volume, volumename);
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
    wrongSize('99mb');
  });

  it('should show a message if the chosen size is higher than the pool size', function(){
    wrongSize(pool.size + 201 + pool.unit);
  });

  it('should be able to resize a volume with a valid size', function(){
    element(by.id('newsize')).sendKeys('250mb');
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);

    var volume = element(by.cssContainingText('tr', volumename));
    expect(volume.element(by.binding('row.usage.size_text')).getText()).toEqual('250.00MB');
  });

  it('should not allow to shrink the volume', function(){
    wrongSize('170mb');
    console.log('resize volume');
  });
});
