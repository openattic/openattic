var helpers = require('../common.js');
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

  it('should have a volume name input field', function(){
    expect(element(by.id('volume.name')).isDisplayed()).toBe(true);
  });

  it('should have a volume pool select box', function(){
    expect(element(by.id('data.sourcePool')).isDisplayed()).toBe(true);
  });

  it('should have a volume size input field', function(){
    expect(element(by.id('data.megs')).isDisplayed()).toBe(true);
  });

  it('should have a deletion protection checkbox', function(){
    expect(element(by.id('volume.is_protected')).isDisplayed()).toBe(true);
  });

  it('should stay on the create volume form if the submit button is clicked without editing anything', function(){
    var submitButton = element(by.css('.tc_submitButton'));
    submitButton.click();

    expect(element(by.id('ribbon')).getText()).toEqual('Volumes Add');
  });

  it('should show required field errors if the submit button is clicked without editing anything', function(){
    var submitButton = element(by.css('.tc_submitButton'));
    submitButton.click();

    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_poolRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
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

  it('should show the predefined volume types for each pool', function(){
    var volumepoolSelect = element(by.model('data.sourcePool'));

    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];

      if('volumeTypes' in pool) {
        volumepoolSelect.click();
        volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

        for (var i = 0; i < pool.volumeTypes.length; i++) {
          expect(element(by.cssContainingText('span', pool.volumeTypes[i])).isDisplayed()).toBe(true);
        }
      }
    }
  });

  it('should show a message if the chosen volume size is smaller than 100mb', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];

      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      var volumeSizeInput = element(by.model('data.megs'));
      volumeSizeInput.sendKeys('99mb');

      expect(element(by.css('.tc_wrongVolumeSize')).isPresent()).toBe(true);

      break;
    }
  });

  it('should show a message if the given volume size is just a string', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];

      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      var volumeSizeInput = element(by.model('data.megs'));
      volumeSizeInput.sendKeys('abc');

      expect(element(by.css('.tc_noValidNumber')).isPresent()).toBe(true);

      break;
    }
  });

  it('should show a message if the given volume size is a combination of numbers and string', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];

      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();
      volumepoolSelect.element(by.cssContainingText('option', pool.name)).click();

      var volumeSizeInput = element(by.model('data.megs'));
      volumeSizeInput.sendKeys('120asd');

      expect(element(by.css('.tc_noValidNumber')).isDisplayed()).toBe(true);

      break;
    }
  });

  it('should create a volume in the configured pools', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      var volumename = 'protractor_volume_' + pool.name;

      // create a volume
      element(by.id('volume.name')).sendKeys(volumename);

      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();

      //element(by.id('lunType')).click();
      element(by.id('data.megs')).sendKeys('100mb');
      element(by.css('.tc_submitButton')).click();

      // is it displayed on the volume overview?
      var volume = element(by.cssContainingText('tr', volumename));
      expect(volume.isDisplayed()).toBe(true);

      // delete the volume
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem')).click();
      browser.sleep(400);

      element(by.model('input.enteredName')).sendKeys(volumename);
      element(by.id('bot2-Msg1')).click();

      expect(volume.isPresent()).toBe(false);

      var addBtn = element(by.css('oadatatable .tc_add_btn'));
      addBtn.click();
    }
  });
});