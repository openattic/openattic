"use strict";

var helpers = require("../../common.js");

describe("General", function () {

  var oaLogo = element(by.css(".tc_logo_component a"));
  var menuItems = { //Put here the final menu order
    "dashboard": {"tagName": "dashboard"}, //has to be there
    "ceph_osds": {"tagName": "ceph-osd-list"},
    "ceph_rbds": {"tagName": "ceph-rbd-list"},
    "ceph_pools": {"tagName": "ceph-pools-list"},
    "ceph_nodes": {"tagName": "ceph-nodes-list"},
    "ceph_iscsi": {"tagName": "ceph-iscsi-list"},
    "ceph_nfs": {"tagName": "ceph-nfs-list"},
    "ceph_rgw": {},
    "ceph_crushmap": {"tagName": "ceph-crushmap"},
    "system": {}
  };
  var subMenusItems = [{
    name: "ceph_rgw",
    item: element(by.css(".tc_menuitem_ceph_rgw > a")),
    url: "ceph/rgw/",
    subitems: {
      users: element(by.css(".tc_submenuitem_ceph_rgw_users")),
      buckets: element(by.css(".tc_submenuitem_ceph_rgw_buckets"))
    },
    order: [
      "users",
      "buckets"
    ]
  }, {
    name: "system",
    item: element(by.css(".tc_menuitem_system > a")),
    url: "",
    subitems: {
      users: element(by.css(".tc_submenuitem_system_users")),
      settings: element(by.css(".tc_submenuitem_system_settings"))
    },
    order: [
      "users",
      "settings"
    ]
  }];

  var menuCheck = function (items) {
    var menuCount = 0;
    var pageMenuItems = element.all(by.css(".tc_menuitem > a"));
    var url;

    Object.keys(items).forEach(function (name) {
      var item = element(by.css(".tc_menuitem_" + name + " > a"));
      it("should have " + name + " into the right order", function () {
        if (item.isDisplayed()) {
          expect(item.getText()).toEqual(pageMenuItems.get(menuCount).getText());
          menuCount++;
        }
      });
      it("should click " + name + " and check the url", function () {
        if (item.isDisplayed() && items[name].hasOwnProperty("tagName")) {
          url = name.replace("_", "/");
          item.click();
          var viewElement = element(by.tagName(items[name].tagName));
          helpers.waitForElement(viewElement);
          helpers.checkLocation(url);
        }
      });
    });
  };

  var subitemCheck = function (subItems) {
    subItems.forEach(function (dropdown) {
      var subMenuItems = dropdown.item.all(by.xpath("..")).all(by.css("ul .tc_submenuitem"));
      var menuCount = 0;

      it("should have subitems under the " + dropdown.name + " menu item", function () {
        if (dropdown.item.isDisplayed()) {
          dropdown.item.click();
          expect(subMenuItems.count()).toBeGreaterThan(0);
        }
      });

      dropdown.order.forEach(function (item) {
        it("should have " + dropdown.name + " subitem " + item + " in the right order", function () {
          if (dropdown.item.isDisplayed()) {
            dropdown.item.click();
            expect(dropdown.subitems[item].getText()).toEqual(subMenuItems.get(menuCount).getText());
            menuCount++;
          }
        });
        it("should click " + dropdown.name + " subitem " + item + " and check the url", function () {
          if (dropdown.item.isDisplayed()) {
            browser.refresh();
            dropdown.item.click();
            dropdown.subitems[item].click();
            helpers.checkLocation(dropdown.url + item);
          }
        });
      });
    });
  };

  var notificationsCheck = function () {
    var apiRecorder = element(by.css(".tc_api-recorder"));
    var notificationIcon = element(by.css(".dropdown-notifications"));

    it("should have recent notifications", function () {
      apiRecorder.click();
      apiRecorder.click();
      notificationIcon.click();
      expect(element(by.css(".dropdown-notifications .notification")).isDisplayed()).toBe(true);
      notificationIcon.click();
    });

    it("should remove all recent notifications", function () {
      notificationIcon.click();
      element(by.css(".dropdown-toolbar-actions a")).click();
      notificationIcon.click();
      expect(element(by.css(".dropdown-notifications .notification")).isPresent()).toBe(false);
      expect(element(by.css(".dropdown-notifications .dropdown-footer")).isDisplayed()).toBe(true);
    });
  };

  beforeAll(function () {
    helpers.login();
  });

  it("should have a title", function () {
    expect(browser.getTitle()).toContain("openATTIC");
  });

  it("should show the name of the current user", function () {
    expect(element(by.css(".tc_usernameinfo")).getText()).toEqual("openattic");
  });

  /* Menuitems */
  menuCheck(menuItems);

  /* System and its subitems */
  subitemCheck(subMenusItems);

  notificationsCheck();

  it("should check if the openATTIC logo is visible", function () {
    expect(oaLogo.isDisplayed()).toBe(true);
  });

  it("should redirect to dashboard panel when clicking the openATTIC logo", function () {
    //click somewhere else to change the url
    element(by.css(".tc_menuitem_ceph_osds > a")).click();
    helpers.checkLocation("ceph/osds");
    oaLogo.click();
    helpers.checkLocation("dashboard");
  });

  afterAll(function () {
    console.log("general -> general.e2e.js");
  });
});
