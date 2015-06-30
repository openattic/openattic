var helpers = require('../../common.js');

describe('Should check the snapshot add workflow', function(){
  var volumename = 'protractor_test_volume';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var submitBtn = element(by.css('.tc_submitButton'));
  var snapshot = element(by.id('snap.name'));
  var snap_size = element(by.id('megs'));
  var backBtn = element(by.css('.tc_backButton'));
  var snapname = 'protractor_test_snap';
  
  beforeAll(function(){
    helpers.login();
    helpers.create_volume("lun");
    volume.click();
    element(by.css('.tc_snapshotTab')).click();
    element(by.css('.tc_snapshotAdd')).click();
    
  });

  it('should a "Create Snapshot" header', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create Snapshot');
  });

  it('should have a back button', function(){
    expect(backBtn.isPresent()).toBe(true);
  });
  
  it('should have a submit button', function(){
    expect(submitBtn.isPresent()).toBe(true);
  });

  it('should have a snapshot name input field', function(){
    expect(snapshot.isDisplayed()).toBe(true);
  });

  it('should have a snapshot size input field', function(){
    expect(snap_size.isDisplayed()).toBe(true);
  });

  //TODO: name validation
  //test if given snap.name has the format 'YYYY-mm-dd-HH-mm-ss'
  //   it('given snap.name should have the format yyyy-mm-dd-HH-mm-ss', function(){
  //     var snapname = element(by.model('snap.name'));
  //     expect(snapname.getAttribute('value')).to ?
  //   });

  //test if given megs value is origin vol size -> TODO fix Task OP-441
  it('given megs should match to the origin volume size', function(){
    //we need the volume.megs here
    var volmegs = '100';
    expect(snap_size.getAttribute('value')).toEqual(volmegs + ".00MB");
    
  });

  it('should show required field errors if the submit button is clicked without any input data', function(){
    snapshot.clear();
    snap_size.clear();
    submitBtn.click();

    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
  });
  
  it('should show an error message if snapshot name has no data', function(){
    snapshot.clear();
    snap_size.sendKeys('100MB');
    submitBtn.click();
    
    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(false);
  });
  
  it('should show an error message if snapshot size has no data', function(){
    snapshot.sendKeys(snapname);
    snap_size.clear();
    submitBtn.click();
    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
  });
  
  
  //TODO fix expectation
  it('should allow a snapshot size that is as big as the selected pool capacity', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      var pool_size = element(by.id('megs')).evaluate('pool.usage.max_new_fsv_text').then(function(psize){
        //console.log(psize);
        snap_size.clear().sendKeys(psize); 
      });
      
      browser.sleep(400);
      //this expectation will fail - see OP-467
      expect(element(by.css('.tc_sizeExceeded')).isDisplayed()).toBe(false);
      
      break;
    }
  });    
  
  it('should show an error message when the given snapshot size is bigger than the source pool', function(){
    for(var key in helpers.configs.pools) {
      var pool = helpers.configs.pools[key];
      var snapSize = (pool.size + 0.1).toFixed(2);
      snap_size.clear().sendKeys(snapSize + pool.unit);
      browser.sleep(400);
      expect(element(by.css('.tc_sizeExceeded')).isDisplayed()).toBe(true);
      
      break;
    }    
  });

  it('should have a back button which navigates back to the snapshot overview', function(){
    backBtn.click();

    expect(element(by.css('.tc_oadatatable_snapshots')).isPresent()).toBe(true);
  });  
  
  afterAll(function(){
    helpers.delete_volume();    
  });
  
});  

