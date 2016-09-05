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
      var rbdSize = sizeArr[0]*2 + '.00 ' + sizeArr[1]; // The rbd will always consist of 2 objects.
      it('should create a rbd with ' + objSize + ' object size and ' + rbdSize + ' rbd size on ' + pool.name + ' in cluster ' + cluster.name, function(){
        rbdProperties.selectClusterAndPool(cluster, pool);
        var rbdName = "e2eObjectSize" + index;
        rbdProperties.createRbd(rbdName, objSize, null, rbdSize);
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
