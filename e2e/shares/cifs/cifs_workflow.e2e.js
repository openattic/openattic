var helpers = require('../../common.js');

describe('CIFS Share workflow', function(){

  var volumename = 'protractor_test_volume';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var submitButton = element(by.css('.tc_submitButton'));
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var name = element(by.id('shareName'));
  var path = element(by.id('sharePath'));
  var pathRequired = element(by.css('.tc_cifsPathRequired'));
  var nameRequired = element(by.css('.tc_cifsNameRequired'));

  beforeAll(function(){
    helpers.login();
    helpers.create_volume("xfs");
  });

  beforeEach(function(){
    volumesItem.click();
    expect(volume.isDisplayed()).toBe(true);
    volume.click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareTab')).click();
    browser.sleep(400);
    element(by.css('.tc_cifsShareAdd')).click();
    browser.sleep(400);

  });

  it('should have the title "Create CIFS Share"', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create CIFS Share');
  });

  it('should have the input field "Name"', function(){
    expect(name.isDisplayed()).toBe(true);
  });

  it('should have the input field "Path"', function(){
    expect(path.isDisplayed()).toBe(true);
  });

  it('should have the input field "Comment"', function(){
    expect(element(by.id('shareComment')).isDisplayed()).toBe(true);
  });

  it('should have four checkboxes', function(){
    expect(element.all(by.css('.form-group input[type=checkbox]')).count()).toEqual(4);
  });

  it('should have a checkbox label "Is available"', function(){
    expect(element(by.id('shareAvailable')).isPresent()).toBe(true);
  });

  it('should have a checkbox label "Is browseable"', function(){
    expect(element(by.id('shareBrowseable')).isPresent()).toBe(true);
  });

  it('should have a checkbox label "Is writeable"', function(){
    expect(element(by.id('shareWriteable')).isPresent()).toBe(true);
  });

  it('should have a checkbox label "Accessible by guests"', function(){
    expect(element(by.id('shareGuestOk')).isPresent()).toBe(true);
  });

  it('should have a submit button', function(){
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should have name field filled in with "protractor_test_volume"', function(){
    expect(name.getAttribute('value')).toEqual(volumename);
  });

  it('should have name field filled in with "protractor_test_volume"', function(){
    expect(path.getAttribute('value')).toEqual("/media/" + volumename);
  });

  it('should go back to cifs share overview when hitting the back button', function(){
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_cifs_shares')).isDisplayed()).toBe(true);
  });

  it('should show required messages when hitting the submit button without any form data', function(){
    name.clear();
    path.clear();
    submitButton.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(pathRequired.isDisplayed()).toBe(true);
    
  });

  it('should show required message if "Name" is empty', function(){
    name.clear();
    submitButton.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(pathRequired.isDisplayed()).toBe(false);
    

  });

  it('should show required message if "Path" is empty', function(){
    path.clear();
    submitButton.click();
    expect(pathRequired.isDisplayed()).toBe(true);
    expect(nameRequired.isDisplayed()).toBe(false);

  });

  afterAll(function(){
    console.log('cifs_workflow');
    helpers.delete_volume();
  });
});
