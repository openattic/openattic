var helpers = require('../../../common.js');
var wizardsCommon = require('../../wizardsCommon.js');

describe('iSCSI/Fibre Channel target Wizard', function(){
  var wizardProperties = new wizardsCommon();
  var volumeName = 'protractor_wizard_zfs_blockvol';
  var volume = element(by.cssContainingText('tr', volumeName));
  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";
  var menu = element.all(by.css('ul .tc_menuitem > a'));

  /*
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));

  var volumename = 'protractor_wizard_zfs_blockvol';
  var volume = element(by.cssContainingText('tr', volumename));
  var volumefield = element(by.model('result.name'));
  var pool = element(by.model('pool'));
  var size = element(by.model('data.megs'));
  var is_protected = element(by.model('result.is_protected'));

  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  var iqn = "iqn.1991-05.com.microsoft:protractor_test_host";

  var menu = element.all(by.css('ul .tc_menuitem > a'));
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  */

  beforeAll(function(){
    helpers.login();
    helpers.create_host(iqn);
  });

  it('should verify the created host', function(){
    expect(host.isPresent()).toBe(true);
  });

  it('should navigate back to the dashboard after creating a host', function(){
    var dashboard = menu.get(0);
    dashboard.click();
  });

  //<-- begin wizard --->
  it('should open the "iSCSI/Fibre Channel target" wizard', function(){
    wizardProperties.openWizard('iSCSI/Fibre Channel target');
  });

  it('should test step 1 and fill it out and go to the next step', function(){
    wizardProperties.creationPageElementCheck('iSCSI/Fibre Channel target Step 1 - Create Volume');
    wizardProperties.creationPageValidationTests();
    wizardProperties.creationPagePoolSelection('zpool');
    wizardProperties.creationPageInputTests();
    wizardProperties.creationFromFill(volumeName, '100MB');
  });

  it('should test step 2 and go to the next step', function(){
    wizardProperties.mirrorCreationJumpOver('iSCSI/Fibre Channel target Step 2 - Create Mirror - Coming Soon...');
  });

  it('should test step 3 and fill it out and go to the last step', function(){
    wizardProperties.shareCreationElementCheck('iSCSI/Fibre Channel target Step 3 - Create a Share');
    wizardProperties.shareCreateFc(hostname);
    wizardProperties.nextBtn.click();
  });

  it('should test step 4 and hit done to create everything set so far and close the wizard', function(){
    wizardProperties.configurationExecution('iSCSI/Fibre Channel target Step 4 - Save configuration');

    helpers.check_wizard_titles();
  });
  //<-- end wizard --->

  it('should have created a lun with a fc share', function() {
    //check if lun exists
    volumesItem.click();
    expect(volume.isPresent()).toBe(true);
    volume.click();
    element(by.css('.tc_iscsi_fcTab')).click();
    expect(element(by.cssContainingText('tr', hostname)).isDisplayed()).toBe(true);
  });

  it('should remove the fc share', function() {
    helpers.delete_fc_share(volumeName, hostname)
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumeName);
    helpers.delete_host();
    console.log('blockStorage_zfs -> blockStorage_zfs.e2e.js');
  });

});
