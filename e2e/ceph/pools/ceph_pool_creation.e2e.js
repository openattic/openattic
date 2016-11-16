var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool creation', function(){
  var cephPoolProperties = new cephPoolCommon();

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephMenu.click();
    cephPoolProperties.cephPools.click();
  });

  var pgnumTests = [
    1,
    5,
    10,
    50,
    100,
    500,
    1000,
    5000,
    10000
  ];

  var deletePool = function(cephPoolName){
    var cephPool = element(by.cssContainingText('tr', cephPoolName));
    cephPool.click();
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_deleteItem > a')).click();
    element(by.model('input.enteredName')).sendKeys('yes');
    element(by.id('bot2-Msg1')).click();
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
    browser.sleep(helpers.configs.sleep);
    var cephPool = element(by.cssContainingText('tr', poolName));
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