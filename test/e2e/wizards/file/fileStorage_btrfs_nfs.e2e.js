var helpers = require('../../common.js');
var configs = require('../../configs.js');

describe('Wizard panel', function(){
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  //maye rename volume, pool, etc. -> isn't the actual 'object' instead it's just the input field
  var volume = element(by.id('volumename'));
  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('volumeisprotected'));
  
  var volume_required = element(by.css('.tc_nameRequired'));
  var pool_required = element(by.css('.tc_poolRequired'));
  var size_required = element(by.css('.tc_sizeRequired'));
  
  var size_exceeded = element(by.css('.tc_wrongVolumeSize'));
  var noUniqueName = element(by.css('.tc_noUniqueName'));
  var noValidNumber = element(by.css('.tc_noValidNumber'));
  
  beforeAll(function(){
    helpers.login();  
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');    
  });
  
  it('should check the titles', function(){
    var wizards = element.all(by.repeater('wizard in wizards'))
      .then(function(wizards){
        var fsTitle = element.all(by.className('btn-block')).get(0).evaluate('wizard.title').then(function(title){
          expect(title).toEqual('File Storage');
          console.log(title);
        });

        var vmTitle = wizards[1].element(by.className('btn-block')).evaluate('wizard.title').then(function(vm_title){
          expect(vm_title).toEqual('VM Storage');
          console.log(vm_title);
        });
        
        var blockTitle = wizards[2].element(by.className('btn-block')).evaluate('wizard.title').then(function(block_title){
          expect(block_title).toEqual('Raw Block Storage');
          console.log(block_title);
        });    
    });
      
  });
  
  it('should a widget title', function(){
    expect(element.all(by.css('h2')).get(1).getText()).toEqual('openATTIC Wizards');
  });
  
  //<-- File Storage Wizard -->
  it('should have a button "File Storage";navigate through this wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[0].element(by.cssContainingText('span', 'File Storage'));
      expect(fs_wizard.isDisplayed()).toBe(true);
      fs_wizard.click();
      
      //Step 1 - Create Volume
      //check available buttons
      expect(wizardOverviewBtn.isDisplayed()).toBe(true);
      expect(previousBtn.isDisplayed()).toBe(true);
    });
    
    //check if angular expression contains 'Next' or 'Done
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');
    //check content of first wizard site
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('File Storage Step 1 - Create Volume');
    expect(volume.isDisplayed()).toBe(true);
    //expect(pool.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.isDisplayed()).toBe(true);
    
    //check what happens if next button has been clicked without entering any data
    nextBtn.click();
    expect(volume_required.isDisplayed()).toBe(true);
    expect(pool_required.isDisplayed()).toBe(true);
    expect(size_required.isDisplayed()).toBe(true);
    
    //enter some data for validation
    volume.sendKeys('äasdower dsafodf');
    var noValidName = element(by.css('.tc_noValidName')).evaluate('errortext');
    expect(noValidName.isDisplayed()).toBe(true);
    
    //in order to enter a size we need to choose a pool first
      for(var key in configs.pools) {
        var pool = configs.pools[key];
        var volumePoolSelect = element(by.id('source_pool'));
        volumePoolSelect.click();
        element.all(by.cssContainingText('option', '(volume group,')).get(0).click();
        break;
      }    
    
    size.sendKeys('asdffffweee');
    expect(noValidNumber.isDisplayed()).toBe(true);
    size.clear();
    size.sendKeys('10000000000000000000000000000000');
    expect(size_exceeded.isDisplayed()).toBe(true);
    
    //enter some data to get to the next site
    volume.clear();
    volume.sendKeys('protractor_test_volume');
    size.clear();
    size.sendKeys('100MB');
    element(by.id("btrfs")).click();
    nextBtn.click();
    
    //Step 2 - check at least the title then skip and available buttons
    expect(element(by.css('.tc_step2')).getText()).toEqual('File Storage Step 2 - Create Mirror - Coming Soon...');
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    browser.sleep(400);
    nextBtn.click();
    
    //Step 3 - create share
    
    expect(element(by.css('.tc_step3')).getText()).toEqual('File Storage Step 3 - Which Shares do you need?');
    
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    
    expect(element(by.model('input.cifs.create')).isPresent()).toBe(true);
    expect(element(by.model('input.nfs.create')).isPresent()).toBe(true);
    
    //choose nfs
    element(by.model('input.nfs.create')).click();
    var address = element(by.id('nfsaddress'));
    var path = element(by.id('nfspath'));
    var options = element(by.id('nfsoptions'));

    expect(path.isPresent()).toBe(true);
    expect(address.isDisplayed()).toBe(true);
    expect(element(by.id('nfsoptions')).isDisplayed()).toBe(true);
    expect(path.getAttribute('value')).toEqual('/media/protractor_test_volume');
    expect(options.getAttribute('value')).toEqual('rw,no_subtree_check,no_root_squash');
    address.clear();
    nextBtn.click();
    expect(element(by.css('.tc_nfsAddressRequired')).isDisplayed()).toBe(true);
    path.clear();
    nextBtn.click();
    expect(element(by.css('.tc_nfsPathRequired')).isDisplayed()).toBe(true);
    path.sendKeys('/media/protractor_test_volume');
    address.sendKeys('oadev.domain.here');
    nextBtn.click();
    
    //Step 4 - Done
    
    browser.sleep(400);
    
    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('File Storage Step 4 - Save configuration');
    expect(nextBtn.getText()).toEqual('Done');
    nextBtn.click();
    console.log('<----- file storage test with NFS ended ------>');
  });
  
  afterAll(function(){
    helpers.delete_volume();
    console.log('<----- file storage test volume with NFS removed ------>');
  });
});