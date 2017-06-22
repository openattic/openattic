'use strict';

var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('should test the ceph rbd creation form', function(){
  var rbdProperties = new rbdCommons();

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephRBDs.click();
    rbdProperties.addButton.click();
  });

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

  var isItemPresent = function(item, className){
    it('should hold the item "' + item + '"', function(){
      expect(element(by.className(className)).isPresent()).toBe(true);
    });
  };

  var isFormElementAvailable = function(e){
    it('should' + (e.displayed ? ' ' : ' not ') + 'display the form element "' + e.name + '"', function(){
      expect(element(by.className(e.testClass)).isDisplayed()).toBe(e.displayed);
    });
    for(var item in e.items){
      isItemPresent(item, e.items[item]);
    }
  };

  var changeSize = function(inputField, io, fieldName){
    it('should change the input ' + io.input + ' to ' + io.output + ' in "' + fieldName + '"', function(){
      //rdb should be preselected
      rbdProperties.checkCheckboxToBe(rbdProperties.expertSettings, true);
      inputField.click();
      inputField.clear();
      inputField.sendKeys(io.input);
      rbdProperties.name.click();
      expect(inputField.getAttribute('value')).toEqual(io.output);
    });
  };

  for(var formElement in rbdProperties.formElements){
    isFormElementAvailable(rbdProperties.formElements[formElement]);
  }

  ['cluster', 'pool'].forEach(function(name){
    it('should offer a list of ' + name + 's', function(){
      rbdProperties.isListInSelectBox(name);
    });
  });

  // After OP-1339 create a more detailed test for cluster and pool names.

  objSizeInput.forEach(function(io){
    changeSize(rbdProperties.objSize, io, 'Object size');
  });

  sizeInput.forEach(function(io){
    changeSize(rbdProperties.size, io, 'Size');
  });

  rbdProperties.expandedFeatureCases.forEach(function(testCase){
    var keys = Object.keys(rbdProperties.formElements.features.items);
    var values = rbdProperties.formElements.features.items;
    it('should test the following case: [' + testCase + ']',function(){
      rbdProperties.selectFeatures(testCase);
    });
  });

  afterAll(function(){
    console.log('ceph_rbd_form -> ceph_rbd_form.e2e.js');
  });
});
