var helpers = require('../../common.js');
var configs = require('../../configs.js');

describe('VM Storage Wizard', function(){
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));

  var volumename = 'protractor_vmWizard_vol';
  var volume = element(by.cssContainingText('tr', volumename));
  var volumefield = element(by.id('volumename'));
  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var share = element(by.cssContainingText('td', 'oadevhost.domain.here'));
  var is_protected = element(by.id('volumeisprotected'));

  var volume_required = element(by.css('.tc_nameRequired'));
  var pool_required = element(by.css('.tc_poolRequired'));
  var size_required = element(by.css('.tc_sizeRequired'));

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

  //   <-- VM Storage Wizard -->
  it('should have a button "VM Storage";navigate through the wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var fs_wizard = wizards[1].element(by.cssContainingText('span', 'VM Storage'));
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
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('VM Storage Step 1 - Create Volume');
    expect(volumefield.isDisplayed()).toBe(true);
    //expect(pool.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.Present()).toBe(true);

    //enter volume data
    volumefield.sendKeys('protractor_vmWizard_vol');

    //in order to enter a size we need to choose a pool first
    for(var key in configs.pools){
      var pool = configs.pools[key];
      var volumePoolSelect = element(by.id('source_pool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(volume group,')).get(0).click();
      browser.actions().sendKeys( protractor.Key.ENTER ).perform();
      break;
    }

    //enter some data to get to the next site
    size.sendKeys('100MB');
    element(by.id("xfs")).click();
    nextBtn.click();

    //Step 2 - check at least the title then skip and available buttons
    expect(element(by.css('.tc_step2')).getText()).toEqual('VM Storage Step 2 - Create Mirror');
    expect(wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(previousBtn.isDisplayed()).toBe(true);
    expect(nextBtn.getText()).toEqual('Next');
    browser.sleep(400);
    nextBtn.click();
    expect(element(by.css('.tc_step3')).getText()).toEqual('VM Storage Step 3 - Create Shares');

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

    browser.sleep(400);
    expect(path.isDisplayed()).toBe(true);
    browser.sleep(600);
    expect(address.isDisplayed()).toBe(true);
    browser.sleep(600);
    expect(element(by.id('nfsoptions')).isDisplayed()).toBe(true);
    browser.sleep(400);
    expect(path.getAttribute('value')).toEqual('/media/protractor_vmWizard_vol');
    expect(options.getAttribute('value')).toEqual('rw,no_subtree_check,no_root_squash');
    nextBtn.click();
    expect(element(by.css('.tc_nfsAddressRequired')).isDisplayed()).toBe(true);
    path.clear();
    nextBtn.click();
    expect(element(by.css('.tc_nfsPathRequired')).isDisplayed()).toBe(true);
    path.sendKeys('/media/protractor_vmWizard_vol');
    address.sendKeys('oadevhost.domain.here');
    nextBtn.click();

    //Step 4 - Done

    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('VM Storage Step 4 - Save configuration');
    expect(nextBtn.getText()).toEqual('Done');
    nextBtn.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#');
    helpers.check_wizard_titles();

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
    browser.sleep(400);
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    element(by.css('.tc_nfsShareTab')).click();
    browser.sleep(400);
    expect(share.isDisplayed()).toBe(true);
    share.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('<----- VM storage wizard done (xfs/nfs) ------>');
  });
});
