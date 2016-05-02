var helpers = require('../common.js');

var volumename = "protractor_volume_date";
var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

var firstSnapName = "protractor_test_snap";
var secSnapName = "second_ptor_snap";

var snap1 = element.all(by.css('.tc_snapRowName')).get(0);
var snap2 = element.all(by.css('.tc_snapRowName')).get(1);

var created = element.all(by.cssContainingText('th', 'Created')).get(1);
var columnListButton = element(by.css('.tc_columnBtn'));
var protectionListItem = element(by.cssContainingText('.tc_columnItem', 'Protection'));
var protectionColumn = element(by.cssContainingText('th', 'Protection'));
var searchField = element.all(by.model('filterConfig.search')).get(0);
var entriesDropDown = element(by.css('.tc_entries_dropdown'));
var volumeRowElements = element.all(by.css('.tc_volumeRowName'));
var snapshotTab = element(by.css('.tc_snapshotTab'));

describe('Should test oadatatable and its options', function(){

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, "zfs");
    helpers.create_snapshot(volume);
  });

  beforeEach(function(){
    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
  });

  var list = [
    'Name',
    'Size',
    'Used',
    'Status',
    'Protection',
    'Type',
    'Path',
    'Host',
    'Created'
  ];

  it('should display the datatable header', function(){
    expect(element(by.css('.dataTables_header')).isDisplayed()).toBe(true);
  });

  it('should display the datatable footer', function(){
    expect(element(by.css('.dataTables_footer')).isDisplayed()).toBe(true);
  });

  it('should display a input search field', function(){
    expect(element(by.model('filterConfig.search')).isDisplayed()).toBe(true);
  });


  it('should have a reload button', function(){
    expect(element(by.css('.tc_refreshBtn')).isDisplayed()).toBe(true);
  });

  it('should display the column button', function(){
    expect(columnListButton.isDisplayed()).toBe(true);
  });

  it('should display enabled/disabled columns when clicked', function(){
    columnListButton.click();
    browser.sleep(400);
    var options = element.all(by.repeater('(text, checked) in columns'))
      .then(function(options){
        a = 0;
        for(option in options){
          options[option].element(by.css('.tc_columnItem')).evaluate('text').then(function(label){
            expect(label).toEqual(list[a]);
            //check: console.log("label: " + label + " list: " + list[a]);
            a++;
          });
        }
      });
  });

  it('should no longer display a column when deselected', function(){
    columnListButton.click();
    protectionListItem.click();
    expect(protectionColumn.isDisplayed()).toBe(false);
  });

  it('should put the protection column back in', function(){
    columnListButton.click();
    protectionListItem.click();
    expect(protectionColumn.isDisplayed()).toBe(true);
  });

  it('should filter for the volumename', function(){
    searchField.click();
    searchField.clear().sendKeys('protractor_volume_date');
    expect(volumeRowElements.count()).toBe(1);
  });

  it('should clear the filter search field and display max. 10 elements', function(){
    searchField.clear();
    expect(volumeRowElements.count()).toBeGreaterThan(1);
  });

  it('should have "10" as default max. listed elements per page', function(){
    expect(entriesDropDown.getText()).toEqual('10');
  });

  it('should display only two elements when this number of displayed elements is selected', function(){
    entriesDropDown.click();
    element(by.css('.tc_entries_2')).click();
    expect(volumeRowElements.count()).toBe(2);
  });

  it('should go back to max. 10 elements per page', function(){
    entriesDropDown.click();
    element(by.css('.tc_entries_10')).click();
    expect(volumeRowElements.count()).toBeGreaterThan(2);
  });

});

describe('snapshot tab based datatable tests', function(){

  beforeEach(function(){
    volume.click();
    snapshotTab.click();
  });

  //snapshot tab
  it('should have a "Created" column header which is clickable', function(){
    volume.click();
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(created.isDisplayed()).toBe(true);
    browser.sleep(400);
  });

  it('should add another snapshot in order to test the create-date sort function', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotAdd')).click();
    browser.sleep(400);
    element(by.id('snap.name')).clear();
    browser.sleep(400);
    element(by.model('snap.name')).sendKeys(secSnapName);
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    browser.sleep(400);
    expect(element.all(by.css('.tc_snapRowName')).count()).toBe(2);
  });

  it('should check the current sort order', function(){
    volume.click();
    browser.sleep(400);
    //check the current sort order before clicking the sort button
    browser.sleep(400);
    expect(snap1.getText()).toEqual(firstSnapName);
    browser.sleep(400);
    expect(snap2.getText()).toEqual(secSnapName);
    browser.sleep(400);
  });

  it('should check the new sort order', function(){
    volume.click();
    browser.sleep(400);
    created.click();
    //clicking the created table header twice is just a hacky hack.
    //the snapshot create dates are the same (there would be just a different in seconds
    //but those are currently not displayed (because date format is 'short')
    created.click();
    //order should be the other way around
    browser.sleep(400);
    expect(snap1.getText()).toEqual(secSnapName);
    browser.sleep(400);
    expect(snap2.getText()).toEqual(firstSnapName);
    browser.sleep(400);
  });

  it('should click the sort button again to get the original order', function(){
    volume.click();
    browser.sleep(400);
    created.click();
    //should be in original state again
    expect(snap1.getText()).toEqual(firstSnapName);
    expect(snap2.getText()).toEqual(secSnapName);
  });

  afterAll(function(){
    browser.sleep(400);
    helpers.delete_volume(volume, volumename);
    console.log("datatable -> datatable.e2e.js");
  });
});