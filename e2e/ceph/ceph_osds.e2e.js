var helpers = require('../common.js');

describe('should test the ceph osd panel', function(){

  var cephMenu = element(by.css('.tc_menuitem_ceph > a'));
  var cephOSDs = element(by.css('.tc_submenuitem_ceph_osds'));
  var selectCluster = element(by.css('#cluster-selection option:nth-child(2)'));



  beforeAll(function(){
    helpers.login();
    cephMenu.click();
    cephOSDs.click();
  });

  var tableHeaders = [
    'Name',
    'Hostname',
    'Status',
    'Crush Weight',
    'Type',
  ];

  it('should check the ceph OSDs url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/osds');
  });

  it('should select a cluster', function(){
    selectCluster.click();
  });

  it('should display the ceph OSD table after selecting a cluster', function(){
    expect(element(by.css('.tc_cephOsdTable')).isDisplayed()).toBe(true);
  });

  it('should display the following table headers', function(){
    for(tableHeader in tableHeaders){
      expect(element(by.cssContainingText('th', tableHeaders[tableHeader])).isDisplayed()).toBe(true);
      //check: console.log(tableHeaders[tableHeader]);
    }
  });

  it('should have at least one ceph osd table entry', function(){
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

  it('should still have the cluster selected and display OSDs when switching between panels', function(){
    element(by.css('ul .tc_menuitem_pools > a')).click();
    expect(browser.getCurrentUrl()).toContain('/#/pools');
    cephMenu.click();
    cephOSDs.click();
    expect(browser.getCurrentUrl()).toContain('/ceph/osds');
    expect(element(by.id('cluster-selection')).getText()).toContain('ceph');
    console.log(element(by.id('cluster-selection')).getText());
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });

});

