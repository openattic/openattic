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

  var pgnumTests = [16, 64];

  var deletePool = function(cephPoolName){
    cephPoolProperties.cephPools.click();
    var cephPool = helpers.search_for_element(cephPoolName);
    cephPool.click();
    helpers.delete_selection(undefined, '$ctrl');
    expect(cephPool.isPresent()).toBe(false);
  };

  var createPool = function(poolName, poolType, pgs){
    var create = cephPoolProperties.formElements.createButton.byClass;
    create.click();
    taskQueueHelpers.waitForPendingTasks();

    var cephPool = helpers.search_for_element(poolName);
    expect(cephPool.isDisplayed()).toBe(true);
    cephPool.click();
    expect(element(by.binding('selection.item.type')).getText()).toBe(poolType);
    expect(element(by.binding('selection.item.pg_num')).getText()).toBe(pgs + '');
  };

  var fillForm = function(poolName, poolType, pgs){
    var name = cephPoolProperties.formElements.name.byModel;
    var pgnum = cephPoolProperties.formElements.pgnum.byModel;
    var type = cephPoolProperties.formElements.types.byModel;
    name.clear().sendKeys(poolName);
    type.sendKeys(poolType);
    pgnum.clear().sendKeys(pgs);
  };

  Object.keys(cephPoolProperties.clusters).forEach(function(clusterName){
    var cluster = cephPoolProperties.clusters[clusterName];
    pgnumTests.forEach(function(pgs){
      ['replicated', 'erasure'].forEach(function(poolType){
        var poolName = cluster.name + '_' + poolType + '_with_' + pgs + '_pgs';
        it('should create a ' + poolType + ' ceph pool on ' + cluster.name + ' cluster with ' + pgs +
            ' placement groups', function(){
          //cephPoolProperties.selectCluster(cluster); // Only needed if multiple clusters are configured
          cephPoolProperties.addButton.click();
          fillForm(poolName, poolType, pgs);
          createPool(poolName, poolType, pgs);
        });
        it('should delete ' + poolName + ' pool on ' + cluster.name + ' cluster', function(){
          deletePool(poolName);
        });
      });
    });

    var ecName = cluster.name + '_erasure_with_32_pgs';
    it('should create a replicated pool with overwrite enabled', function(){
      cephPoolProperties.addButton.click();
      //cephPoolProperties.selectCluster(cluster); // Only needed if multiple clusters are configured
      fillForm(ecName, 'erasure', 32);
      cephPoolProperties.checkCheckboxToBe(cephPoolProperties.formElements.ecOverwriteFlag.byModel);
      createPool(ecName, 'erasure', 32);
      expect(element(by.className('tc-flag-ec_overwrites')).isDisplayed()).toBe(true);
    });
    it('should delete ' + ecName + ' pool on ' + cluster.name + ' cluster', function(){
      deletePool(ecName);
    });
  });

  afterAll(function(){
    console.log('ceph_pool_creation -> ceph_pools_creation.e2e.js');
  });
});
