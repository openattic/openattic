"use strict";

(function () {
  var cephOsdsCommon = {
    //ceph_osds_scrub.e2e.js
    cephOSDs: element(by.css(".tc_menuitem_ceph_osds")),
    performTaskBtn: element(by.css(".tc_scrub_toggle")),
    scrubLi: element(by.css(".tc_scrub_li")),
    deepScrubLi: element(by.css(".tc_deep_scrub_li")),
    scrubModal: element(by.css("ceph-osd-scrub-modal")),
    submitBtn: element(by.css(".tc_submitButton")),
    allTd: element.all(by.css("td"))
  };

  module.exports = cephOsdsCommon;
}());
