var helpers = require('../../../common.js');
var configs = require('../../../configs.js');

describe('Raw Block Storage Wizard', function(){

  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));

  var volumename = 'protractor_wizard_zfs_blockvol';
  var volumefield = element(by.id('volumename'));
  var volume = element(by.cssContainingText('tr', volumename));
  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('volumeisprotected'));

  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";

  var menu = element.all(by.css('ul .tc_menuitem > a'));
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));

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
    element.all(by.model('newTag.text')).get(0).sendKeys(iqn);
    browser.sleep(400);
  });

  it('should navigate back to the dashboard after creating a host', function(){
    var dashboard = menu.get(0);
    dashboard.click();
  });
  //<-- Raw Block Storage Wizard --->
  it('should have a button "Raw Block Storage"; navigate through the wizard', function(){
    var wizards = element.all(by.repeater('wizard in wizards')).then(function(wizards){
      var block_wizard = wizards[2].element(by.cssContainingText('span', 'Raw Block Storage'));
      expect(block_wizard.isDisplayed()).toBe(true);
      block_wizard.click();

      //first site

      //check available buttons
      expect(wizardOverviewBtn.isDisplayed()).toBe(true);
      expect(previousBtn.isDisplayed()).toBe(true);
    });
    //check if angular expression contains 'Next' or 'Done
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('Raw Block Storage Step 1 - Create Volume');
    expect(volumefield.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    //expect(is_protected.Present()).toBe(true);

    //enter volume data
    volumefield.sendKeys(volumename);

    //in order to enter a size we need to choose a pool first
    for(var key in configs.pools){
      var pool = configs.pools[key];
      var volumePoolSelect = element(by.id('source_pool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(zpool,')).get(0).click();
      //browser.actions().sendKeys( protractor.Key.ENTER ).perform();
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

    helpers.check_wizard_titles();

    volumesItem.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');

    //check if lun exists
    browser.sleep(400);
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_iscsi_fcTab')).click();
    browser.sleep(400);
    expect(element(by.cssContainingText('tr', hostname)).isDisplayed()).toBe(true);

    //remove the lun map
    volumesItem.click();
    browser.sleep(400);
    browser.sleep(400);
    expect(volume.isPresent()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_iscsi_fcTab')).click();
    browser.sleep(400);
    element(by.cssContainingText('tr', hostname)).click();
    element(by.css('.tc_lunDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(800);
    expect(element(by.cssContainingText('tr', hostname)).isPresent()).toBe(false);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    helpers.delete_host();
    console.log('<-----Raw Block Storage wizard (ZFS) done --->');
  });

});
