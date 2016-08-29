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

  rbdProperties.useWriteablePools(function(cluster, pool){
    objSizeTests.forEach(function(objSize, index){
      it('should create a rbd with this object size: ' + objSize + ' on ' + pool.name + ' in cluster ' + cluster.name, function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        var rbdName = "e2eObjectSize" + index;
        rbdProperties.createRbd(rbdName, objSize);
        rbdProperties.deleteRbd(rbdName);
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
        rbdProperties.createRbd("e2eFeatures", null, testCase);
        rbdProperties.deleteRbd("e2eFeatures");
      })
    });
  });

  afterAll(function(){
    console.log('ceph_rbd_creation -> ceph_rbd_creation.e2e.js');
  });
});