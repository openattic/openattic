'use strict';

var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');
var taskQueueHelpers = require('../../base/taskqueue/task_queue_common.js');

describe('ceph pool creation', function(){
  var cephPoolProperties = new cephPoolCommon();

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephPools.click();
  });

  var pgnumTests = [
    1,
    5,
    10
    // 50,
    // 100,
    // 500,
    // 1000,
    // 5000,
    // 10000
  ];

  var deletePool = function(cephPoolName){
    var cephPool = helpers.search_for_element(cephPoolName);
    cephPool.click();
    helpers.delete_selection(undefined, '$ctrl');
    expect(cephPool.isPresent()).toBe(false);
  };

  var createPool = function(poolName, poolType, poolPgnum){
    var name = cephPoolProperties.formElements.name.byModel;
    var pgnum = cephPoolProperties.formElements.pgnum.byModel;
    var type = cephPoolProperties.formElements.types.byModel;
    var create = cephPoolProperties.formElements.createButton.byClass;
    name.clear();
    name.sendKeys(poolName);
    type.sendKeys(poolType);
    pgnum.clear();
    pgnum.sendKeys(poolPgnum);
    create.click();
    taskQueueHelpers.waitForPendingTasks();
    var cephPool = helpers.search_for_element(poolName);
    expect(cephPool.isDisplayed()).toBe(true);

    cephPool.click();
    expect(element(by.binding('selection.item.pgp_num')).getText()).toBe(poolPgnum + '');
    expect(element(by.binding('selection.item.type')).getText()).toBe(poolType);
  };

  Object.keys(cephPoolProperties.clusters).forEach(function(clusterName){
    var cluster = cephPoolProperties.clusters[clusterName];
    pgnumTests.forEach(function(pgnums){
      ['replicated', 'erasure'].forEach(function(poolType){
        var poolName = cluster.name + '_' + poolType + '_with_' + pgnums + '_pgs';
        it('should create a ' + poolType + ' ceph pool on ' + cluster.name + ' cluster with ' + pgnums + ' placement groups', function(){
          cephPoolProperties.selectCluster(cluster);
          cephPoolProperties.addButton.click();
          createPool(poolName, poolType, pgnums);
        });
        it('should delete ' + poolName + ' pool on ' + cluster.name + ' cluster', function(){
          deletePool(poolName);
        });
      });
    });
  });

  afterAll(function(){
    console.log('ceph_pool_creation -> ceph_pools_creation.e2e.js');
  });
});