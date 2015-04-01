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

  it('should have a volume group if it is configured', function(){
    if(helpers.configs.pools.vg){
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var vg = helpers.configs.pools.vg;
      expect(volumepoolSelect.element(by.cssContainingText('option', vg.name)).isPresent()).toBe(true);
    }
  });

  it('should have a btrfs pool if it is configured', function(){
    if(helpers.configs.pools.btrfs){
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var btrfs = helpers.configs.pools.btrfs;
      expect(volumepoolSelect.element(by.cssContainingText('option', btrfs.name)).isPresent()).toBe(true);
    }
  });

  it('should have a zfs pool if it is configured', function(){
    if(helpers.configs.pools.zfs) {
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var zfs = helpers.configs.pools.zfs;
      expect(volumepoolSelect.element(by.cssContainingText('option', zfs.name)).isPresent()).toBe(true);
    }
  });

  it('should show the correct volume group size if it is configured', function(){
    if(helpers.configs.pools.vg){
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var vg = helpers.configs.pools.vg;
      volumepoolSelect.element(by.cssContainingText('option', vg.name)).click();

      expect(element(by.css('.tc_poolAvailableSize')).isPresent()).toBe(true);
      expect(element(by.css('.tc_poolAvailableSize')).getText()).toEqual(vg.size + ' available');
    }
  });

  it('should show the correct btrfs pool size if it is configured', function(){
    if(helpers.configs.pools.btrfs){
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var btrfs = helpers.configs.pools.btrfs;
      volumepoolSelect.element(by.cssContainingText('option', btrfs.name)).click();

      expect(element(by.css('.tc_poolAvailableSize')).isPresent()).toBe(true);
      expect(element(by.css('.tc_poolAvailableSize')).getText()).toEqual(btrfs.size + ' available');
    }
  });

  it('should show the correct zfs pool size if it is configured', function(){
    if(helpers.configs.pools.zfs){
      var volumepoolSelect = element(by.model('data.sourcePool'));
      volumepoolSelect.click();

      var zfs = helpers.configs.pools.zfs;
      volumepoolSelect.element(by.cssContainingText('option', zfs.name)).click();

      expect(element(by.css('.tc_poolAvailableSize')).isPresent()).toBe(true);
      expect(element(by.css('.tc_poolAvailableSize')).getText()).toEqual(zfs.size + ' available');
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