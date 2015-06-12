var helpers = require('../common.js');

describe('Should add an user', function(){

  var username = 'protractor_test_user';
  var user = element(by.cssContainingText('tr', username));
  var systemItem = element.all(by.css('ul .tc_menuitem')).get(5);
  var usersItem = systemItem.all(by.css('ul .tc_submenuitem')).get(0);



  beforeAll(function(){
    helpers.login();
    systemItem.click();
    usersItem.click();
  });

  it('should create an user', function(){
    element(by.css('.tc_addUser')).click();
    browser.sleep(400);
    element(by.model('user.username')).sendKeys(username);
    browser.sleep(400);
    element(by.model('user.password')).sendKeys('test');
    browser.sleep(400);
    element(by.model('user.first_name')).sendKeys('herp');
    browser.sleep(400);
    element(by.model('user.last_name')).sendKeys('derp');
    browser.sleep(400);
    element(by.model('user.email')).sendKeys('herp.derp@openattic.org');
    browser.sleep(400);
    element(by.model('user.is_active')).click();
    browser.sleep(400);
    element(by.model('user.is_staff')).click();
    browser.sleep(400);
    element(by.css('.tc_submitButton')).click();
    browser.sleep(400);

  });

  it('should display the "protractor_test_user" in the users panel', function(){
    expect(user.isDisplayed()).toBe(true);

  });

  it('should delete the "protractor_test_user"', function(){
    user.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteUser')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });

  it('should not show the "protractor_test_user" anymore', function(){
    expect(user.isPresent()).toBe(false);
  });

});
