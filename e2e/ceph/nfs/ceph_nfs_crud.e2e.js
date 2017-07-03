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
    table.removeExportsIfExists('/e2e/cfs-');
    manageService.startAllIfStopped();
  });

  it('should check the ceph NFS list export url', function(){
    expect(browser.getCurrentUrl()).toContain('/ceph/nfs');
  });

  it('should check the ceph NFS add export url', function(){
    table.addExport();
    expect(browser.getCurrentUrl()).toMatch('/ceph/.*/nfs/add');
    helpers.leaveForm();
  });

  it('should add a export', function(){
    table.addExport();
    form.selectHost(1);
    form.selectFsal('CephFS');
    form.path.sendKeys('/e2e/cfs-add');
    form.tag.sendKeys('e2eTag');
    form.addClientsButton.click();
    form.clients.clear().sendKeys('192.168.0.10');
    form.selectClientsAccessType('MDONLY_RO');
    form.selectClientsSquash('None');
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should display added export details', function(){
    table.clickRowByPath('/e2e/cfs-add');
    expect(table.rows.get(0).getText()).toBe('/e2e/cfs-add');
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-add/);
    expect(details.fsal.getText()).toBe('CephFS');
    expect(details.path.getText()).toBe('/e2e/cfs-add');
    expect(details.tag.getText()).toBe('e2eTag');
    expect(details.nfsProtocol.get(0).getText()).toBe('NFSv3');
    expect(details.nfsProtocol.get(1).getText()).toBe('NFSv4');
    expect(details.pseudo.getText()).toBe('/cephfs/e2e/cfs-add');
    expect(details.accessType.getText()).toBe('RW - Allows all operations');
    expect(details.squash.getText()).toBe('None');
    expect(details.transportProtocol.get(0).getText()).toBe('TCP');
    expect(details.transportProtocol.get(1).getText()).toBe('UDP');
    expect(details.clientAccessType.get(0).getText())
      .toBe('MDONLY_RO - Does not allow read, write, or any operation that modifies file attributes or directory content');
    expect(details.clientSquash.get(0).getText()).toBe('None');
    expect(details.mountCommand.getText()).toMatch('# mount.nfs .*:/cephfs/e2e/cfs-add /mnt');
  });

  it('should check the ceph NFS edit export url', function(){
    table.editExport('/e2e/cfs-add');
    expect(browser.getCurrentUrl()).toMatch('/ceph/.*/nfs/edit/.*/.*');
    helpers.leaveForm();
  });

  it('should edit export', function(){
    table.editExport('/e2e/cfs-add');
    form.path.clear().sendKeys('/e2e/cfs-edit');
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should display edited export details', function(){
    table.clickRowByPath('/e2e/cfs-edit');
    expect(table.rows.get(0).getText()).toBe('/e2e/cfs-edit');
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-edit/);
    expect(details.fsal.getText()).toBe('CephFS');
    expect(details.path.getText()).toBe('/e2e/cfs-edit');
    expect(details.tag.getText()).toBe('e2eTag');
    expect(details.nfsProtocol.get(0).getText()).toBe('NFSv3');
    expect(details.nfsProtocol.get(1).getText()).toBe('NFSv4');
    expect(details.pseudo.getText()).toBe('/cephfs/e2e/cfs-edit');
    expect(details.accessType.getText()).toBe('RW - Allows all operations');
    expect(details.squash.getText()).toBe('None');
    expect(details.transportProtocol.get(0).getText()).toBe('TCP');
    expect(details.transportProtocol.get(1).getText()).toBe('UDP');
    expect(details.clientAccessType.get(0).getText())
      .toBe('MDONLY_RO - Does not allow read, write, or any operation that modifies file attributes or directory content');
    expect(details.clientSquash.get(0).getText()).toBe('None');
    expect(details.mountCommand.getText()).toMatch('# mount.nfs .*:/cephfs/e2e/cfs-edit /mnt');
  });

  it('should check the ceph NFS clone export url', function(){
    table.cloneExport('/e2e/cfs-edit');
    expect(browser.getCurrentUrl()).toMatch('/ceph/.*/nfs/clone/.*/.*');
    helpers.leaveForm();
  });

  it('should clone export', function(){
    table.cloneExport('/e2e/cfs-edit');
    form.path.clear().sendKeys('/e2e/cfs-clone');
    form.tag.clear().sendKeys('e2eTagClone');
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it('should display cloned target details', function(){
    table.clickRowByPath('/e2e/cfs-clone');
    expect(table.rows.get(0).getText()).toBe('/e2e/cfs-clone');
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-clone/);
    expect(details.fsal.getText()).toBe('CephFS');
    expect(details.path.getText()).toBe('/e2e/cfs-clone');
    expect(details.tag.getText()).toBe('e2eTagClone');
    expect(details.nfsProtocol.get(0).getText()).toBe('NFSv3');
    expect(details.nfsProtocol.get(1).getText()).toBe('NFSv4');
    expect(details.pseudo.getText()).toBe('/cephfs/e2e/cfs-clone');
    expect(details.accessType.getText()).toBe('RW - Allows all operations');
    expect(details.squash.getText()).toBe('None');
    expect(details.transportProtocol.get(0).getText()).toBe('TCP');
    expect(details.transportProtocol.get(1).getText()).toBe('UDP');
    expect(details.clientAccessType.get(0).getText())
      .toBe('MDONLY_RO - Does not allow read, write, or any operation that modifies file attributes or directory content');
    expect(details.clientSquash.get(0).getText()).toBe('None');
    expect(details.mountCommand.getText()).toMatch('# mount.nfs .*:/cephfs/e2e/cfs-clone /mnt');
  });

  it('should remove export', function(){
    table.removeExport('/e2e/cfs-edit');
    table.filterInput.clear().sendKeys('/e2e/cfs-edit');
    expect(table.rows.get(0).isPresent()).toBe(false);
    table.filterInput.clear();
    table.removeExport('/e2e/cfs-clone');
    table.filterInput.clear().sendKeys('/e2e/cfs-clone');
    expect(table.rows.get(0).isPresent()).toBe(false);
    table.filterInput.clear();
  });

  afterEach(function(){
    table.filterInput.clear();
  });

  afterAll(function(){
    console.log('ceph_nfs -> ceph_nfs_crud.e2e.js');
  });

});
