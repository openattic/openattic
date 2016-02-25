var helpers = require('../../../common.js');
var configs = require('../../../configs.js');

describe('Wizard panel', function(){
  var wizardOverviewBtn = element(by.css('.tc_wizardOverview'));
  var previousBtn = element(by.css('.tc_previousBtn'));
  //maye rename volume, pool, etc. -> isn't the actual 'object' instead it's just the input field
  var volumename = 'protractor_wizard_zVol02';
  var volume = element(by.cssContainingText('tr', volumename));
  var volumefield = element(by.id('volumename'));
  var cifs_share = element(by.cssContainingText('tr', 'protractor_wizard_cifsShare'));
  var nfs_share = element(by.cssContainingText('td', 'oahost.domain.here'));

  var pool = element(by.id('source_pool'));
  var size = element(by.id('volumemegs'));
  var is_protected = element(by.id('volumeisprotected'));

  var size_exceeded = element(by.css('.tc_wrongVolumeSize'));
  var noUniqueName = element(by.css('.tc_noUniqueName'));
  var noValidNumber = element(by.css('.tc_noValidNumber'));
  var cifsName = element(by.id('cifsname'));
  var cifs_path = element(by.id('cifspath'));
  var comment = element(by.id('cifscomment'));

  var address = element(by.id('nfsaddress'));
  var nfs_path = element(by.id('nfspath'));
  var options = element(by.id('nfsoptions'));

  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  var hostsItem = element(by.css('ul .tc_menuitem_hosts > a'));

  beforeAll(function(){
    helpers.login();
  });

  it('should land on the dashboard site after login', function(){
    expect(browser.getCurrentUrl()).toContain('#/dashboard');
  });

  it('should a widget title', function(){
    expect(element.all(by.css('h2')).get(1).getText()).toEqual('openATTIC Wizards');
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

    //check if angular expression contains 'Next' or 'Done'
    var nextBtn = element(by.id('nextBtn')).evaluate('nextBtnText()');
    expect(nextBtn.getText()).toEqual('Next');
    //check content of first wizard site
    expect(element.all(by.css('h3')).get(0).getText()).toEqual('File Storage Step 1 - Create Volume');
    expect(volumefield.isDisplayed()).toBe(true);
    expect(size.isDisplayed()).toBe(true);
    expect(is_protected.isPresent()).toBe(true);

    //enter volume data
    volumefield.sendKeys(volumename);

    //in order to enter a size we need to choose a pool first
    for(var key in configs.pools){
      var pool = configs.pools[key];
      var volumePoolSelect = element(by.id('source_pool'));
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(zpool,')).get(0).click();
      browser.sleep(600);
      element(by.id('source_pool')).$('option:checked').getText().then(function(pname){
        //browser.actions().sendKeys(protractor.Key.ENTER).perform();
        console.log(pname);
        pname = pname.substring(0, pname.indexOf(' '));
        console.log(pname);

        //enter some data to get to the next site
        size.sendKeys('100MB');
        nextBtn.click();

        //Step 2 - check at least the title and available buttons then skip
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

        //we'll create a CIFS share as well as an NFS share
        element(by.model('input.cifs.create')).click();

        //CIFS SHARE
        expect(cifsName.isPresent()).toBe(true);
        expect(cifsName.getAttribute('value')).toEqual('protractor_wizard_zVol02');
        expect(cifs_path.isDisplayed()).toBe(true);
        //NOTE the following expectation will fail until OP-590 has been fixed!
        //expect(cifs_path.getAttribute('value')).toEqual('/media/' + pname + '/protractor_wizard_zVol02');

        expect(element(by.id('cifscomment')).isDisplayed()).toBe(true);

        cifsName.clear();
        cifs_path.clear();
        nextBtn.click();

        expect(element(by.css('.tc_cifsNameRequired')).isDisplayed()).toBe(true);
        expect(element(by.css('.tc_cifsPathRequired')).isDisplayed()).toBe(true);

        cifsName.sendKeys('protractor_wizard_cifsShare');
        //will readd this when bug OP-590 has been fixed
        //cifs_path.sendKeys('/media/' + pname + '/protractor_wizard_cifsShare');
        cifs_path.sendKeys('/media/protractor_wizard_cifsShare');

        //NFS SHARE
        element(by.model('input.nfs.create')).click();

        expect(nfs_path.isPresent()).toBe(true);
        browser.sleep(400);
        expect(address.isPresent()).toBe(true);
        expect(element(by.id('nfsoptions')).isDisplayed()).toBe(true);
        //NOTE the following expectation will fail until OP-590 has been fixed!
        //expect(nfs_path.getAttribute('value')).toEqual('/media/' + pname + '/protractor_wizard_zVol02');
        expect(options.getAttribute('value')).toEqual('rw,no_subtree_check,no_root_squash');
        address.clear();
        browser.sleep(400);
        nextBtn.click();
        expect(element(by.css('.tc_nfsAddressRequired')).isDisplayed()).toBe(true);
        nfs_path.clear();
        browser.sleep(400);
        nextBtn.click();
        expect(element(by.css('.tc_nfsPathRequired')).isDisplayed()).toBe(true);
        //will readd this when bug OP-590 has been fixed
        //nfs_path.sendKeys('/media/' + pname + '/protractor_wizard_zVol02');
        nfs_path.sendKeys('/media/'+ volumename);
        address.sendKeys('oahost.domain.here');

        nextBtn.click();
      });
      break;
    }

    //Step 4 - Done

    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual('File Storage Step 4 - Save configuration');
    expect(nextBtn.getText()).toEqual('Done');
    nextBtn.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#');

    helpers.check_wizard_titles();

    browser.sleep(400);
    volumesItem.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
    /*	next line -> workaround (when checking if the volume is visible,
		    protractor SOMETIMES throws 'element not visible error', but when
		    protractor is about to delete the volume, it's visible and protractor is able to delete it
		    couldn't reproduce this strange behavior and browser.sleep won't help)
    */
    hostsItem.click();
    browser.sleep(400);
    volumesItem.click();
    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
    expect(volume.isDisplayed()).toBe(true);
    browser.sleep(400);
    volume.click();

    //REMOVE CIFS SHARE
    element(by.css('.tc_cifsShareTab')).click();
    expect(cifs_share.isDisplayed()).toBe(true);
    browser.sleep(400);
    cifs_share.click();
    browser.sleep(400);
    element.all(by.css('.tc_menudropdown')).get(1).click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareDelete > a')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    expect(cifs_share.isPresent()).toBe(false);

    //REMOVE NFS SHARE
    browser.sleep(400);
    element(by.css('.tc_nfsShareTab')).click();
    expect(nfs_share.isDisplayed()).toBe(true);
    nfs_share.click();
    browser.sleep(400);
    element(by.css('.tc_nfsShareDelete')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
    expect(nfs_share.isPresent()).toBe(false);
    browser.sleep(400);
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('<----- file storage wizard done (zfs/cifs/nfs) ------>');
  });
});
