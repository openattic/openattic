var helpers = require('../common.js');

describe('Should add an user', function(){

  var username = 'protractor_test_user';
  var user = element(by.cssContainingText('tr', username));
  var systemItem = element.all(by.css('ul .tc_menuitem')).get(5);
  var usersItem = systemItem.all(by.css('ul .tc_submenuitem > a')).get(0);
  systemItem = systemItem.all(by.css(' a')).first();
  var userpasswd = 'test';
  var correctInput = element(by.binding('correctInput'));
  var logout = element(by.css('.tc_logout a'));



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
    element(by.model('user.password')).sendKeys(userpasswd);
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

  //logout first
  it('should logout again', function(){
    logout.click();
    expect(browser.getCurrentUrl()).toContain('/#/login');

  });

  //test login with new user data
  it('should login with the new created user', function(){
    element.all(by.model('username')).sendKeys(username);
    element.all(by.model('password')).sendKeys(userpasswd);
    element.all(by.css('input[type="submit"]')).click();
  });

  //try to click something and expect that with a successful login the user should be able to click around
  it('', function(){
    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    expect(browser.getCurrentUrl()).toContain('/#/volumes');

  });

  it('should logout protractor_test_user', function(){
    logout.click();
    expect(browser.getCurrentUrl()).toContain('/#/login');

  });

  it('should delete the "protractor_test_user"', function(){
    element.all(by.model('username')).sendKeys('openattic');
    element.all(by.model('password')).sendKeys('openattic');
    element.all(by.css('input[type="submit"]')).click();
    systemItem.click();
    browser.sleep(400);
    usersItem.click();
    browser.sleep(400);
    user.click();
    browser.sleep(400);
    element(by.css('.tc_menudropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_deleteUser > a')).click();
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(400);
  });


  it('should not show the "protractor_test_user" anymore', function(){
    expect(user.isPresent()).toBe(false);
    //expect that we are still on the users panel
    expect(browser.getCurrentUrl()).toContain('/#/users');
  });

  //to make sure that the user is deleted, try to login again
  it('should make sure that the user really does not exist anymore', function(){
    logout.click();
    expect(browser.getCurrentUrl()).toContain('/#/login');
    element.all(by.model('username')).sendKeys(username);
    element.all(by.model('password')).sendKeys(userpasswd);
    element.all(by.css('input[type="submit"]')).click();
    expect(correctInput.isDisplayed()).toBe(true);
    expect(correctInput.getText()).toBe('The given credentials are not correct.');

  });

});
