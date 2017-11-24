"use strict";

var helpers = require("../../common.js");
var SettingsForm = require("./SettingsForm");

describe("settings form", function () {

  var form = new SettingsForm();

  var initialSettings = {
    deepsea: {},
    grafana: {},
    ceph: {}
  };

  beforeAll(function () {
    helpers.login();
    helpers.setLocation("settings");
    form.saltApiHost.getAttribute("value").then(function (value) {
      initialSettings.deepsea.host = value;
    });
    form.saltApiPort.getAttribute("value").then(function (value) {
      initialSettings.deepsea.port = value;
    });
    form.saltApiEauth.getAttribute("value").then(function (value) {
      initialSettings.deepsea.eauth = value.replace("string:", "");
    });
    form.saltApiUsername.getAttribute("value").then(function (value) {
      initialSettings.deepsea.username = value;
    });
    form.saltApiSharedSecret.getAttribute("value").then(function (value) {
      initialSettings.deepsea.shared_secret = value;
    });
    form.grafanaHost.getAttribute("value").then(function (value) {
      initialSettings.grafana.host = value;
    });
    form.grafanaPort.getAttribute("value").then(function (value) {
      initialSettings.grafana.port = value;
    });
    form.grafanaUsername.getAttribute("value").then(function (value) {
      initialSettings.grafana.username = value;
    });
    form.grafanaPassword.getAttribute("value").then(function (value) {
      initialSettings.grafana.password = value;
    });
    form.grafanaUseSSL.getAttribute("checked").then(function (value) {
      initialSettings.grafana.use_ssl = value === "true";
    });
    form.cephClusterKeyringFile.getAttribute("value").then(function (value) {
      initialSettings.ceph.keyringFile = value;
    });
    form.cephClusterKeyringUser.getAttribute("value").then(function (value) {
      initialSettings.ceph.keyringUser = value;
    });
  });

  it("should save settings", function () {
    form.saltApiHost.clear().sendKeys("e2e-salt-host");
    form.saltApiPort.clear().sendKeys("8001");
    form.saltApiUsername.clear().sendKeys("e2e-username");

    form.checkManagedByDeepSea(false);
    form.rgwHost.clear().sendKeys("e2e-rgw-host");
    form.rgwPort.clear().sendKeys("8002");
    form.rgwAccessKey.clear().sendKeys("e2e-access-key");
    form.rgwSecretKey.clear().sendKeys("e2e-secret-key");
    form.rgwAdminUser.clear().sendKeys("e2e-admin-user");
    form.rgwAdminResourcePath.clear().sendKeys("e2e-admin-path");
    form.checkRgwUseSSL(true);

    form.grafanaHost.clear().sendKeys("e2e-grafana-host");
    form.grafanaPort.clear().sendKeys("8003");
    form.grafanaUsername.clear().sendKeys("e2e-grafana-user");
    form.grafanaPassword.clear().sendKeys("e2e-grafana-pass");
    form.checkGrafanaUseSSL(true);

    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
    helpers.waitForElementRemoval("submit");
  });

  it("should get saved settings", function () {
    browser.refresh();

    expect(form.saltApiHost.getAttribute("value")).toEqual("e2e-salt-host");
    expect(form.saltApiPort.getAttribute("value")).toEqual("8001");
    expect(form.saltApiUsername.getAttribute("value")).toEqual("e2e-username");

    expect(form.rgwManagedByDeepSea.isSelected()).toBe(false);
    expect(form.rgwHost.getAttribute("value")).toEqual("e2e-rgw-host");
    expect(form.rgwPort.getAttribute("value")).toEqual("8002");
    expect(form.rgwAccessKey.getAttribute("value")).toEqual("e2e-access-key");
    expect(form.rgwSecretKey.getAttribute("value")).toEqual("e2e-secret-key");
    expect(form.rgwAdminUser.getAttribute("value")).toEqual("e2e-admin-user");
    expect(form.rgwAdminResourcePath.getAttribute("value")).toEqual("e2e-admin-path");
    expect(form.rgwUseSSL.isSelected()).toBe(true);

    expect(form.grafanaHost.getAttribute("value")).toEqual("e2e-grafana-host");
    expect(form.grafanaPort.getAttribute("value")).toEqual("8003");
    expect(form.grafanaUsername.getAttribute("value")).toEqual("e2e-grafana-user");
    expect(form.grafanaPassword.getAttribute("value")).toEqual("e2e-grafana-pass");
    expect(form.grafanaUseSSL.isSelected()).toBe(true);
  });

  it("should not save invalid ceph config", function () {
    form.cephClusterKeyringFile.clear().sendKeys("/e2e-invalid-file");
    form.submitButton.click();
    browser.refresh();
    expect(form.cephClusterKeyringFile.getAttribute("value")).toEqual(initialSettings.ceph.keyringFile);
  });

  it("should restore initial settings", function () {
    form.saltApiHost.clear().sendKeys(initialSettings.deepsea.host);
    form.saltApiPort.clear().sendKeys(initialSettings.deepsea.port);
    form.selectEauth(initialSettings.deepsea.eauth);
    form.saltApiUsername.clear().sendKeys(initialSettings.deepsea.username);
    form.saltApiSharedSecret.clear().sendKeys(initialSettings.deepsea.shared_secret);
    helpers.waitForElementVisible(form.saltApiConnectionSuccess);
    form.checkManagedByDeepSea(true);
    form.grafanaHost.clear().sendKeys(initialSettings.grafana.host);
    form.grafanaPort.clear().sendKeys(initialSettings.grafana.port);
    form.grafanaUsername.clear().sendKeys(initialSettings.grafana.username);
    form.grafanaPassword.clear().sendKeys(initialSettings.grafana.password);
    form.checkGrafanaUseSSL(initialSettings.grafana.use_ssl);
    form.cephClusterKeyringFile.clear().sendKeys(initialSettings.ceph.keyringFile);
    form.cephClusterKeyringUser.clear().sendKeys(initialSettings.ceph.keyringUser);
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
    helpers.waitForElementRemoval("submit");
  });

  it("should get restored initial settings", function () {
    browser.refresh();
    expect(form.saltApiHost.getAttribute("value")).toEqual(initialSettings.deepsea.host);
    expect(form.saltApiPort.getAttribute("value")).toEqual(initialSettings.deepsea.port);
    expect(form.saltApiUsername.getAttribute("value")).toEqual(initialSettings.deepsea.username);
    expect(form.rgwManagedByDeepSea.isSelected()).toBe(true);
    expect(form.grafanaHost.getAttribute("value")).toEqual(initialSettings.grafana.host);
    expect(form.grafanaPort.getAttribute("value")).toEqual(initialSettings.grafana.port);
    expect(form.grafanaUsername.getAttribute("value")).toEqual(initialSettings.grafana.username);
    expect(form.grafanaPassword.getAttribute("value")).toEqual(initialSettings.grafana.password);
    expect(form.grafanaUseSSL.isSelected()).toBe(initialSettings.grafana.use_ssl);
    expect(form.cephClusterKeyringFile.getAttribute("value")).toEqual(initialSettings.ceph.keyringFile);
    expect(form.cephClusterKeyringUser.getAttribute("value")).toEqual(initialSettings.ceph.keyringUser);
  });

  afterAll(function () {
    console.log("settings -> settings_crud.e2e.js");
  });
});
