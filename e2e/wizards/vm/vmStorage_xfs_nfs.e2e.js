var helpers = require('../../common.js');
var wizardsCommon = require('../wizardsCommon.js');

describe('VM Storage Wizard', function(){
  var wizardProperties = new wizardsCommon();
  var volumeName = 'protractor_vmWizard_vol';
  var volume = element(by.cssContainingText('tr', volumeName));
  var shareName = 'oadev.domain.here';

  beforeAll(function(){
    helpers.login();
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');
  });

  //<-- begin wizard --->
  it('should open the "VM Storage" wizard', function(){
    wizardProperties.openWizard('VM Storage');
  });

  it('should test step 1 and fill it out and go to the next step', function(){
    wizardProperties.creationPageElementCheck('VM Storage Step 1 - Create Volume');
    wizardProperties.creationPageValidationTests();
    wizardProperties.creationPagePoolSelection('volume group');
    wizardProperties.creationPageInputTests();
    wizardProperties.creationFromFill(volumeName, '100MB', 'xfs');
  });
 
  it('should test step 2 and go to the next step', function(){
    wizardProperties.mirrorCreationJumpOver('VM Storage Step 2 - Create Mirror');
  });

  it('should test step 3 and fill it out and go to the last step', function(){
    wizardProperties.shareCreationElementCheck('VM Storage Step 3 - Create Shares');
    wizardProperties.shareCreateNfs(shareName);
    wizardProperties.nextBtn.click();
  });

  it('should test step 4 and hit done to create everything set so far and close the wizard', function(){
    wizardProperties.configurationExecution('VM Storage Step 4 - Save configuration');

    helpers.check_wizard_titles();
  });
  //<-- end wizard --->

  afterAll(function(){
    helpers.delete_nfs_share(volumeName, shareName);
    helpers.delete_volume(volume, volumeName);
    console.log('vmStorage_xfs_nfs -> vmStorage_xfs_nfs.e2e.js');
  });
});
