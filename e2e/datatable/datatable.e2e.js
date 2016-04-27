var helpers = require('../common.js');

describe('Should test oadatatable and its options', function(){

  var volumename = "protractor_volume_date";
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var created = element.all(by.cssContainingText('th', 'Created')).get(1);

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
    expect(element(by.css('.tc_columnBtn')).isDisplayed()).toBe(true);
  });

  it('should display enabled/disabled columns when clicked', function(){
    element(by.css('.tc_columnBtn')).click();
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

  //sort list
  it('should have a "Created" column header which is clickable', function(){
    element.all(by.cssContainingText('tr', volumename)).get(0).click();
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    expect(created.isDisplayed()).toBe(true);
    browser.sleep(400);
  });


  it('should add another snapshot in order to test the create-date sort function', function(){
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_snapshotTab')).click();
    browser.sleep(400);
    element(by.css('.tc_snapshotAdd')).click();
    browser.sleep(400);
    element(by.id('snap.name')).clear();
    browser.sleep(400);
    element(by.model('snap.name')).sendKeys("second_ptor_snap");
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    expect(element(by.cssContainingText('td', 'second_ptor_snap')).isDisplayed()).toBe(true);
    browser.sleep(400);

    //expect(snapshot liste count to be 2

    var snap_datatable = element(by.css('.tc_oadatatable_snapshots'));
    //expect(snap_datatable.element(by.css('td')).getAttribute('innerHTML')).toContain('protractor_test_snap');

    var snap1 = element.all(by.css('.tc_snapRowName')).get(0);
    var snap2 = element.all(by.css('.tc_snapRowName')).get(1);

    expect(snap1.getText()).toEqual('protractor_test_snap');
    expect(snap2.getText()).toEqual('second_ptor_snap');




  });

//   //check the current sort order
//
//   it('should check the current sort order', function(){
//
//   });
//
//   //check the sort order after clicking the sort-create-date-button
//   it('should check the sort order after clicking the create-date-button', function(){
//
//   });

  afterAll(function(){

    browser.sleep(400);
    helpers.delete_volume(volume, volumename);
    console.log("datatable -> datatable.e2e.js");
  });


});