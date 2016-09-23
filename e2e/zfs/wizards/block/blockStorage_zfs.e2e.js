var helpers = require('../../../common.js');
var wizardsCommon = require('../../../base/wizards/wizardsCommon.js');

describe('iSCSI/Fibre Channel target Wizard', function(){
  var wizardProperties = new wizardsCommon();
  var volumeName1 = 'protractor_wizardTest_zfs_blockvol1';
  var volume1 = element(by.cssContainingText('tr', volumeName1));
  var volumeName2 = 'protractor_wizardTest_zfs_blockvol2';
  var volume2 = element(by.cssContainingText('tr', volumeName2));
  var hostname1 = "protractor_test_host1";
  var hostname2 = "protractor_test_host2";
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  var hostItem = element(by.css('ul .tc_menuitem_hosts > a'));
  var iqn1 = "iqn.1991-05.com.microsoft:protractor_test_host1";
  var iqn2 = "iqn.1991-05.com.microsoft:protractor_test_host2";
  var menu = element.all(by.css('ul .tc_menuitem > a'));

  beforeAll(function(){
    helpers.login();
    helpers.create_host(iqn1, null, hostname1);
  });

  it('should verify the created host', function(){
    hostItem.click();
    expect(element(by.cssContainingText('tr', hostname1)).isPresent()).toBe(true);
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
    wizardProperties.creationFromFill(volumeName1, '100MB');
  });

  it('should test step 2 and fill it out and go to the last step', function(){
    wizardProperties.shareCreationElementCheck('iSCSI/Fibre Channel target Step 2 - Create a Share');
    wizardProperties.shareCreateFc(hostname1);
    wizardProperties.nextBtn.click();
  });

  it('should test step 3 and hit done to create everything set so far and close the wizard', function(){
    wizardProperties.configurationExecution('iSCSI/Fibre Channel target Step 3 - Save configuration');

    helpers.check_wizard_titles();
  });
  //<-- end wizard --->

  it('should have created a lun with a fc share', function() {
    //check if lun exists
    volumesItem.click();
    expect(volume1.isPresent()).toBe(true);
    volume1.click();
    element(by.css('.tc_iscsi_fcTab')).click();
    expect(element(by.cssContainingText('tr', hostname1)).isDisplayed()).toBe(true);
  });

  // Should use the wizard again but with out creating the host before
  //<-- begin wizard --->
  it('should open the "iSCSI/Fibre Channel target" wizard', function(){
    var dashboard = menu.get(0);
    dashboard.click();
    wizardProperties.openWizard('iSCSI/Fibre Channel target');
  });

  it('should test step 1 and fill it out and go to the next step', function(){
    wizardProperties.creationPagePoolSelection('zpool');
    wizardProperties.creationFromFill(volumeName2, '100MB');
  });

  it('should test step 2 and fill it out and go to the last step', function(){
    wizardProperties.shareCreateFc(hostname2, iqn2);
    wizardProperties.nextBtn.click();
  });

  it('should test step 3 and hit done to create everything set so far and close the wizard', function(){
    wizardProperties.configurationExecution('iSCSI/Fibre Channel target Step 3 - Save configuration');

    helpers.check_wizard_titles();
  });
  //<-- end wizard --->

  it('should have created a lun with a fc share', function() {
    //check if lun exists
    volumesItem.click();
    expect(volume2.isPresent()).toBe(true);
    volume2.click();
    element(by.css('.tc_iscsi_fcTab')).click();
    expect(element(by.cssContainingText('tr', hostname2)).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    // Delete everything created for and by first wizard run.
    helpers.delete_fc_share(volumeName1, hostname1);
    helpers.delete_volume(volume1, volumeName1);
    helpers.delete_host(hostname1);
    // Delete everything created by second wizard run.
    helpers.delete_fc_share(volumeName2, hostname2);
    helpers.delete_volume(volume2, volumeName2);
    helpers.delete_host(hostname2);

    console.log('blockStorage_zfs -> blockStorage_zfs.e2e.js');
  });

});
