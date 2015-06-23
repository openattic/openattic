var helpers = require('../common.js');

describe('Pools panel', function(){
    
  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem')).get(2).click();
  });
    
  it('should show the oadatatable', function(){
    expect(element(by.css('.tc_oadatatable_pools')).isDisplayed()).toBe(true);  
  });
  
  it('should have an add button', function(){
    expect(element(by.css('.tc_addPoolBtn')).isDisplayed()).toBe(true);   
  });
    
});