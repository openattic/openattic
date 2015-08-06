var helpers = require('../common.js');

describe('Disks Panel', function(){
  
  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem')).get(1).click();
  });
    
  it('should display the disks table', function(){
    expect(element(by.css('.tc_oadatatable_disks')).isDisplayed()).toBe(true);  
  });
  
  it('should have a create pool button', function(){
    expect(element(by.css('.tc_createPoolBtn')).isDisplayed()).toBe(true);  
  });
});