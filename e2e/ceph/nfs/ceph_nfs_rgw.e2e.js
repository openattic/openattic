'use strict';

var helpers = require('../../common.js');
var CephNfsTable = require('./CephNfsTable');
var CephNfsForm = require('./CephNfsForm');
var CephNfsDetails = require('./CephNfsDetails');
var CephNfsManageService = require('./CephNfsManageService');

describe('ceph nfs', function(){

  var table = new CephNfsTable();
  var form = new CephNfsForm();
  var details = new CephNfsDetails();
  var manageService = new CephNfsManageService();

  beforeAll(function(){
    helpers.login();
    element(by.css('.tc_menuitem_ceph_nfs')).click();
    table.removeExportsIfExists('e2e-rgw-');
    manageService.startAllIfStopped();
  });

  it('should add a export', function(){
    table.addExport();
    form.selectHost(1);
    form.selectFsal('Object Gateway');
    form.bucket.sendKeys('e2e-rgw-add');
    form.selectRgwUser('admin');
    form.tag.clear().sendKeys('e2eTagRgw');
    form.addClientsButton.click();
    form.clients.clear().sendKeys('192.168.0.10');
    form.selectClientsAccessType('MDONLY_RO');
    form.selectClientsSquash('None');
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should display added export details', function(){
    table.clickRowByPath('e2e-rgw-add');
    expect(table.rows.get(0).getText()).toBe('e2e-rgw-add');
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:e2e-rgw-add/);
    expect(details.fsal.getText()).toBe('Object Gateway');
    expect(details.path.getText()).toBe('e2e-rgw-add');
    expect(details.tag.getText()).toBe('e2eTagRgw');
    expect(details.nfsProtocol.get(0).getText()).toBe('NFSv3');
    expect(details.nfsProtocol.get(1).getText()).toBe('NFSv4');
    expect(details.pseudo.getText()).toMatch(/.*e2e-rgw-add/);
    expect(details.accessType.getText()).toBe('RW - Allows all operations');
    expect(details.squash.getText()).toBe('None');
    expect(details.transportProtocol.get(0).getText()).toBe('TCP');
    expect(details.transportProtocol.get(1).getText()).toBe('UDP');
    expect(details.clientAccessType.get(0).getText())
      .toBe('MDONLY_RO - Does not allow read, write, or any operation that modifies file attributes or directory content');
    expect(details.clientSquash.get(0).getText()).toBe('None');
    expect(details.mountCommand.getText()).toMatch('# mount.nfs .*:/.*/e2e-rgw-add /mnt');
  });

  it('should remove export', function(){
    table.removeExport('e2e-rgw-add');
    table.filterInput.clear().sendKeys('e2e-rgw-add');
    expect(table.rows.get(0).isPresent()).toBe(false);
    table.filterInput.clear();
  });

  afterEach(function(){
    table.filterInput.clear();
  });

  afterAll(function(){
    console.log('ceph_nfs -> ceph_nfs_rgw.e2e.js');
  });

});
