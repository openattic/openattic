"use strict";

(function () {
  var cephNodesCommon = {
    //ceph_nodes_scrub.e2e.js
    cephNodes: element(by.css(".tc_menuitem_ceph_nodes")),
    performTaskBtn: element(by.css(".tc_scrub_toggle")),
    scrubLi: element(by.css(".tc_scrub_li")),
    deepScrubLi: element(by.css(".tc_deep_scrub_li")),
    scrubModal: element(by.css("ceph-nodes-scrub-modal")),
    submitBtn: element(by.css(".tc_submitButton")),
    allChecked: element.all(by.model("checked"))
  };

  module.exports = cephNodesCommon;
}());
