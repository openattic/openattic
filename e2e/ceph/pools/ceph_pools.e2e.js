var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('should test the ceph pools panel', function(){
  var cephPoolProperties = new cephPoolCommon();

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephMenu.click();
    cephPoolProperties.cephPools.click();
  });

  it('should check the ceph pool url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/pools');
  });

  it('should display the ceph pools table', function(){
    expect(element(by.css('.tc_cephPoolTable')).isDisplayed()).toBe(true);
  });

  it('should have an add button', function(){
    expect(cephPoolProperties.addButton.isDisplayed()).toBe(true);
  });

  cephPoolProperties.tableHeaders.forEach(function(header){
    it('should ' + !header.displayed ? 'not ' : '' + 'display the following table header: ' + header.name, function(){
      expect(element(by.cssContainingText('th', header.name)).isDisplayed()).toBe(header.displayed);
    });
  });

  it('should have at least one ceph pools table entry', function(){
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should have a status tab when selecting a pool', function(){
    //choose first element in ceph pools list
    element.all(by.binding('row.name')).get(0).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/pools/status#more');
    expect(cephPoolProperties.statusTab.isDisplayed()).toBe(true);
  });

  cephPoolProperties.detailAttributes.forEach(function(attribute){
    it('should check the content attribute "' + attribute + '" in the details tab when selecting a pool', function(){
      element.all(by.binding('row.name')).get(0).click();
      expect(element.all(by.cssContainingText('dt', attribute + ':')).first().isDisplayed()).toBe(true);
    });
  });

  var cephCluster = helpers.configs.cephCluster;
  var cephClusterCount = Object.keys(cephCluster).length;
  Object.keys(cephCluster).forEach(function(clusterName){
    var cluster = cephCluster[clusterName];
    Object.keys(cluster.pools).forEach(function(poolName){
      var pool = cluster.pools[poolName];
      it('should have the configured pool "' + pool.name + '" in the pool list of cluster "' + cluster.name + '"', function(){
        if(cephClusterCount > 1){
          var clusterSelect = element(by.model('registry.selectedCluster'));
          clusterSelect.sendKeys(cluster.name);
          browser.sleep(800);
          expect(clusterSelect.getText()).toContain(cluster.name);
        }
        expect(element(by.cssContainingText('tr', pool.name)).isDisplayed()).toBe(true);
      });
    });
  });

  /*
  Only if cache tiering is available by the pool. Can't be tested yet.

  it('should have a cache tiering tab when selecting a pool', function(){
    expect(cacheTieringTab.isDisplayed()).toBe(true);
    cacheTieringTab.click();
    browser.sleep(400);
    //check for tab content
    expect(element(by.cssContainingText('dt', 'tier_of:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'target_max_bytes:')).isDisplayed()).toBe(true);
  });
  */

  afterAll(function(){
    console.log("ceph_pools -> ceph_pools.e2e.js");
  });
});