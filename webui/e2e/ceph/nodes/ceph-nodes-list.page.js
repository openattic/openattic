"use strict";

let cephNodesListPage = function () {
  this.menu = element(by.css(".tc_menuitem_ceph_nodes"));
  this.table = element(by.css(".tc_cephNodesTable"));

  this.thHostname = element(by.cssContainingText("th", "Hostname"));
  this.thAddresses = element(by.cssContainingText("th", "Addresses"));
  this.thCluster = element(by.cssContainingText("th", "Cluster"));
  this.thRoles = element(by.cssContainingText("th", "Roles"));
  this.thKeyStatus = element(by.cssContainingText("th", "Key status"));

  this.allTDs = element.all(by.css("td"));

  this.detailsTab = element(by.css(".tc_detailsTab"));
  this.details = element(by.css(".tc_details"));

  this.statisticsTab = element(by.css(".tc_statisticsTab"));
  this.statistics = element(by.css(".grafana"));

  this.dtAddresses = element(by.cssContainingText("dt", "Addresses:"));
  this.dtCluster = element(by.cssContainingText("dt", "Cluster:"));
  this.dtKeystatus = element(by.cssContainingText("dt", "Key status:"));
  this.dtOSDs = element(by.cssContainingText("dt", "OSDs:"));
  this.dtRoles = element(by.cssContainingText("dt", "Roles:"));
};

module.exports = cephNodesListPage;
