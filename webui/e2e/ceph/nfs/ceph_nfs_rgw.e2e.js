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
    helpers.setLocation("ceph/nfs");
    table.removeExportsIfExists("e2e-rgw-");
    manageService.startAllIfStopped();
  });

  it("should add an export (RGW)", () => {
    table.addExport();
    form.selectHost(1);
    form.selectFsal("Object Gateway");
    form.bucket.clear().sendKeys("e2e-rgw-add");
    form.selectRgwUser("admin");
    form.tag.clear().sendKeys("e2eTagRgw");
    form.addClientsButton.click();
    form.clients.clear().sendKeys("192.168.0.10");
    form.selectClientsAccessType("MDONLY_RO");
    form.selectClientsSquash("None");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
    helpers.clear_search_for();
  });

  it("should display added export details (RGW)", () => {
    table.clickRowByPath("e2e-rgw-add");
    expect(table.rows.get(0).getText()).toBe("e2e-rgw-add");
    expect(table.detailsTab.isDisplayed()).toBe(false);
    expect(details.panelTitle.getText()).toMatch(/Details of .*:e2e-rgw-add/);
    expect(details.fsal.getText()).toBe("Object Gateway");
    expect(details.path.getText()).toBe("e2e-rgw-add");
    expect(details.tag.getText()).toBe("e2eTagRgw");
    expect(details.nfsProtocol.get(0).getText()).toBe("NFSv3");
    expect(details.nfsProtocol.get(1).getText()).toBe("NFSv4");
    expect(details.pseudo.getText()).toMatch(/.*e2e-rgw-add/);
    expect(details.accessType.getText()).toBe("RW - Allows all operations");
    expect(details.squash.getText()).toBe("None");
    expect(details.transportProtocol.get(0).getText()).toBe("TCP");
    expect(details.transportProtocol.get(1).getText()).toBe("UDP");
    expect(details.clientAccessType.get(0).getText())
      .toBe("MDONLY_RO - Does not allow read, write, or any operation that modifies file " +
        "attributes or directory content");
    expect(details.clientSquash.get(0).getText()).toBe("None");
    expect(details.mountCommand.getText()).toMatch("# mount.nfs .*:/.*/e2e-rgw-add /mnt");
  });

  it("should check the bucket can't be deleted because it's referenced", () => {
    helpers.setLocation("ceph/rgw/buckets");
    helpers.search_for("e2e-rgw-add");
    var bucket = helpers.get_list_element("e2e-rgw-add").click();
    expect(bucket.isDisplayed()).toBe(true);
    element(by.css(".tc_menudropdown")).click();
    expect(helpers.hasClass(element(by.css(".tc_deleteItem")), "disabled")).toBe(true);
    helpers.setLocation("ceph/nfs");
  });

  it("should remove export (RGW)", () => {
    table.removeExport("e2e-rgw-add");
    helpers.search_for("e2e-rgw-add");
    expect(table.rows.get(0).isPresent()).toBe(false);
    helpers.clear_search_for();
  });

  afterAll(() => {
    console.log("ceph_nfs -> ceph_nfs_rgw.e2e.js");
  });

});
