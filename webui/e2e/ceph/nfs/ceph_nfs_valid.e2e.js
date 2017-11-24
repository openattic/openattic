"use strict";

const helpers = require("../../common.js");
const CephNfsTable = require("./CephNfsTable");
const CephNfsForm = require("./CephNfsForm");

describe("ceph nfs", () => {

  let table = new CephNfsTable();
  let form = new CephNfsForm();

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/nfs");
    table.addExport();
  });

  it("should validate host", () => {
    form.selectHost(1);
    expect(form.hostRequired.isDisplayed()).toBe(false);

    form.selectHost(0);
    expect(form.hostRequired.isDisplayed()).toBe(true);
  });

  it("should validate fsal", () => {
    form.selectFsal("CephFS");
    expect(form.fsalRequired.isDisplayed()).toBe(false);

    form.selectFsal("-- Select the storage backend --");
    expect(form.fsalRequired.isDisplayed()).toBe(true);
  });

  it("should validate rgw user", () => {
    form.selectFsal("Object Gateway");

    form.selectRgwUserIndex(1);
    expect(form.rgwUserIdRequired.isDisplayed()).toBe(false);

    form.selectRgwUserIndex(0);
    expect(form.rgwUserIdRequired.isDisplayed()).toBe(true);
  });

  it("should validate path", () => {
    form.selectFsal("CephFS");

    form.path.clear().sendKeys("/").sendKeys(protractor.Key.TAB);
    expect(form.pathRequired.isDisplayed()).toBe(false);
    expect(form.newDirectoryInfo.isDisplayed()).toBe(false);

    form.path.clear().sendKeys("/e2e/valid-path-" + Date.now()).sendKeys(protractor.Key.TAB);
    expect(form.pathRequired.isDisplayed()).toBe(false);
    expect(form.newDirectoryInfo.isDisplayed()).toBe(true);

    form.path.clear().sendKeys(protractor.Key.TAB);
    expect(form.pathRequired.isDisplayed()).toBe(true);
    expect(form.newDirectoryInfo.isDisplayed()).toBe(false);
  });

  it("should validate bucket", () => {
    form.selectFsal("Object Gateway");
    form.selectRgwUserIndex(1);

    form.bucket.clear().sendKeys("valid-bucket-" + Date.now()).sendKeys(protractor.Key.TAB);
    expect(form.bucketRequired.isDisplayed()).toBe(false);
    expect(form.newBucketInfo.isDisplayed()).toBe(true);

    form.bucket.clear().sendKeys(protractor.Key.TAB);
    expect(form.bucketRequired.isDisplayed()).toBe(true);
    expect(form.newBucketInfo.isDisplayed()).toBe(false);
  });

  it("should validate protocols", () => {
    // unselect all
    form.protocolNfsv3.click();
    form.protocolNfsv4.click();
    expect(form.nfsProtocolRequired.isDisplayed()).toBe(true);

    // select only NFSv3
    form.protocolNfsv3.click();
    expect(form.nfsProtocolRequired.isDisplayed()).toBe(false);

    // select only NFSv4
    form.protocolNfsv3.click();
    form.protocolNfsv4.click();
    expect(form.nfsProtocolRequired.isDisplayed()).toBe(false);

    // select all
    form.protocolNfsv3.click();
    expect(form.nfsProtocolRequired.isDisplayed()).toBe(false);
  });

  it("should validate pseudo", () => {
    form.selectFsal("CephFS");

    form.pseudo.clear().sendKeys("/");
    expect(form.pseudoRequired.isDisplayed()).toBe(false);

    form.pseudo.clear();
    expect(form.pseudoRequired.isDisplayed()).toBe(true);
  });

  it("should validate access type", () => {
    form.selectAccessType("RW");
    expect(form.accessTypeRequired.isDisplayed()).toBe(false);

    form.selectAccessType("-- Select the access type --");
    expect(form.accessTypeRequired.isDisplayed()).toBe(true);
  });

  it("should validate squash", () => {
    form.selectSquash("Root");
    expect(form.squashRequired.isDisplayed()).toBe(false);

    form.selectSquash("-- Select what kind of user id squashing is performed --");
    expect(form.squashRequired.isDisplayed()).toBe(true);
  });

  it("should validate protocols", () => {
    // unselect all
    form.transportUDP.click();
    form.transportTCP.click();
    expect(form.transportProtocolRequired.isDisplayed()).toBe(true);

    // select only UDP
    form.transportUDP.click();
    expect(form.transportProtocolRequired.isDisplayed()).toBe(false);

    // select only TCP
    form.transportUDP.click();
    form.transportTCP.click();
    expect(form.transportProtocolRequired.isDisplayed()).toBe(false);

    // select all
    form.transportUDP.click();
    expect(form.transportProtocolRequired.isDisplayed()).toBe(false);
  });

  it("should validate clients", () => {
    form.addClientsButton.click();

    form.clients.clear().sendKeys("192.168.0.10, 192.168.1.0/8");
    expect(form.clientsRequired.isDisplayed()).toBe(false);
    expect(form.clientsInvalid.isDisplayed()).toBe(false);

    form.clients.clear();
    expect(form.clientsRequired.isDisplayed()).toBe(true);
    expect(form.clientsInvalid.isDisplayed()).toBe(false);

    form.clients.clear().sendKeys(",192.168.0.10");
    expect(form.clientsRequired.isDisplayed()).toBe(false);
    expect(form.clientsInvalid.isDisplayed()).toBe(true);
  });

  afterAll(() => {
    console.log("ceph_nfs -> ceph_nfs_valid.e2e.js");
  });

});
