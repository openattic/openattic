var helpers = require('./common.js');
describe('Volumes add', function() {
  beforeEach(function() {
    helpers.login();

    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();

    var addBtn = element(by.css('oadatatable .tc_add_btn'));
    addBtn.click();
  });

  it('should open an add volume form with "Create Volume:" header', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create Volume:');
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should have a back button to navigate back to the volume overview', function(){
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_volumes')).isPresent()).toBe(true);
  });

  it('should show the typed in volume name in the header', function(){
    var volumeNameInput = element(by.model('volume.name'));
    volumeNameInput.sendKeys('protractor_test');

    expect(element(by.css('h2')).getText()).toEqual('Create Volume: protractor_test');
  });

  it('should offer a list of volume pools', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    volumepoolSelect.click();

    expect(volumepoolSelect.all(by.css('select .tc_volumePoolOption')).count()).toBeGreaterThan(0);
  });

  it('should have the configured pools', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    volumepoolSelect.click();

    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      expect(volumepoolSelect.element(by.cssContainingText('option', pool.name)).isDisplayed()).toBe(true);
    }
  });

  it('should show the correct size of the selected pool', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));

    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      expect(element(by.css('.tc_poolAvailableSize')).isDisplayed()).toBe(true);
      expect(element(by.css('.tc_poolAvailableSize')).getText()).toEqual(pool.size.toFixed(2) + pool.unit + ' available');
    }
  });

  it('should allow a volume size that is lower than the selected pool capacity', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    var volumeSizeInput = element(by.model('data.megs'));

    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      var volumeSize = (pool.size - 0.1).toFixed(2);
      volumeSizeInput.clear().sendKeys(volumeSize + pool.unit);

      expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(false);
    }
  });

  it('should not allow a volume size that is higher than the selected pool capacity', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    var volumeSizeInput = element(by.model('data.megs'));

    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      var volumeSize = (pool.size + 0.1).toFixed(2);
      volumeSizeInput.clear().sendKeys(volumeSize + pool.unit);

      expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(true);
    }
  });

  it('should allow a volume size that is as high as the selected pool capacity', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    var volumeSizeInput = element(by.model('data.megs'));

    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      volumeSizeInput.clear().sendKeys(pool.size + pool.unit);

      expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(false);
    }
  });

  it('should show a message if the chosen volume size is smaller than 100mb', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    helpers.selectDropdownByIndex(volumepoolSelect, 2);

    var volumeSizeInput = element(by.model('data.megs'));
    volumeSizeInput.sendKeys('99mb');

    expect(element(by.css('.tc_wrongVolumeSize')).isPresent()).toBe(true);
  });

  it('should show a message if the given volume size is just a string', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));
    helpers.selectDropdownByIndex(volumepoolSelect, 2);

    var volumeSizeInput = element(by.model('data.megs'));
    volumeSizeInput.sendKeys('abc');

    expect(element(by.css('.tc_noValidNumber')).isPresent()).toBe(true);
  });
});