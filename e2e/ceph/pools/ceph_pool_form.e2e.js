'use strict';

var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool creation form', function(){
  const cephPoolProperties = new cephPoolCommon();

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
    if(e.displayedIf){
      it('should display the form element "' + e.name + '" if "' + e.displayedIf + '"', function(){
        cephPoolProperties.selectNeededSelection(e);
        expect(cephPoolProperties.getFormElement(e).isDisplayed()).toBe(true);
      });
      verifySubitems(e);
    }
  };

  for(var formElement in cephPoolProperties.formElements){
    isFormElementAvailableOnInit(cephPoolProperties.formElements[formElement]);
  }

  for(var formElement in cephPoolProperties.formElements){
    showByDefaultHiddenElement(cephPoolProperties.formElements[formElement]);
  }

  Object.keys(cephPoolProperties.formLabels).forEach(function(name){
    var label = cephPoolProperties.formLabels[name];
    it('should show "' + label.text + '" in ' + label.where, function(){
      expect(label.byClass.getText()).toEqual(label.text);
    });
  });

  it('should show the typed in volume name in the header', function(){
    cephPoolProperties.formElements.name.byModel.sendKeys('protractor_test');
    var header = cephPoolProperties.formLabels.header;
    expect(header.byClass.getText()).toEqual(header.text + ' protractor_test');
  });

  it('should show the right url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/pools/add');
  });

  it('should check if the submit button is disabled when the required fields are empty', function(){
    browser.refresh();
    expect(cephPoolProperties.formElements.createButton.byClass.isEnabled()).toBe(false);
    browser.refresh();
  });

  Object.keys(cephPoolProperties.formElements).forEach(function(name){
    var e = cephPoolProperties.formElements[name];
    if(e.type === 'select'){
      it('should offer a list of ' + name + 's', function(){
        cephPoolProperties.isListInSelectBox(e);
      });
    }
  });

  it('should have a disabled crush rule set selection for replicated pools', function(){
    cephPoolProperties.formElements.types.byModel.sendKeys('Replicated').click();
    expect(cephPoolProperties.formElements.crushRules.byClass.getAttribute('disabled')).toBe('true');
  });

  it('should have a disabled crush rule set selection for ec pools', function(){
    cephPoolProperties.formElements.types.byModel.sendKeys('Erasure');
    expect(cephPoolProperties.formElements.crushRules.byClass.getAttribute('disabled')).toBe('true');
  });

  afterAll(function(){
    console.log('ceph_pool_form -> ceph_pool_form.e2e.js');
  });
});
