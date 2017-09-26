"use strict";

const helpers = require("../../common.js");
const CephNfsTable = require("./CephNfsTable");
const CephNfsForm = require("./CephNfsForm");
const CephNfsDetails = require("./CephNfsDetails");
const CephNfsManageService = require("./CephNfsManageService");

describe("ceph nfs", () => {

  let table = new CephNfsTable();
  let form = new CephNfsForm();
  let details = new CephNfsDetails();
  let manageService = new CephNfsManageService();

  beforeAll(() => {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_nfs")).click();
    table.removeExportsIfExists("/e2e/cfs-");
    manageService.startAllIfStopped();
  });

  it("should check the ceph NFS list export url", () => {
    helpers.checkLocation("ceph/nfs");
  });

  it("should check the ceph NFS add export url", () => {
    table.addExport();
    helpers.checkLocation("ceph/.*/nfs/add");
    helpers.leaveForm();
  });

  it("should add a export", () => {
    table.addExport();
    form.selectHost(1);
    form.selectFsal("CephFS");
    form.path.sendKeys("/e2e/cfs-add");
    form.tag.sendKeys("e2eTag");
    form.addClientsButton.click();
    form.clients.clear().sendKeys("192.168.0.10");
    form.selectClientsAccessType("MDONLY_RO");
    form.selectClientsSquash("None");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display added export details", () => {
    table.clickRowByPath("/e2e/cfs-add");
    expect(table.rows.get(0).getText()).toBe("/e2e/cfs-add");
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-add/);
    expect(details.fsal.getText()).toBe("CephFS");
    expect(details.path.getText()).toBe("/e2e/cfs-add");
    expect(details.tag.getText()).toBe("e2eTag");
    expect(details.nfsProtocol.get(0).getText()).toBe("NFSv3");
    expect(details.nfsProtocol.get(1).getText()).toBe("NFSv4");
    expect(details.pseudo.getText()).toBe("/cephfs/e2e/cfs-add");
    expect(details.accessType.getText()).toBe("RW - Allows all operations");
    expect(details.squash.getText()).toBe("None");
    expect(details.transportProtocol.get(0).getText()).toBe("TCP");
    expect(details.transportProtocol.get(1).getText()).toBe("UDP");
    expect(details.clientAccessType.get(0).getText())
      .toBe("MDONLY_RO - Does not allow read, write, or any operation that modifies " +
        "file attributes or directory content");
    expect(details.clientSquash.get(0).getText()).toBe("None");
    expect(details.mountCommand.getText()).toMatch("# mount.nfs .*:/cephfs/e2e/cfs-add /mnt");
  });

  it("should check the ceph NFS edit export url", () => {
    table.editExport("/e2e/cfs-add");
    helpers.checkLocation("ceph/.*/nfs/edit/.*/.*");
    helpers.leaveForm();
  });

  it("should edit export", () => {
    table.editExport("/e2e/cfs-add");
    form.path.clear().sendKeys("/e2e/cfs-edit");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display edited export details", () => {
    table.clickRowByPath("/e2e/cfs-edit");
    expect(table.rows.get(0).getText()).toBe("/e2e/cfs-edit");
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-edit/);
    expect(details.fsal.getText()).toBe("CephFS");
    expect(details.path.getText()).toBe("/e2e/cfs-edit");
    expect(details.tag.getText()).toBe("e2eTag");
    expect(details.nfsProtocol.get(0).getText()).toBe("NFSv3");
    expect(details.nfsProtocol.get(1).getText()).toBe("NFSv4");
    expect(details.pseudo.getText()).toBe("/cephfs/e2e/cfs-edit");
    expect(details.accessType.getText()).toBe("RW - Allows all operations");
    expect(details.squash.getText()).toBe("None");
    expect(details.transportProtocol.get(0).getText()).toBe("TCP");
    expect(details.transportProtocol.get(1).getText()).toBe("UDP");
    expect(details.clientAccessType.get(0).getText())
      .toBe("MDONLY_RO - Does not allow read, write, or any operation that modifies " +
        "file attributes or directory content");
    expect(details.clientSquash.get(0).getText()).toBe("None");
    expect(details.mountCommand.getText()).toMatch("# mount.nfs .*:/cephfs/e2e/cfs-edit /mnt");
  });

  it("should check the ceph NFS clone export url", () => {
    table.cloneExport("/e2e/cfs-edit");
    helpers.checkLocation("ceph/.*/nfs/clone/.*/.*");
    helpers.leaveForm();
  });

  it("should clone export", () => {
    table.cloneExport("/e2e/cfs-edit");
    form.path.clear().sendKeys("/e2e/cfs-clone");
    form.tag.clear().sendKeys("e2eTagClone");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display cloned target details", () => {
    table.clickRowByPath("/e2e/cfs-clone");
    expect(table.rows.get(0).getText()).toBe("/e2e/cfs-clone");
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:\/e2e\/cfs-clone/);
    expect(details.fsal.getText()).toBe("CephFS");
    expect(details.path.getText()).toBe("/e2e/cfs-clone");
    expect(details.tag.getText()).toBe("e2eTagClone");
    expect(details.nfsProtocol.get(0).getText()).toBe("NFSv3");
    expect(details.nfsProtocol.get(1).getText()).toBe("NFSv4");
    expect(details.pseudo.getText()).toBe("/cephfs/e2e/cfs-clone");
    expect(details.accessType.getText()).toBe("RW - Allows all operations");
    expect(details.squash.getText()).toBe("None");
    expect(details.transportProtocol.get(0).getText()).toBe("TCP");
    expect(details.transportProtocol.get(1).getText()).toBe("UDP");
    expect(details.clientAccessType.get(0).getText())
      .toBe("MDONLY_RO - Does not allow read, write, or any operation that modifies file " +
        "attributes or directory content");
    expect(details.clientSquash.get(0).getText()).toBe("None");
    expect(details.mountCommand.getText()).toMatch("# mount.nfs .*:/cephfs/e2e/cfs-clone /mnt");
  });

  it("should remove export", () => {
    table.removeExport("/e2e/cfs-edit");
    table.filterInput.clear().sendKeys("/e2e/cfs-edit");
    expect(table.rows.get(0).isPresent()).toBe(false);
    table.filterInput.clear();
    table.removeExport("/e2e/cfs-clone");
    table.filterInput.clear().sendKeys("/e2e/cfs-clone");
    expect(table.rows.get(0).isPresent()).toBe(false);
    table.filterInput.clear();
  });

  afterEach(() => {
    table.filterInput.clear();
  });

  afterAll(() => {
    console.log("ceph_nfs -> ceph_nfs_crud.e2e.js");
  });

});
