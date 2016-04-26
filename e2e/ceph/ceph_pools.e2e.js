var helpers = require('../common.js');

describe('should test the ceph pools panel', function(){

  var cephMenu = element(by.css('.tc_menuitem_ceph > a'));
  var cephPool = element(by.css('.tc_submenuitem_ceph_pools'));
  var selectCluster = element(by.css('#cluster-selection option:nth-child(2)'));
  var statusTab = element(by.css('.tc_statusTab'));
  var cacheTieringTab = element(by.css('.tc_cacheTieringTab'));


  beforeAll(function(){
    helpers.login();
    cephMenu.click();
    cephPool.click();
    selectCluster.click();
  });

  var tableHeaders = [
    'Name',
    'Cluster',
    'ID',
    'Size',
    'Used',
    'Placement groups',
    'Replica size',
    'Erasure code profile',
    'Type',
    'Crush ruleset'
  ];

  it('should check the ceph pool url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/pools');
  });

  it('should display the ceph pools table', function(){
    expect(element(by.css('.tc_cephPoolTable')).isDisplayed()).toBe(true);
  });

  it('should display the following table headers', function(){
    for(tableHeader in tableHeaders){
      expect(element(by.cssContainingText('th', tableHeaders[tableHeader])).isDisplayed()).toBe(true);
      //check: console.log(tableHeaders[tableHeader]);
    }
  });

  it('should have at least one ceph pools table entry', function(){
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should have a status tab when selecting a pool', function(){
    //choose first element in ceph pools list
    element.all(by.binding('row.name')).get(0).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/pools/status#more');

    expect(statusTab.isDisplayed()).toBe(true);
    statusTab.click();
    browser.sleep(400);
    //check for tab content
    expect(element(by.cssContainingText('dt', 'Placement Groups:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'Cluster ID:')).isDisplayed()).toBe(true);
  });

  it('should have a cache tiering tab when selecting a pool', function(){
    expect(cacheTieringTab.isDisplayed()).toBe(true);
    cacheTieringTab.click();
    browser.sleep(400);
    //check for tab content
    expect(element(by.cssContainingText('dt', 'tier_of:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'target_max_bytes:')).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    console.log("ceph_pools -> ceph_pools.e2e.js");
  });
});