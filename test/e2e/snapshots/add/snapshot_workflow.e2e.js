var helpers = require('../../common.js');

describe('Should check the snapshot add workflow', function(){
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var snapshotname = 'protractor_test_snap';
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  var submitButton = element(by.css('.tc_submitButton'));    

  beforeEach(function() {
    helpers.login(); 
    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
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

    expect(element(by.css('.tc_oadatatable_snapshots')).isPresent()).toBe(true);
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
    //we need the volume.megs here
    var volmegs = '100';
    var megs = element(by.id('megs'));
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
});  

