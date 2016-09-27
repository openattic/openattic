var helpers = require('../../common.js');

describe('Host form workflow', function(){
  var iscsiCheckbox = element.all(by.model('type.check')).get(0);
  var fcCheckbox = element.all(by.model('type.check')).get(1);
  var iscsiInput = element.all(by.model('newTag.text')).get(0);
  var fcInput = element.all(by.model('newTag.text')).get(1);

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_hosts > a')).click();
    browser.sleep(400);
    element(by.css('.tc_addHost')).click();
    browser.sleep(400);
  });

  it('should have a "Add Host" title', function(){
    expect(element(by.css('.tc_hostAddTitle')).getText()).toEqual('Add Host:');
  });

  it('Should have a host name input field', function(){
    expect(element(by.id('hostName')).isDisplayed()).toBe(true);
  });

  it('should have a checkbox for iscsi', function(){
    expect(iscsiCheckbox.isPresent()).toBe(true);
  });

  it('should have a checkbox for fibre channel', function(){
    expect(fcCheckbox.isPresent()).toBe(true);
  });

  it('should have two checkboxes in total', function(){
    expect(element.all(by.css('.form-group input[type=checkbox]')).count()).toEqual(2);
  });

  it('should have a iscsi checkbox label', function(){
    expect(element(by.css('.tc_iscsiText')).isDisplayed()).toBe(true);
  });

  it('should have a fibre channel checkbox label', function(){
    expect(element(by.css('.tc_qla2xxxText')).isDisplayed()).toBe(true);
  });

  it('should have an input field for an initiator', function(){
    iscsiCheckbox.click();
    expect(iscsiInput.isDisplayed()).toBe(true);
    expect(fcInput.isDisplayed()).toBe(false);
    iscsiCheckbox.click();
  });

  it('should have an input field for a wwn', function(){
    fcCheckbox.click();
    expect(fcInput.isDisplayed()).toBe(true);
    expect(iscsiInput.isDisplayed()).toBe(false);

  });

  it('should have a submit button', function(){
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should show an error message when hitting the submit button without any data', function(){
    element(by.css('.tc_submitButton')).click();
    expect(element(by.css('.tc_hostnameRequired')).isDisplayed()).toBe(true);
  });

  it('should show an error message when entered name is not valid', function(){
    element(by.model('host.name')).sendKeys('üüü asdfo dfä');
    expect(element(by.css('.tc_hostNameNotValid')).isDisplayed()).toBe(true);
  });

  it('should navigate back to the Host overview when hitting the button', function(){
    element(by.css('.tc_backButton')).click();
    expect(element(by.css('.tc_oadatatable_hosts')).isPresent()).toBe(true);
  });

  afterAll(function(){
    console.log('host_form -> host_form_workflow.e2e.js');
  });
});
