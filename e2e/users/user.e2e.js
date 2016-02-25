'use strict';
var helpers = require('../common.js');

describe('Should add an user', function(){

  var testUser = {
    username: 'protractor_test_user',
    userpasswd: 'test',
    firstname: 'Herp',
    lastname: 'Derp',
    email: 'herp.derp@openattic.org'
  }
  var user = element(by.cssContainingText('tr', testUser.username));
  var systemItem = element(by.css('ul .tc_menuitem_system'));
  var usersItem = systemItem.element(by.css('ul .tc_submenuitem_system_users > a'));
  var correctInput = element(by.binding('correctInput'));
  var logout = element(by.css('.tc_logout a'));
  var addBtn = element(by.css('.tc_addUser'));
  var noUniqueName = element(by.css('.tc_noUniqueName'));

  beforeAll(function(){
    helpers.login();
    systemItem.click();
    usersItem.click();
  });

  it('should create an user', function(){
    addBtn.click();
    browser.sleep(400);
    element(by.model('user.username')).sendKeys(testUser.username);
    browser.sleep(400);
    element(by.model('user.password')).sendKeys(testUser.userpasswd);
    browser.sleep(400);
    element(by.model('user.first_name')).sendKeys(testUser.firstname);
    browser.sleep(400);
    element(by.model('user.last_name')).sendKeys(testUser.lastname);
    browser.sleep(400);
    element(by.model('user.email')).sendKeys(testUser.email);
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

  it('should verify that current name has no error message', function(){
    user.all(by.css('a')).click();
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(false);
  });

  it('should verify that if the "already in use" error message is still working', function(){
    element(by.model('user.username')).clear().sendKeys('openattic');
    expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
    element(by.css('.tc_backButton')).click();
  });

  //logout first
  it('should logout again', function(){
    logout.click();
    expect(browser.getCurrentUrl()).toContain('/#/login');
  });

  //test login with new user data
  it('should login with the new created user', function(){
    element.all(by.model('username')).sendKeys(testUser.username);
    element.all(by.model('password')).sendKeys(testUser.userpasswd);
    element.all(by.css('input[type="submit"]')).click();
  });

  //try to click something and expect that with a successful login the user should be able to click around
  it('should be able to click something now', function(){
    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    expect(browser.getCurrentUrl()).toContain('/#/volumes');
  });

  it('should display an error message if one tries to add an user with already taken username', function(){
    systemItem.click();
    browser.sleep(400);
    usersItem.click();
    browser.sleep(400);
    addBtn.click();
    browser.sleep(400);
    element(by.model('user.username')).sendKeys(testUser.username);
    expect(noUniqueName.isDisplayed()).toBe(true);
  });

  it('should check the user already taken error message', function(){
    expect(noUniqueName.getText()).toEqual('The chosen user name is already in use.');
  });

  it('should show the first and last name of the current user in the left panel', function(){
    expect(element(by.css('span .tc_usernameinfo')).getText()).toEqual(testUser.firstname + ' ' + testUser.lastname);
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
    element.all(by.model('username')).sendKeys(testUser.username);
    element.all(by.model('password')).sendKeys(testUser.userpasswd);
    element.all(by.css('input[type="submit"]')).click();
    expect(correctInput.isDisplayed()).toBe(true);
    expect(correctInput.getText()).toBe('The given credentials are not correct.');
  });
});
