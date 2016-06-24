var helpers = require('../common.js');

describe('should test the ceph rbd panel', function(){

  var cephMenu = element(by.css('.tc_menuitem_ceph > a'));
  var cephRBDs = element(by.css('.tc_submenuitem_ceph_rbds'));
  var selectCluster = element(by.css('#cluster-selection option:nth-child(2)'));
  var attributes = [
    'Name',
    'Block name prefix',
    'Pool',
    'Size',
    'Used',
    'Free',
    'Number of objects',
    'Order'
  ];

  beforeAll(function(){
    helpers.login();
    cephMenu.click();
    cephRBDs.click();
  });

  var tableHeaders = [
    'Name',
    'Poolname',
    'Size',
    'Used',
    'Number of objects'
  ];

  it('should check the ceph RBDs url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds');
  });

  it('should select a cluster', function(){
    selectCluster.click();
  });

  it('should display the ceph RBD table after selecting a cluster', function(){
    expect(element(by.css('.tc_cephRbdTable')).isDisplayed()).toBe(true);
  });

  tableHeaders.forEach(function(tableHeader){
    it('should display the following table header: ' + tableHeader, function(){
      expect(element(by.cssContainingText('th', tableHeader)).isDisplayed()).toBe(true);
    });
  });

  it('should have at least one ceph rbd table entry', function(){
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should still have the cluster selected and display RBDs when switching between panels', function(){
    element(by.css('ul .tc_menuitem_pools > a')).click();
    expect(browser.getCurrentUrl()).toContain('/#/pools');
    cephMenu.click();
    cephRBDs.click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds');
    expect(element(by.id('cluster-selection')).getText()).toContain('ceph (');
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should have a details tab when selecting a rbd', function(){
    element.all(by.binding('row.name')).get(0).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rbds/details#more');
    expect(element(by.css('.tc_detailsTab')).isDisplayed()).toBe(true);
  });

  attributes.forEach(function(attribute){
    it('should check the content attribute "' + attribute + '" in the details tab when selecting a rbd', function(){
      element.all(by.binding('row.name')).get(0).click();
      expect(element(by.cssContainingText('dt', attribute + ':')).isDisplayed()).toBe(true);
    });
  });

  afterAll(function(){
    console.log('ceph_rbds -> ceph_rbds.e2e.js');
  });

});

