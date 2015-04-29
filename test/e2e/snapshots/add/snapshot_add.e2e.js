var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_test_volume';
  var snapshotname = 'protractor_test_snap';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  var submitButton = element(by.css('.tc_submitButton'));
  
  beforeEach(function() {
    helpers.login(); 
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
  });

  it('should create a volume first', function(){

    element(by.css('oadatatable .tc_add_btn')).click();

    for(var key in helpers.configs.pools) {
      element(by.id('volume.name')).sendKeys(volumename);
      var pool = helpers.configs.pools[key];
      var volumePoolSelect = element(by.id('data.sourcePool'));
      volumePoolSelect.click();
      volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();

      element(by.model('data.megs')).sendKeys('100MB');
      submitButton.click();
      browser.sleep(helpers.configs.sleep);

      break;
    }
  });

  //navigate to snapshot form
  function goToSnapAdd() {
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    element(by.css('.tc_snapshotAdd')).click();
    browser.sleep(400);
  }

  it('should a "Create Snapshot" header', function(){
    goToSnapAdd();
    expect(element(by.css('h2')).getText()).toEqual('Create Snapshot');
  });

  it('should have a back button', function(){
    goToSnapAdd();
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });
  
  it('should have a submit button', function(){
    goToSnapAdd();
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });

  it('should have a back button which navigates back to the snapshot overview', function(){
    goToSnapAdd();
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_volumes')).isPresent()).toBe(true);
  });

  it('should have a snapshot name input field', function(){
    goToSnapAdd();
    expect(element(by.id('snap.name')).isDisplayed()).toBe(true);
  });

  it('should have a snapshot size input field', function(){
    goToSnapAdd();
    expect(element(by.id('megs')).isDisplayed()).toBe(true);
  });

//test if given snap.name has the format 'YYYY-mm-dd-HH-mm-ss'
//   it('given snap.name should have the format yyyy-mm-dd-HH-mm-ss', function(){
//     goToSnapAdd();
//     var snapname = element(by.model('snap.name'));
//     expect(snapname.getAttribute('value')).to ?
//   });

  //test if given megs value is origin vol size
  it('given megs should match to the origin volume size', function(){
    goToSnapAdd();
    var volmegs = '100';
    var megs = element(by.model('megs'));
    expect(megs.getAttribute('value')).toEqual(volmegs + ".00MB");
    
  });

  it('should show required field errors if the submit button is clicked without any input data', function(){
    goToSnapAdd();
    element(by.id('snap.name')).clear();
    element(by.id('megs')).clear();
    submitButton.click();

    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
  });

  it('should show an error message when the given snapshot size is bigger than the source pool', function(){
    goToSnapAdd();
    var volumepool = element(by.model('data.sourcePool'));
    var snapSizeInput = element(by.model('megs'));
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      var snapSize = (pool.size + 0.1).toFixed(2);
      snapSizeInput.clear().sendKeys(snapSize + pool.unit);
      expect(element(by.css('.tc_sizeExceeded')).isDisplayed()).toBe(true);
      
      break;
    }    
    
  });

  it('should create the snapshot', function(){
    goToSnapAdd();
    element(by.id('snap.name')).clear();
    browser.sleep(400);
    element(by.model('snap.name')).sendKeys(snapshotname);
    browser.sleep(400);
    submitButton.click();
  });

  it('should delete the snapshot', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    snapshot.click();
    browser.sleep(400);
    element(by.css('.tc_deleteSnapItem')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    expect(snapshot.isPresent()).toBe(false);
    browser.sleep(400);
  });

  //now we need to delete the protractor_test_volume
  it('should delete the protractor_test_volume', function(){
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(400);

    element(by.model('input.enteredName')).sendKeys(volumename);
    element(by.id('bot2-Msg1')).click();

    expect(volume.isPresent()).toBe(false);
  });
});