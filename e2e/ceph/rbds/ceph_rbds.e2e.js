var helpers = require('../../common.js');
var rbdCommons = require('./cephRbdCommon.js');

describe('should test the ceph rbd panel', function(){
  var rbdProperties = new rbdCommons();

  beforeAll(function(){
    helpers.login();
    rbdProperties.cephMenu.click();
    rbdProperties.cephRBDs.click();
  });

  rbdProperties.useWriteablePools(function(cluster, pool){
    it('should create an default rbd on ' + pool.name + ' in cluster ' + cluster.name, function(){
      rbdProperties.selectClusterAndPool(cluster, pool);
      var rbdName = 'e2e_' + pool.name + '_' + cluster.name;
      rbdProperties.createRbd(rbdName);
    });
  });

  it('should check the ceph RBDs url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds');
  });

  it('should display the ceph RBD table after selecting a cluster', function(){
    expect(element(by.css('.tc_cephRbdTable')).isDisplayed()).toBe(true);
  });

  rbdProperties.tableHeaders.forEach(function(header){
    it('should ' + !header.displayed ? 'not ' : '' + 'display the following table header: ' + header.name, function(){
      expect(element(by.cssContainingText('th', header.name)).isDisplayed()).toBe(header.displayed);
    });
  });

  it('should have at least one ceph rbd table entry', function(){
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  /* TODO: Update the tests to use the configuration
  it('should select a cluster', function(){
    rbdProperties.selectCluster.click();
  });

  it('should still have the cluster selected and display RBDs when switching between panels', function(){
    element(by.css('ul .tc_menuitem_pools > a')).click();
    expect(browser.getCurrentUrl()).toContain('/#/pools');
    rbdProperties.cephMenu.click();
    rbdProperties.cephRBDs.click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds');
    expect(element(by.id('cluster-selection')).getText()).toContain('ceph (');
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should have a details tab when selecting a rbd', function(){
    element.all(by.binding('row.name')).get(0).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds/details#more');
    expect(element(by.css('.tc_detailsTab')).isDisplayed()).toBe(true);
  });
  */

  rbdProperties.detailAttributes.forEach(function(attribute){
    it('should check the content attribute "' + attribute + '" in the details tab when selecting a rbd', function(){
      element.all(by.binding('row.name')).get(0).click();
      expect(element(by.cssContainingText('dt', attribute + ':')).isDisplayed()).toBe(true);
    });
  });

  rbdProperties.useWriteablePools(function(cluster, pool){
    it('should delete the default rbd on ' + pool.name + ' in cluster ' + cluster.name, function(){
      rbdProperties.selectCluster(cluster);
      var rbdName = 'e2e_' + pool.name + '_' + cluster.name;
      rbdProperties.deleteRbd(rbdName);
    });
  });

  afterAll(function(){
    console.log('ceph_rbds -> ceph_rbds.e2e.js');
  });

});

