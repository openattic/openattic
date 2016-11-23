var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool creation form', function(){
  var cephPoolProperties = new cephPoolCommon();

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephMenu.click();
    cephPoolProperties.cephPools.click();
    cephPoolProperties.addButton.click();
  });

  var isItemPresent = function(item, items){
    it('should hold the item "' + item + '"', function(){
      expect(items[item].isPresent()).toBe(true);
    });
  };

  var isFormElementAvailable = function(e){
    it('should' + (e.displayed ? ' ' : ' not ') + 'display the form element "' + e.name + '"', function(){
      if(e.byModel){
        expect(e.byModel.isDisplayed()).toBe(e.displayed);
      }else{
        expect(e.byClass.isDisplayed()).toBe(e.displayed);
      }
    });
    for(item in e.items){
      isItemPresent(item, e.items);
    }
  };

  for(var formElement in cephPoolProperties.formElements){
    isFormElementAvailable(cephPoolProperties.formElements[formElement]);
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

  it('should show required field errors if the submit button is clicked without editing anything', function(){
    browser.refresh();
    cephPoolProperties.formElements.createButton.byClass.click();

    expect(cephPoolProperties.formElements.name.items.required.isDisplayed()).toBe(true);
    expect(cephPoolProperties.formElements.types.items.required.isDisplayed()).toBe(true);
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

  afterAll(function(){
    console.log('ceph_pool_form -> ceph_pool_form.e2e.js');
  });
});
