'use strict';

var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool creation form', function(){
  const cephPoolProperties = new cephPoolCommon();
  const fe = cephPoolProperties.formElements;

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephPools.click();
    cephPoolProperties.addButton.click();
  });

  const isItemPresent = function(item, items){
    it('should hold the item "' + item + '"', function(){
      expect(items[item].isPresent()).toBe(true);
    });
  };

  const verifySubitems = e => {
    for(let item in e.items){
      isItemPresent(item, e.items);
    }
  };

  const isFormElementAvailableOnInit = function(e){
    if(e.presented === false){
      it('should not present the form element "' + e.name + '"', function(){
        expect(cephPoolProperties.getFormElement(e).isPresent()).toBe(false);
      });
    }else{
      it('should' + (e.displayed ? ' ' : ' not ') + 'display the form element "' + e.name + '"', function(){
        expect(cephPoolProperties.getFormElement(e).isDisplayed()).toBe(e.displayed);
      });
      verifySubitems(e);
    }
  };

  const showByDefaultHiddenElement = function(e){
    if(!e.displayedIf){
      return;
    }
    e.displayedIf.forEach((displayedIf) => {
      it('should display the form element "' + e.name + '" if "' + displayedIf + '"', function(){
        cephPoolProperties.selectNeededSelection(displayedIf);
        expect(cephPoolProperties.getFormElement(e).isDisplayed()).toBe(true);
      });
      verifySubitems(e);
    });
  };

  for(var formElement in fe){
    isFormElementAvailableOnInit(fe[formElement]);
  }

  for(var formElement in fe){
    showByDefaultHiddenElement(fe[formElement]);
  }

  Object.keys(cephPoolProperties.formLabels).forEach(function(name){
    var label = cephPoolProperties.formLabels[name];
    it('should show "' + label.text + '" in ' + label.where, function(){
      expect(label.byClass.getText()).toEqual(label.text);
    });
  });

  it('should show the typed in volume name in the header', function(){
    fe.name.byModel.sendKeys('protractor_test');
    var header = cephPoolProperties.formLabels.header;
    expect(header.byClass.getText()).toEqual(header.text + ' protractor_test');
  });

  it('should show the right url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/pools/add');
  });

  it('should check if the submit button is disabled when the required fields are empty', function(){
    browser.refresh();
    expect(fe.createButton.byClass.isEnabled()).toBe(false);
    browser.refresh();
  });

  Object.keys(fe).forEach(function(name){
    var e = fe[name];
    if(e.type === 'select'){
      it('should offer a list of ' + name + 's', function(){
        cephPoolProperties.isListInSelectBox(e);
      });
    }
  });

  fe.selectApplication.displayedIf.forEach((displayedIf) => {
    it('should offer a list of 4 apps with ' + displayedIf, function(){
      const e = cephPoolProperties.getFormElement(fe.selectApplication);
      cephPoolProperties.selectNeededSelection(displayedIf);
      e.click();
      var listEntries = e.all(by.css('option'));
      expect(listEntries.count()).toBe(5); // Includes the placeholder element
    });
  });

  fe.selectApplication.displayedIf.forEach((displayedIf) => {
    it('should be able to create a custom app with ' + displayedIf, function(){
      cephPoolProperties.selectNeededSelection(displayedIf);
      let firstCase = fe.firstUsedApp.byClass;
      expect(firstCase.isPresent()).toBe(false);
      cephPoolProperties.addApplication(4);
      firstCase = fe.firstUsedApp.byClass;
      expect(firstCase.isDisplayed()).toBe(true);
      firstCase.sendKeys('tux');
      fe.name.byModel.click();
      fe.firstAppDeletionBtn.byClass.click();
      expect(firstCase.isPresent()).toBe(false);
    });
  });

  it('should have a disabled crush rule set selection for replicated pools', function(){
    fe.types.byModel.sendKeys('Replicated').click();
    expect(fe.crushRules.byClass.getAttribute('disabled')).toBe('true');
  });

  it('should have a disabled crush rule set selection for ec pools', function(){
    fe.types.byModel.sendKeys('Erasure');
    expect(fe.crushRules.byClass.getAttribute('disabled')).toBe('true');
  });

  afterAll(function(){
    console.log('ceph_pool_form -> ceph_pool_form.e2e.js');
  });
});
