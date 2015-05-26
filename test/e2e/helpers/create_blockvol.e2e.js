var helpers = require('../common.js');
  
describe('should create a blockvolume', function(){
  var volumename = 'protractor_test_volume';  
  var volume = element(by.cssContainingText('tr', volumename));
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  
  
  it('should create a simple block volume', function(){
    volumesItem.click();
    element(by.css('oadatatable .tc_add_btn')).click();

    for(var key in helpers.configs.pools) {
      element(by.id('volume.name')).sendKeys(volumename);
      var pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();

      element(by.model('data.megs')).sendKeys('100MB');
      element(by.css('.tc_submitButton')).click();
      browser.sleep(helpers.configs.sleep);

      break;
    }
  });
});