var helpers = require('../common.js');
  
describe('should create a filesystem volume', function(){
  var volumename = 'protractor_test_volume';  
  var volume = element(by.cssContainingText('tr', volumename));
  
  it('should create a simple filesystem volume', function(){

    element(by.css('oadatatable .tc_add_btn')).click();

    for(var key in helpers.configs.pools) {
      element(by.id('volume.name')).sendKeys(volumename);
      var pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();
      element(by.id('xfs')).click();

      element(by.model('data.megs')).sendKeys('100MB');
      element(by.css('.tc_submitButton')).click();
      browser.sleep(helpers.configs.sleep);

      break;
    }
  });
});