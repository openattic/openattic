'use strict';

var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('should test the ceph rbd creation form', function(){
  var rbdProperties = new rbdCommons();
  const fe = rbdProperties.formElements;

  var objSizeInput = [
    {input: '0', output: '4.00 KiB'},
    {input: '5', output: '4.00 KiB'},
    {input: '6',  output: '8.00 KiB'},
    {input: '11', output: '8.00 KiB'},
    {input: '12', output: '16.00 KiB'},
    {input: '22', output: '16.00 KiB'},
    {input: '23', output: '32.00 KiB'},
    {input: '45', output: '32.00 KiB'},
    {input: '46', output: '64.00 KiB'},
    {input: '90', output: '64.00 KiB'},
    {input: '91',  output: '128.00 KiB'},
    {input: '181', output: '128.00 KiB'},
    {input: '182', output: '256.00 KiB'},
    {input: '362', output: '256.00 KiB'},
    {input: '363', output: '512.00 KiB'},
    {input: '724', output: '512.00 KiB'},
    {input: '725',  output: '1.00 MiB'},
    {input: '1448', output: '1.00 MiB'},
    {input: '1449', output: '2.00 MiB'},
    {input: '2896', output: '2.00 MiB'},
    {input: '2897', output: '4.00 MiB'},
    {input: '5792', output: '4.00 MiB'},
    {input: '5793',  output: '8.00 MiB'},
    {input: '11585', output: '8.00 MiB'},
    {input: '11586', output: '16.00 MiB'},
    {input: '23170', output: '16.00 MiB'},
    {input: '23171',  output: '32.00 MiB'},
    {input: '666666', output: '32.00 MiB'},
    {input: '1 gb',  output: '32.00 MiB'},
    {input: '0.017 gb',  output: '16.00 MiB'},
    {input: '0.017 mb',  output: '16.00 KiB'},
    {input: '0.5 mb',  output: '512.00 KiB'},
    {input: '0.000007 gb',  output: '8.00 KiB'}
  ];

  var sizeInput = [
    {input: '1', output: '1.00 MiB'},
    {input: '512', output: '512.00 MiB'},
    {input: '1024', output: '1.00 GiB'},
    {input: '2048', output: '2.00 GiB'},
    {input: '4096', output: '4.00 GiB'},
    {input: '8192', output: '8.00 GiB'},
    {input: '16384', output: '16.00 GiB'},
    {input: '32768', output: '32.00 GiB'},
    {input: '65536', output: '64.00 GiB'},
    {input: '131072', output: '128.00 GiB'},
    {input: '262144', output: '256.00 GiB'},
    {input: '524288', output: '512.00 GiB'},
    {input: '1048576', output: '1.00 TiB'},
    {input: '2097152', output: '2.00 TiB'},
    {input: '4194304', output: '4.00 TiB'},
    {input: '8388608', output: '8.00 TiB'},
    {input: '16777216', output: '16.00 TiB'},
    {input: '33554432', output: '32.00 TiB'},
    {input: '67108864', output: '64.00 TiB'},
    {input: '134217728', output: '128.00 TiB'},
    {input: '268435456', output: '256.00 TiB'},
    {input: '536870912', output: '512.00 TiB'},
    {input: '1073741824', output: '1.00 PiB'}
  ];

  var isItemPresent = function(name, item, className){
    it('should hold the item "' + item + '" in "' + name + '"', function(){
      expect(element(by.className(className)).isPresent()).toBe(true);
    });
  };

  var isFormElementAvailable = function(e){
    if(e.testClass){
      it('should display the form element "' + e.name + '"', function(){
        expect(element(by.className(e.testClass)).isDisplayed()).toBe(true);
      });
    }
    for(var item in e.items){
      var itemClasse = typeof e.items[item] == 'string' ?
        e.items[item] : e.items[item].class;
      isItemPresent(e.name, item, itemClasse);
    }
  };

  var changeSizeTest = function(inputField, io, fieldName){
    it('should change the input ' + io.input + ' to ' + io.output + ' in "' + fieldName + '"', function(){
      //rbd should be preselected
      rbdProperties.checkCheckboxToBe(rbdProperties.defaultFeatures, false);
      helpers.changeInput(inputField, io.input);
      expect(inputField.getAttribute('value')).toEqual(io.output);
    });
  };

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephRBDs.click();
    rbdProperties.addButton.click();
    rbdProperties.firstPool.click();
    rbdProperties.selectFeatures([1, 1, 1, 1, 1, 1, 1]); // Selects all features
  });

  it('should show a warning on object size if stripe unit is increased', () => {
    const unit = rbdProperties.stripingUnit;
    const objSize = rbdProperties.objSize;
    helpers.changeInput(objSize, '4 M');
    helpers.changeInput(unit, '4 M');
    helpers.changeInput(unit, '8 M');
    expect(element(by.className(fe.objectSize.items.changed)).isDisplayed()).toBe(true);
    helpers.changeInput(objSize, '8 M');
    expect(element(by.className(fe.objectSize.items.changed)).isDisplayed()).toBe(false);
  });

  it('should show a warning on stripe unit if object size is decreased', () => {
    const unit = rbdProperties.stripingUnit;
    const objSize = rbdProperties.objSize;
    helpers.changeInput(unit, '4 M');
    helpers.changeInput(objSize, '4 M');
    helpers.changeInput(objSize, '2 M');
    expect(element(by.className(fe.stripingUnit.items.changed)).isDisplayed()).toBe(true);
    helpers.changeInput(unit, '2 M');
    expect(element(by.className(fe.stripingUnit.items.changed)).isDisplayed()).toBe(false);
  });

  it('should show a warning if stripe count is set to 2', () => {
    const count = rbdProperties.stripingCount;
    helpers.changeInput(count, '1');
    expect(element(by.className(fe.stripingCount.items.min)).isDisplayed()).toBe(true);
    helpers.changeInput(count, '5');
    expect(element(by.className(fe.stripingCount.items.min)).isDisplayed()).toBe(false);
  });

  it('should show an error on size if object set size icreases the setted size', () => {
    const size = rbdProperties.size;
    helpers.changeInput(rbdProperties.stripingUnit, '4 M');
    helpers.changeInput(rbdProperties.stripingCount, '5');
    helpers.changeInput(size, '10 M');
    expect(element(by.className(fe.size.items.helpSizeStripe)).isDisplayed()).toBe(true);
    helpers.changeInput(size, '100 M');
    expect(element(by.className(fe.size.items.helpSizeStripe)).isDisplayed()).toBe(false);
  });

  for(let e in fe){
    isFormElementAvailable(fe[e]);
  }

  ['cluster', 'pool'].forEach(function(name){
    it('should offer a list of ' + name + 's', function(){
      rbdProperties.isListInSelectBox(name);
    });
  });

  // After OP-1339 create a more detailed test for cluster and pool names.

  objSizeInput.forEach(function(io){
    changeSizeTest(rbdProperties.objSize, io, 'Object size');
  });

  sizeInput.forEach(function(io){
    changeSizeTest(rbdProperties.size, io, 'Size');
  });

  rbdProperties.expandedFeatureCases.forEach(function(testCase){
    var keys = Object.keys(fe.features.items);
    var values = fe.features.items;
    it('should test the following case: [' + testCase + ']',function(){
      rbdProperties.selectFeatures(testCase);
    });
  });

  /**
   * For this tests at least 2 pool are needed!
   * One replicated pool and another replicated pool or erasure coded pool with ec_overwrites enabled.
   */
  it('should change the lable of pool to meta-pool if a data pool can be selected', function(){
    rbdProperties.useDataPool.click();
    expect(element(by.css('label[for=pool]')).getText()).toBe('Meta-Pool *');
    rbdProperties.useDataPool.click();
    expect(element(by.css('label[for=pool]')).getText()).toBe('Pool *');
  });

  it('should not be able to select the same pool as data pool', function(){
    rbdProperties.useDataPool.click();
    expect(element(by.css('label[for=dataPool]')).getText()).toBe('Data-Pool *');
    expect(rbdProperties.dataPoolSelect.element(by.cssContainingText('option', rbdProperties.firstPool.getText()))
      .isPresent()).toBe(false);
    rbdProperties.useDataPool.click();
  });

  it('should shows tooltips for pool selections', function(){
    expect(element(by.css('label[for=pool] > span[uib-tooltip]')).getAttribute('uib-tooltip'))
      .toBe('Main pool where the RBD is located and all data is stored');
    rbdProperties.useDataPool.click();
    expect(element(by.css('label[for=pool] > span[uib-tooltip]')).getAttribute('uib-tooltip'))
      .toBe('Main pool where the RBD is located and the meta-data is stored');
    expect(element(by.css('label[for=dataPool] > span[uib-tooltip]')).getAttribute('uib-tooltip'))
      .toBe('Dedicated pool that stores the object-data of the RBD');
    rbdProperties.useDataPool.click();
  });

  afterAll(function(){
    console.log('ceph_rbd_form -> ceph_rbd_form.e2e.js');
  });
});
