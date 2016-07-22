'use strict';

var wizardCommon = function(){
  var self = this;

  this.wizardOverviewBtn = element(by.className('tc_wizardOverview'));
  this.previousBtn = element(by.className('tc_previousBtn'));
  this.nextBtn = element(by.id('nextBtn'));
  this.volumefield = element(by.model('result.name'));
  this.size = element(by.model('data.megs'));
  this.volume_required = element(by.className('tc_nameRequired'));
  this.volume_unique = element(by.className('tc_noUniqueName'));
  this.pool_required = element(by.className('tc_poolRequired'));
  this.size_required = element(by.className('tc_sizeRequired'));
  this.size_exceeded = element(by.className('tc_wrongVolumeSize'));
  this.noValidNumber = element(by.className('tc_noValidNumber'));
  this.cifsName = element(by.id('cifsname'));
  this.configs = require('../configs.js');

  this.openWizard = function(wizardName){
    element.all(by.className('tc_wizardTitle')).filter(function(wizard){
      return wizard.getText().then(function(text){
        return text === wizardName;
      })
    }).first().click()
  };

  this.creationPageElementCheck = function(pageTitle){
    //Step 1 - Create Volume
    //check available buttons
    expect(self.wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(self.previousBtn.isDisplayed()).toBe(true);

    //check if angular expression contains 'Next' or 'Done
    expect(self.nextBtn.getText()).toEqual('Next');
    //check content of first wizard site
    expect(element(by.css('.tc_oawizard_h3')).getText()).toEqual(pageTitle);
    expect(self.volumefield.isDisplayed()).toBe(true);
    //expect(pool.isDisplayed()).toBe(true);
    expect(self.size.isDisplayed()).toBe(true);
    //expect(is_protected.isDisplayed()).toBe(true);
  };

  this.creationPagePoolSelection = function(poolType){
    //in order to enter a size we need to choose a pool first
    for(var key in self.configs.pools){
      var volumePoolSelect = element(by.model('pool'));
      var pool = self.configs.pools[key];
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(' + poolType + ',')).get(0).click();
      //browser.actions().sendKeys( protractor.Key.ENTER ).perform();
      break;
    }
  };

  this.creationPageInputTests = function(){
    self.size.sendKeys('asdffffweee');
    expect(self.noValidNumber.isDisplayed()).toBe(true);
    self.size.clear();
    self.size.sendKeys('10000000000000000000000000000000');
    expect(self.size_exceeded.isDisplayed()).toBe(true);
  };

  this.creationPageValidationTests = function(){
    //check what happens if next button has been clicked without entering any data
    self.nextBtn.click();
    expect(self.volume_required.isDisplayed()).toBe(true);
    expect(self.pool_required.isDisplayed()).toBe(true);
    expect(self.size_required.isDisplayed()).toBe(true);

    //enter some data for validation
    self.volumefield.sendKeys('äasdower dsafodf');
    var noValidName = element(by.css('.tc_noValidName')).evaluate('errortext');
    expect(noValidName.isDisplayed()).toBe(true);

    //in order to enter a size we need to choose a pool first
    for(var key in self.configs.pools){
      var volumePoolSelect = element(by.model('pool'));
      var pool = self.configs.pools[key];
      volumePoolSelect.click();
      element.all(by.cssContainingText('option', '(volume group,')).get(0).click();
      //browser.actions().sendKeys( protractor.Key.ENTER ).perform();
      break;
    }
  };

  this.creationFromFill = function(volName, size, fsType){
    //enter some data to get to the next site
    self.volumefield.clear();
    self.volumefield.sendKeys(volName);
    self.size.clear();
    self.size.sendKeys(size);
    if(fsType){
      element(by.id(fsType)).click();
    }
    expect(self.volume_unique.isDisplayed()).toBe(false);
    self.nextBtn.click();
  };

  this.shareCreationElementCheck = function(pageTitle){
    //Step 2 - create share

    expect(element(by.css('.tc_step2')).getText()).toEqual(pageTitle);

    expect(self.wizardOverviewBtn.isDisplayed()).toBe(true);
    expect(self.previousBtn.isDisplayed()).toBe(true);
    expect(self.nextBtn.getText()).toEqual('Next');
  };

  this.shareCreateNfs = function(shareName){
    expect(element(by.model('input.cifs.create')).isPresent()).toBe(true);
    expect(element(by.model('input.nfs.create')).isPresent()).toBe(true);
    //choose nfs
    element(by.model('input.nfs.create')).click();
    var address = element(by.id('nfsaddress'));
    var options = element(by.id('nfsoptions'));

    browser.sleep(400);
    expect(address.isPresent()).toBe(true);
    expect(element(by.id('nfsoptions')).isDisplayed()).toBe(true);
    expect(options.getAttribute('value')).toEqual('rw,no_subtree_check,no_root_squash');
    address.clear();
    self.nextBtn.click();
    expect(element(by.css('.tc_nfsAddressRequired')).isDisplayed()).toBe(true);
    address.sendKeys(shareName);
  };

  this.shareCreateCifs = function(volumeName, shareName){
    expect(element(by.model('input.cifs.create')).isPresent()).toBe(true);
    expect(element(by.model('input.nfs.create')).isPresent()).toBe(true);
    element(by.model('input.cifs.create')).click();

    //CIFS SHARE
    expect(self.cifsName.isPresent()).toBe(true);
    expect(self.cifsName.getAttribute('value')).toEqual(volumeName);

    expect(element(by.id('cifscomment')).isDisplayed()).toBe(true);

    self.cifsName.clear();
    self.nextBtn.click();

    expect(element(by.css('.tc_cifsNameRequired')).isDisplayed()).toBe(true);

    self.cifsName.sendKeys(shareName);
  };

  this.shareCreateFc = function(hostname){
    //select host
    var hostSelect = element(by.model('input.iscsi_fc.host'));
    hostSelect.element(by.cssContainingText('option', hostname)).click();
  };

  this.configurationExecution = function(pageTitle){
    //Step 3 - Done

    browser.sleep(400);
    expect(element(by.css('.tc_wizardDone')).getText()).toEqual(pageTitle);
    expect(self.nextBtn.getText()).toEqual('Done');
    self.nextBtn.click();
    browser.sleep(400);
    expect(browser.getCurrentUrl()).toContain('/openattic/#');
  };
};

module.exports = wizardCommon;
