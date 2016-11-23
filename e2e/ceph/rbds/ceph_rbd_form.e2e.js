var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('should test the ceph rbd creation form', function(){
  var rbdProperties = new rbdCommons();

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephMenu.click();
    rbdProperties.cephRBDs.click();
    rbdProperties.addButton.click();
  });

  var objSizeInput = [
    {input: '0', output: '4.00 kB'},
    {input: '5', output: '4.00 kB'},
    {input: '6',  output: '8.00 kB'},
    {input: '11', output: '8.00 kB'},
    {input: '12', output: '16.00 kB'},
    {input: '22', output: '16.00 kB'},
    {input: '23', output: '32.00 kB'},
    {input: '45', output: '32.00 kB'},
    {input: '46', output: '64.00 kB'},
    {input: '90', output: '64.00 kB'},
    {input: '91',  output: '128.00 kB'},
    {input: '181', output: '128.00 kB'},
    {input: '182', output: '256.00 kB'},
    {input: '362', output: '256.00 kB'},
    {input: '363', output: '512.00 kB'},
    {input: '724', output: '512.00 kB'},
    {input: '725',  output: '1.00 MB'},
    {input: '1448', output: '1.00 MB'},
    {input: '1449', output: '2.00 MB'},
    {input: '2896', output: '2.00 MB'},
    {input: '2897', output: '4.00 MB'},
    {input: '5792', output: '4.00 MB'},
    {input: '5793',  output: '8.00 MB'},
    {input: '11585', output: '8.00 MB'},
    {input: '11586', output: '16.00 MB'},
    {input: '23170', output: '16.00 MB'},
    {input: '23171',  output: '32.00 MB'},
    {input: '666666', output: '32.00 MB'},
    {input: '1 gb',  output: '32.00 MB'},
    {input: '0.017 gb',  output: '16.00 MB'},
    {input: '0.017 mb',  output: '16.00 kB'},
    {input: '0.5 mb',  output: '512.00 kB'},
    {input: '0.000007 gb',  output: '8.00 kB'}
  ];

  var sizeInput = [
    {input: '1', output: '1.00 MB'},
    {input: '512', output: '512.00 MB'},
    {input: '1024', output: '1.00 GB'},
    {input: '2048', output: '2.00 GB'},
    {input: '4096', output: '4.00 GB'},
    {input: '8192', output: '8.00 GB'},
    {input: '16384', output: '16.00 GB'},
    {input: '32768', output: '32.00 GB'},
    {input: '65536', output: '64.00 GB'},
    {input: '131072', output: '128.00 GB'},
    {input: '262144', output: '256.00 GB'},
    {input: '524288', output: '512.00 GB'},
    {input: '1048576', output: '1.00 TB'},
    {input: '2097152', output: '2.00 TB'},
    {input: '4194304', output: '4.00 TB'},
    {input: '8388608', output: '8.00 TB'},
    {input: '16777216', output: '16.00 TB'},
    {input: '33554432', output: '32.00 TB'},
    {input: '67108864', output: '64.00 TB'},
    {input: '134217728', output: '128.00 TB'},
    {input: '268435456', output: '256.00 TB'},
    {input: '536870912', output: '512.00 TB'},
    {input: '1073741824', output: '1.00 PB'}
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
    for(item in e.items){
      isItemPresent(item, e.items[item]);
    }
  };

  var changeSize = function(inputField, io, fieldName){
    it('should change the input ' + io.input + ' to ' + io.output + ' in "' + fieldName + "'", function(){
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
    changeSize(rbdProperties.objSize, io, "Object size")
  });

  sizeInput.forEach(function(io){
    changeSize(rbdProperties.size, io, "Size")
  });

  rbdProperties.expandedFeatureCases.forEach(function(testCase){
    var keys = Object.keys(rbdProperties.formElements.features.items);
    var values = rbdProperties.formElements.features.items;
    it('should test the following case: [' + testCase + ']',function(){
      rbdProperties.checkCheckboxToBe(rbdProperties.expertSettings, true);
      for (var i=0; i<7; i++){ // uncheck all boxes
        rbdProperties.checkCheckboxToBe(element(by.className(values[keys[i]])), false);
      }
      testCase.forEach(function(state, index){ // check the features
        rbdProperties.checkFeature(element(by.className(values[keys[index]])), state);
      });
      testCase.forEach(function(state, index){ //check if features that should be disabled are disabled
        if(state === -1){
          expect(element(by.className(values[keys[index]])).isEnabled()).toBe(false);
        }
      });
    });
  });

  afterAll(function(){
    console.log('ceph_rbd_form -> ceph_rbd_form.e2e.js');
  });
});
