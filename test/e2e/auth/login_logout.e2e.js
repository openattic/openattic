var configs = require('../configs.js');

describe('should test the login', function(){
    
  it('should login and get to the dashboard site', function(){
    browser.get(configs.url);
    element.all(by.model('username')).sendKeys(configs.username);
    element.all(by.model('password')).sendKeys(configs.password);
    element.all(by.css('input[type="submit"]')).click();
    expect(browser.getCurrentUrl()).toContain('#/dashboard'); 
  });
  
  it('should click any menu entry', function(){
    var test = element.all(by.css('ul .tc_menuitem')).get(3);
    test.click();
    expect(browser.getCurrentUrl()).toContain('#/volumes');
  });
  
  it('should logout again', function(){
     element(by.css('.tc_logout')).click();
     expect(browser.getCurrentUrl()).toContain('/#/login');
    
  });
});     