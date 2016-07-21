var helpers = require('../../common.js');
var wizardsCommon = require('../wizardsCommon.js');

describe('Wizard panel', function(){
  var wizardProperties = new wizardsCommon();
  var volumeName = 'protractor_wizard_fileVol02';
  var volume = element(by.cssContainingText('tr', volumeName));
  var cifsName = 'protractor_wizard_cifsShare';
  
  beforeAll(function(){
    helpers.login();
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');
  });

  it('should a widget title', function(){
    expect(element.all(by.css('.tc_widget_title')).get(1).getText()).toEqual('openATTIC Wizards');
    helpers.check_wizard_titles();
  });

  //<-- begin wizard --->
  it('should open the "VM Storage" wizard', function(){
    wizardProperties.openWizard('File Storage');
  });

  it('should test step 1 and fill it out and go to the next step', function(){
    wizardProperties.creationPageElementCheck('File Storage Step 1 - Create Volume');
    wizardProperties.creationPageValidationTests();
    wizardProperties.creationPagePoolSelection('volume group');
    wizardProperties.creationPageInputTests();
    wizardProperties.creationFromFill(volumeName, '100MB', 'ext4');
  });

  it('should test step 2 and go to the next step', function(){
    wizardProperties.mirrorCreationJumpOver('File Storage Step 2 - Create Mirror - Coming Soon...');
  });

  it('should test step 3 and fill it out and go to the last step', function(){
    wizardProperties.shareCreationElementCheck('File Storage Step 3 - Which Shares do you need?');
    wizardProperties.shareCreateCifs(volumeName, cifsName);
    wizardProperties.nextBtn.click();
  });

  it('should test step 4 and hit done to create everything set so far and close the wizard', function(){
    wizardProperties.configurationExecution('File Storage Step 4 - Save configuration');

    helpers.check_wizard_titles();
  });
  //<-- end wizard --->

  afterAll(function(){
    helpers.delete_cifs_share(volumeName, cifsName);
    helpers.delete_volume(volume, volumeName);
    console.log('fs_wiz_ext_cifs -> fileStorage_ext_cifs.e2e.js');
  });
});
