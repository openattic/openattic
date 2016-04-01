var helpers = require('../../common.js');
var configs = require('../../configs.js');

describe('Wizard panel', function(){
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  //maye rename volume, pool, etc. -> isn't the actual 'object' instead it's just the input field
  var volumename = 'protractor_wizard_fileVol02';
  var volume = element(by.cssContainingText('tr', volumename));
  var volumefield = element(by.id('volumename'));
  var share = element(by.cssContainingText('tr', 'protractor_wizard_cifsShare'));

  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('isprotected'));

  var size_exceeded = element(by.css('.tc_wrongVolumeSize'));
  var noUniqueName = element(by.css('.tc_noUniqueName'));
  var noValidNumber = element(by.css('.tc_noValidNumber'));

  var menu = element.all(by.css('ul .tc_menuitem > a'));

  beforeAll(function(){
    helpers.login();
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');
  });

  it('should a widget title', function(){
    expect(element(by.css('.tc_widget_title')).getText()).toEqual('openATTIC Wizards');
    helpers.check_wizard_titles();
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
    expect(element(by.css('.tc_oawizard_h3')).getText()).toEqual('File Storage Step 1 - Create Volume');
    expect(volumefield.isDisplayed()).toBe(true);
    //expect(pool.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.Present()).toBe(true);

    //enter volume data
    volumefield.sendKeys('protractor_wizard_fileVol02');

    //in order to enter a size we need to choose a pool first
    for(var key in configs.pools){
      var pool = configs.pools[key];
      var volumePoolSelect = element(by.id('source_pool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(volume group,')).get(0).click();
      //browser.actions().sendKeys( protractor.Key.ENTER ).perform();
      break;
    }

    //enter some data to get to the next site
    size.sendKeys('100MB');
    element(by.id("ext4")).click();
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

    //choose cifs
    element(by.model('input.cifs.create')).click();
    var cifsName = element(by.id('cifsname'));
    var path = element(by.id('cifspath'));
    var comment = element(by.id('cifscomment'));

    //expect(cifsName.isDisplayed()).toBe(true);
    expect(cifsName.getAttribute('value')).toEqual('protractor_wizard_fileVol02');
    expect(path.isDisplayed()).toBe(true);
    expect(path.getAttribute('value')).toEqual('/media/protractor_wizard_fileVol02');

    expect(element(by.id('cifscomment')).isDisplayed()).toBe(true);

    cifsName.clear();
    path.clear();
    nextBtn.click();

    expect(element(by.css('.tc_cifsNameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_cifsPathRequired')).isDisplayed()).toBe(true);


    cifsName.sendKeys('protractor_wizard_cifsShare');
    path.sendKeys('/media/protractor_wizard_cifsShare');
    nextBtn.click();

    //Step 4 - Done

    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('File Storage Step 4 - Save configuration');
    expect(nextBtn.getText()).toEqual('Done');
    nextBtn.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#');

    helpers.check_wizard_titles();
    browser.sleep(400);
    menu.get(3).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
    /*	next line -> workaround (when checking if the volume is visible,
		    protractor SOMETIMES throws 'element not visible error', but when
		    protractor is about to delete the volume, it's visible and protractor is able to delete it
		    couldn't reproduce this strange behavior and browser.sleep won't help)
    */
    menu.get(4).click();
    browser.sleep(400);
    menu.get(3).click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    volume.click();
    element(by.css('.tc_cifsShareTab')).click();
    expect(share.isDisplayed()).toBe(true);
    browser.sleep(400);
    share.click();
    browser.sleep(400);
    element.all(by.css('.tc_menudropdown')).get(1).click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareDelete > a')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });

  afterAll(function(){

    helpers.delete_volume(volume, volumename);
    console.log('fs_wiz_ext_cifs -> fileStorage_ext_cifs.e2e.js');
  });
});
