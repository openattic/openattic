var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('should test the ceph rbd creation and deletion', function(){
  var rbdProperties = new rbdCommons();

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephMenu.click();
    rbdProperties.cephRBDs.click();
  });

  var objSizeTests = [
    '4.00 kB',
    '8.00 kB',
    '16.00 kB',
    '32.00 kB',
    '64.00 kB',
    '128.00 kB',
    '256.00 kB',
    '512.00 kB',
    '1.00 MB',
    '2.00 MB',
    '4.00 MB',
    '8.00 MB',
    '16.00 MB',
    '32.00 MB'
  ];

  var deleteRbd = function(rbdName){
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_deleteItem > a')).click();
    element(by.model('input.enteredName')).sendKeys('yes');
    element(by.id('bot2-Msg1')).click();
    rbd = element(by.cssContainingText('tr', rbdName));
    expect(rbd.isPresent()).toBe(false);
  };

  var createRbd = function(rbdName, rbdObjSize, rbdFeatureCase){
    rbdObjSize = rbdObjSize || "32.00 MB";
    rbdProperties.name.clear();
    rbdProperties.name.sendKeys(rbdName);
    rbdProperties.size.clear();
    rbdProperties.size.sendKeys(65);
    rbdProperties.objSize.clear();
    rbdProperties.objSize.sendKeys(rbdObjSize);
    element(by.className('tc_submitButton')).click();
    var rbd = element(by.cssContainingText('tr', rbdName));
    expect(rbd.isDisplayed()).toBe(true);

    rbd.click();
    expect(element(by.cssContainingText('dd', rbdObjSize)).isDisplayed()).toBe(true);
    if(rbdFeatureCase){
      var keys = Object.keys(rbdProperties.formElements.features.items);
      rbdFeatureCase.forEach(function(state, index){ // check the features
        if(state === 1){
          expect(element(by.cssContainingText('dd', keys[index])).isDisplayed()).toBe(true);
        }
      });
    }
  };

  rbdProperties.useWriteablePools(function(cluster, pool){
    objSizeTests.forEach(function(objSize, index){
      it('should create a rbd with this object size: ' + objSize + ' on ' + pool.name + ' in cluster ' + cluster.name, function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        var rbdName = "e2eObjectSize" + index;
        createRbd(rbdName, objSize);
        deleteRbd(rbdName);
      });
    });
  });

  rbdProperties.useWriteablePools(function(cluster, pool){
    rbdProperties.expandedFeatureCases.forEach(function(testCase){
      var keys = Object.keys(rbdProperties.formElements.features.items);
      var values = rbdProperties.formElements.features.items;
      it('should test the following case: [' + testCase + '] on ' + pool.name + ' in cluster ' + cluster.name,function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        for (var i=0; i<7; i++){ // uncheck all boxes
          rbdProperties.checkCheckboxToBe(element(by.className(values[keys[i]])), false);
        }
        testCase.forEach(function(state, index){ // check the features
          rbdProperties.checkFeature(element(by.className(values[keys[index]])), state);
        });
        createRbd("e2eFeatures", null, testCase);
        deleteRbd("e2eFeatures");
      })
    });
  });

  afterAll(function(){
    console.log('ceph_rbds -> ceph_rbds_form.e2e.js');
  });
});