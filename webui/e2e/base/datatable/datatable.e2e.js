"use strict";

var helpers = require("../../common.js");

var columnListButton = element(by.css(".tc_columnBtn"));
var typeListItem = element(by.cssContainingText(".tc_columnItem", "Type"));
var typeColumn = element(by.cssContainingText("th", "Type"));
var searchField = element(by.model("filterConfig.search"));
var entriesDropDown = element(by.css(".tc_entries_dropdown"));
var poolRowElements = element.all(by.css(".tc_cephPoolTable tbody tr"));

var selectAllCheckbox = element(by.model("selection.checkAll"));
var allSelected = element(by.css(".oadatatablecheckbox .ng-not-empty"));
var noneSelected = element(by.css(".oadatatablecheckbox .ng-empty"));

describe("Should test oadatatable and its options", function () {

  beforeAll(function () {
    helpers.login();
    browser.executeScript("window.localStorage.clear();");
  });

  beforeEach(function () {
    helpers.setLocation("ceph/pools");
  });

  var list = [
    "Name",
    "ID",
    "Used",
    "Applications",
    "Placement groups",
    "Replica size",
    "Erasure code profile",
    "Last Change",
    "Type",
    "Crush ruleset",
    "Compression mode",
    "Compression algorithm",
    "Compression min. blob size",
    "Compression max. blob size",
    "Compression required ratio"
  ];

  it("should display the datatable header", function () {
    expect(element(by.css(".dataTables_header")).isDisplayed()).toBe(true);
  });

  it("should display the datatable footer", function () {
    expect(element(by.css(".dataTables_footer")).isDisplayed()).toBe(true);
  });

  it("should display an input search field", function () {
    expect(element(by.model("filterConfig.search")).isDisplayed()).toBe(true);
  });

  it("should have a reload button", function () {
    expect(element(by.css(".tc_refreshBtn")).isDisplayed()).toBe(true);
  });

  it("should display the column button", function () {
    expect(columnListButton.isDisplayed()).toBe(true);
  });

  it("should display datatable info (Showing x to x of x items", function () {
    expect(element(by.css(".dataTables_info")).isDisplayed()).toBe(true);
  });

  it("should check the content of dataTables_info", function () {
    expect(element(by.css(".dataTables_info")).getText()).toContain("Showing", "to", "of", "items");
  });

  it("should have pagination", function () {
    expect(element(by.css(".dataTables_paginate")).isDisplayed()).toBe(true);
  });

  it("should have oadatatable actions (btn)", function () {
    expect(element(by.css(".oadatatableactions")).isDisplayed()).toBe(true);
  });

  it("should have a menu dropdown", function () {
    expect(element(by.css(".tc_menudropdown")).isDisplayed()).toBe(true);
  });

  it('should display "of <page>"', function () {
    expect(element(by.css(".paginate_of")).isDisplayed()).toBe(true);
  });

  it("should display pagination input field", function () {
    expect(element(by.css(".paginate-input")).isDisplayed()).toBe(true);
  });

  it("should display the current page number", function () {
    expect(element(by.model("displayNumber")).isDisplayed()).toBe(true);
  });

  it("should display page 1", function () {
    element(by.model("displayNumber")).getAttribute("value").then(function (pageNumber) {
      expect(pageNumber).toBe("1");
    });
  });

  it("should check if there are any checkboxes at all", function () {
    expect(element.all(by.model("checked")).get(0).isDisplayed()).toBe(true);
  });

  it('should have a "select all" checkbox', function () {
    expect(selectAllCheckbox.isDisplayed()).toBe(true);
  });

  it("should select the oadatatablecheckbox (selects all elements)", function () {
    selectAllCheckbox.click();
    browser.sleep(600);
    expect(selectAllCheckbox.isSelected()).toBe(true);
  });

  it("should have selected all elements", function () {
    expect(allSelected.isDisplayed()).toBe(true);
    expect(noneSelected.isPresent()).toBe(false);
  });

  it("should deselect the oadatatablecheckbox again", function () {
    selectAllCheckbox.click();
    expect(selectAllCheckbox.isSelected()).toBe(false);
  });

  it("should have no elements selected anymore", function () {
    expect(noneSelected.isDisplayed()).toBe(true);
    expect(allSelected.isPresent()).toBe(false);
  });

  it("should display enabled/disabled columns when clicked", function () {
    columnListButton.click();
    browser.sleep(400);
    element.all(by.repeater("(text, checked) in columns"))
      .then(function (options) {
        var a = 0;
        for (var option in options) {
          options[option].element(by.css(".tc_columnItem")).evaluate("text").then(function (label) {
            expect(label).toEqual(list[a]);
            //check: console.log("label: " + label + " list: " + list[a]);
            a++;
          });
        }
      });
  });

  it("should no longer display a column when deselected", function () {
    // Clear cache
    browser.executeScript("window.localStorage.clear();");
    browser.refresh();
    columnListButton.click();
    typeListItem.click();
    expect(typeColumn.isDisplayed()).toBe(false);
  });

  it("should no longer display a column when deselected after reloading the page", function () {
    browser.refresh();
    expect(typeColumn.isDisplayed()).toBe(false);
  });

  it("should put the type column back in", function () {
    columnListButton.click();
    typeListItem.click();
    expect(typeColumn.isDisplayed()).toBe(true);
  });

  /**
   * Disable each column, in order to disable them all.
   * The columns are counted and are expected to have at least two columns.
   * The check box column and the last column that was tried to disable.
   */
  it("should not allow to disable all columns", function () {
    columnListButton.click();
    element.all(by.repeater("(text, checked) in columns"))
      .then(function (columns) {
        columns.forEach(function (column) {
          column.click();
          columnListButton.click();
          element.all(by.css(".datatable th")).filter(function (col) {
            return col.isDisplayed();
          }).count().then(function (count) {
            expect(count >= 2).toBe(true);
          });
        });
      }).then(function () {
        browser.executeScript("window.localStorage.clear();"); // Reset local cache.
        browser.refresh();
      });
  });

  /* TODO: we should create a dedicated pool for that i.o. to make
     sure it works on every system!
  it('should filter for the poolname', function(){
    searchField.click();
    searchField.clear().sendKeys('default.rgw.data.root');
    expect(poolRowElements.count()).toBe(1);
  });*/

  it("should apply search filter and display 0 elements", function () {
    helpers.search_for("ABCxyz123");
    expect(poolRowElements.count()).toEqual(0);
  });

  it("should clear the search filter field and display max. 10 elements", function () {
    const clearInputBtn = element(by.css(".tc_clearInputBtn"));
    clearInputBtn.click();
    expect(poolRowElements.count()).toBeGreaterThan(0);
    expect(searchField.getText()).toEqual("");
  });

  it('should have "10" as default max. listed elements per page', function () {
    expect(entriesDropDown.getText()).toEqual("10");
  });

  it("should display less than three elements when this number of displayed elements has been selected", function () {
    entriesDropDown.click();
    element(by.css(".tc_entries_2")).click();
    expect(poolRowElements.count()).toBeLessThan(3);
  });

  it("should still display only two elements after reloading the page", function () {
    browser.refresh();
    expect(poolRowElements.count()).toBeLessThan(3);
  });

  it("should adapt table information of listed entries", function () {
    poolRowElements.count().then(function (countPools) {
      expect(element(by.css(".dataTables_info")).getText()).toContain("Showing 1 to " + countPools + " of ");
    });
  });

  it("should go back to max. 10 elements per page", function () {
    entriesDropDown.click();
    element(by.css(".tc_entries_10")).click();
    expect(poolRowElements.count()).toBeGreaterThan(0);
  });

  afterAll(function () {
    console.log("datatable -> datatable.e2e.js -> ceph pool based");
  });
});
