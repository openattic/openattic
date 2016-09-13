var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('ceph rbd creation and deletion', function(){
  var rbdProperties = new rbdCommons();
  var featureRbdName = "e2eFeatures";

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephMenu.click();
    rbdProperties.cephRBDs.click();
  });

  var objSizeTests = [
    [4, "kB"],
    [8, 'kB'],
    [16, 'kB'],
    [32, 'kB'],
    [64, 'kB'],
    [128, 'kB'],
    [256, 'kB'],
    [512, 'kB'],
    [1, 'MB'],
    [2, 'MB'],
    [4, 'MB'],
    [8, 'MB'],
    [16, 'MB'],
    [32, 'MB']
  ];

  rbdProperties.useWriteablePools(function(cluster, pool){
    objSizeTests.forEach(function(sizeArr, index){
      var objSize = sizeArr[0] + '.00 ' + sizeArr[1];
      var rbdName = "e2eObjectSize" + index;
      it('should create a rbd with a specific object size: "' + objSize + '" object and rbd size on pool "' + pool.name
          + '" in cluster "' + cluster.name + '"', function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        rbdProperties.createRbd(rbdName, objSize);
      });
      it('should delete created rbd with a specific object size: "' + objSize + '" object and rbd size on pool "' + pool.name
        + '" in cluster "' + cluster.name + '"', function(){
        rbdProperties.deleteRbd(rbdName);
      });
    });
  });

  rbdProperties.useWriteablePools(function(cluster, pool){
    rbdProperties.expandedFeatureCases.forEach(function(testCase){
      var keys = Object.keys(rbdProperties.formElements.features.items);
      var values = rbdProperties.formElements.features.items;
      it('should create a rbd with the following expert option case: "[' + testCase + ']" options on pool "' + pool.name
          + '" in cluster "' + cluster.name + '"', function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        for (var i=0; i<7; i++){ // uncheck all boxes
          rbdProperties.checkCheckboxToBe(element(by.className(values[keys[i]])), false);
        }
        testCase.forEach(function(state, index){ // check the features
          rbdProperties.checkFeature(element(by.className(values[keys[index]])), state);
        });
        rbdProperties.createRbd(featureRbdName, null, testCase);
      });
      it('should delete created rbd with the following expert option case: "[' + testCase + ']" options on pool "' +
        pool.name + '" in cluster "' + cluster.name + '"', function(){
        rbdProperties.deleteRbd(featureRbdName);
      })
    });
  });

  afterAll(function(){
    console.log('ceph_rbd_creation -> ceph_rbd_creation.e2e.js');
  });
});
