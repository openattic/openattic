var helpers = require('../common.js');
var configs = require('../configs.js');

describe('Raw Block Storage Wizard', function(){
    
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  
  var volume = element(by.id('volumename'));
  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('volumeisprotected'));
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";
  
  beforeAll(function(){
    helpers.login();
    helpers.create_host();
  });
  
  it('should add an iqn to created host', function(){
    browser.sleep(400);
    expect(host.isPresent()).toBe(true);
    host.click();
    browser.sleep(400);
    element(by.model('data.iscsiInis')).click();
    element.all(by.model('newTag.text')).get(1).sendKeys(iqn);
    browser.sleep(400);      
  });

  it('should navigate back to the dashboard after creating a host', function(){
    var dashboard = element.all(by.css('ul .tc_menuitem')).get(0);
    dashboard.click();    
  });
  //<-- Raw Block Storage Wizard --->
  it ('should have a button "Raw Block Storage"; navigate through the wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[2].element(by.className('btn-block'));
      expect(fs_wizard.isDisplayed()).toBe(true);
      fs_wizard.click();
      
      //first site
      
      //check available buttons
      expect(wizardOverviewBtn.isDisplayed()).toBe(true);
      expect(previousBtn.isDisplayed()).toBe(true);
    });
    //check if angular expression contains 'Next' or 'Done
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('Raw Block Storage Step 1 - Create Volume');
    expect(volume.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.Present()).toBe(true);
    
    //enter volume data
    volume.sendKeys('protractor_test_volume');
    
    //in order to enter a size we need to choose a pool first
      for(var key in configs.pools) {
        var pool = configs.pools[key];
        var volumePoolSelect = element(by.id('source_pool'));
        volumePoolSelect.click();
        volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();
        break;
      }    
    
    //enter some data to get to the next site
    size.sendKeys('100MB');
    nextBtn.click();
    
    //Step 2 - check at least the title then skip and available buttons
    expect(element(by.css('.tc_step2')).getText()).toEqual('Raw Block Storage Step 2 - Create Mirror - Coming Soon...');
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    browser.sleep(400);
    nextBtn.click();
    
    //Step 3 - create LUN
    
    expect(element(by.css('.tc_step3')).getText()).toEqual('Raw Block Storage Step 3 - Create a iSCSI/FC Share');
    
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    //select host
    var hostSelect = element(by.model('input.iscsi_fc.host'));
    hostSelect.element(by.cssContainingText('option', hostname)).click();
    
    nextBtn.click();
    
    //Finish
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('Raw Block Storage Step 4 - Save configuration');    
    expect(nextBtn.getText()).toEqual('Done');    
    nextBtn.click();
    console.log('<----- raw block storage test ended ------>');    
  });
  
  afterAll(function(){
    helpers.delete_volume();
    helpers.delete_host();
    console.log('<-----Raw Block Storage volume and host removed --->');
  });
    
});

