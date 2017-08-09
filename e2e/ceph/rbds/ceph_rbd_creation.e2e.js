'use strict';

var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('ceph rbd creation and deletion', function(){
  var rbdProperties = new rbdCommons();
  var namePrefix = 'e2e_rbd';

  var objSizeTests = [
    [4, 'KiB'],
    [4, 'MiB'],
    [32, 'MiB']
  ];

  /**
   * Will run a full rbd creation test.
   *
   * @param {object} rbdConfig
   * @param {string} rbdConfig.clusterName
   * @param {string} rbdConfig.poolName
   * @param {string} rbdConfig.rbdName
   * @param {string} rbdConfig.objSize
   * @param {number[]} rbdConfig.features
   */
  var fullRbdCreation = function(rbdConfig){
    var desc = [
      'should create "' + rbdConfig.rbdName + '" rbd',
      rbdConfig.features ? 'with the following feature case: "[' + rbdConfig.features + ']" options' : '',
      rbdConfig.objSize ? 'with a object size of "' + rbdConfig.objSize + '"' : '',
      'on pool "' + rbdConfig.poolName + '"',
      'on cluster "' + rbdConfig.clusterName + '"'
    ].join(' ');
    it(desc, function(){
      rbdProperties.selectClusterAndPool(rbdConfig.clusterName, rbdConfig.poolName);
      rbdProperties.createRbd(rbdConfig.rbdName, rbdConfig.objSize, rbdConfig.features);
    });
  };

  /**
   * Will run a full rbd deletion test.
   *
   * @param {object} rbdConfig
   * @param {string} rbdConfig.clusterName
   * @param {string} rbdConfig.poolName
   * @param {string} rbdConfig.rbdName
   */
  var fullRbdDeletion = function(rbdConfig){
    var desc = [
      'should delete "' + rbdConfig.rbdName + '" rbd',
      'on pool "' + rbdConfig.poolName + '"',
      'on cluster "' + rbdConfig.clusterName + '"'
    ].join(' ');
    it(desc, function(){
      rbdProperties.deleteRbd(rbdConfig.rbdName);
    });
  };

  beforeAll(function(){
    helpers.login();
  });

  /**
   * To prevent getting stuck anywhere.
   */
  beforeEach(function(){
    rbdProperties.cephRBDs.click();
    browser.sleep(helpers.configs.sleep);
  });

  rbdProperties.useWriteablePools(function(cluster, pool){
    // Use the case with the least, default and the most options.
    var testCases = rbdProperties.expandedFeatureCases;
    [testCases[0], rbdProperties.defaultFeatureCase, testCases[testCases.length - 1]].forEach(function(features, index){
      var objSizeArr = objSizeTests[index];
      var rbdConfig = {
        clusterName: cluster.name,
        poolName: pool.name,
        rbdName: [namePrefix, index, features.join('')].join('_'),
        objSize: objSizeArr[0] + '.00 ' + objSizeArr[1],
        features: features
      };
      fullRbdCreation(rbdConfig);
      fullRbdDeletion(rbdConfig);
    });

    /**
     * For this tests at least 2 pool are needed!
     * One replicated pool and another replicated pool or erasure coded pool with ec_overwrites enabled.
     */
    var rbdDataPoolName = namePrefix + '_with_data_pool';
    it('should create RBD with a meta and data pool with the first pools in both lists, named ' + rbdDataPoolName, function(){
      rbdProperties.selectCluster(cluster.name);
      rbdProperties.addButton.click();
      var firstPoolOption = rbdProperties.poolSelect.all(by.tagName('option')).get(1);
      firstPoolOption.click();
      rbdProperties.useDataPool.click();
      var firstDataPoolOption = rbdProperties.dataPoolSelect.all(by.tagName('option')).get(1);
      firstDataPoolOption.click();
      rbdProperties.createRbd(rbdDataPoolName);
      expect(element(by.cssContainingText('dt', 'Meta-Pool')).isDisplayed()).toBe(true);
      expect(element(by.cssContainingText('dt', 'Data-Pool')).isDisplayed()).toBe(true);
    });
    fullRbdDeletion({
      rbdName: rbdDataPoolName,
      clusterName: cluster.name
    });
  });

  afterAll(function(){
    console.log('ceph_rbd_creation -> ceph_rbd_creation.e2e.js');
  });
});
