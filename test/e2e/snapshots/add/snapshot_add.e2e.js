var helpers = require('../../common.js');

describe('Should create a Snapshot', function(){
  var volumename = 'protractor_test_volume';

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

      element(by.model('data.megs')).sendKeys('100mb');
      element(by.css('.tc_submitButton')).click();
      browser.sleep(helpers.configs.sleep);

      break;
    }
  });

  function goToSnapAdd (){
    var volume = element(by.cssContainingText('tr', volumename));
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

    it('should have a back button to navigate back to the snapshot overview', function(){
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

    //test if snap.name format -> YYYY-mm-dd-HH-mm-ss
//     it('given snap.name should have the format yyyy-mm-dd-HH-mm-ss', function(){
//
//     });

    //test if given megs value is origin vol size

//     it('given megs should match to the origin volume size', function(){
//
//     });

  it('should show required field errors if the submit button is clicked without editing anything', function(){
    goToSnapAdd();
    element(by.id('snap.name')).clear();
    element(by.id('megs')).clear();
    var submitButton = element(by.css('.tc_submitButton'));
    submitButton.click();

    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
  });

  it('should should show a error message when the given snapshot size is bigger than the source pool', function(){
    goToSnapAdd();
    var volumepool = element(by.model('data.sourcePool'));
    var snapshotname = 'protractor_test_snap';
    //element(by.id('megs')).clear();
    var snapSizeInput = element(by.model('megs'));
    for(var key in helpers.configs.pools) {
        var pool = helpers.configs.pools[key];

        //volumepool.element(by.cssContainingText('option', pool.name)).click();

        var snapSize = (pool.size + 0.1).toFixed(2);
        snapSizeInput.clear().sendKeys(snapSize + pool.unit);
        expect(element(by.css('.tc_sizeExceeded')).isDisplayed()).toBe(true);
    }
  });

    it('should create the snapshot', function(){
      goToSnapAdd();
      var snapshotname = 'protractor_test_snap';
      element(by.id('snap.name')).clear();
      browser.sleep(400);
      element(by.model('snap.name')).sendKeys(snapshotname);
      browser.sleep(400);
      element(by.css('.tc_submitButton')).click();
    });

    // clean everything up
    it('should delete the snapshot', function(){

      var volumename = 'protractor_test_volume';
      var volume = element(by.cssContainingText('tr', volumename));

      var snapshotname = 'protractor_test_snap';
      var snapshot = element(by.cssContainingText('tr', snapshotname));

      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      snapshot.click();
      //browser.sleep(400);
      //element(by.css('.tc_menudropdown')).click();
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
        var volumename = 'protractor_test_volume';
        var volume = element(by.cssContainingText('tr', volumename));
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
