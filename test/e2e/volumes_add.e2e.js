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

});