var helpers = require('../common.js');

describe('should test the user form', function(){

  var systemItem = element(by.css('ul .tc_menuitem_system'));
  var usersItem = systemItem.element(by.css('ul .tc_submenuitem_system_users > a'));

  var name = element(by.model('user.username'));
  var passwd = element(by.model('user.email'));

  var username = 'herpderp';
  var submitButton = element(by.css('.tc_submitButton'));


  beforeAll(function(){
    helpers.login();

  });

  beforeEach(function(){
    systemItem.click();
    usersItem.click();
    element(by.css('.tc_addUser')).click();
  });

  it('Should have the title "Create User:"', function(){
    expect(element(by.css('.tc_userAddTitle')).getText()).toEqual('Create User:');
  });


  it('should have a "Username" input field', function(){
    expect(name.isDisplayed()).toBe(true);
  });

  it('should have a "Password" input field', function(){
    expect(passwd.isDisplayed()).toBe(true);
  });

  it('should have a "Firstname" input field', function(){
    expect(element(by.model('user.first_name')).isDisplayed()).toBe(true);
  });

  it('should have a Lastname input field', function(){
    expect(element(by.model('user.last_name')).isDisplayed()).toBe(true);
  });

  it('should have an "Email Address" input field', function(){
    expect(element(by.model('user.email')).isDisplayed()).toBe(true);
  });

  it('should have three checkboxes', function(){
    expect(element.all(by.css('.form-group input[type=checkbox]')).count()).toEqual(3);
  });

  it('should have a checkbox title "Is active"', function(){
    expect(element(by.id('userActive')).isPresent()).toBe(true);
  });

  it('should not have a checkbox title "Is active", while editing the own profile', function(){
    systemItem.click();
    usersItem.click();
    element(by.cssContainingText('tr', 'openattic')).element(by.css('a')).click();
    expect(element(by.id('userActive')).isPresent()).toBe(false);
  });

  it('should have a chexkbox title "Is administrator"', function(){
    expect(element(by.id('userStaff')).isPresent()).toBe(true);
  });

  it('should have a checkbox title "Has all privileges"', function(){
    expect(element(by.id('userSuperuser')).isPresent()).toBe(true);
  });

  it('should show an error message when hitting the submit button without any input datat for field "Username"', function(){
    element(by.model('user.password')).sendKeys('test');
    submitButton.click();

    expect(element(by.css('.tc_usernameRequired')).isDisplayed()).toBe(true);
  });

  it('should show an error message when hitting the submit button without any input datat for field "Password"', function(){
    element(by.model('user.username')).sendKeys(username);
    submitButton.click();
    expect(element(by.css('.tc_passwdRequired')).isDisplayed()).toBe(true);
  });

  it('should show an error message when data for field "username" does not match', function(){
    element(by.model('user.username')).sendKeys('öäüfasd  sadof');
    expect(element(by.css('.tc_userNameNotValid')).isDisplayed()).toBe(true);
  });

  it('should show an error message when input for field "Email Address" is not valid', function(){
    element(by.model('user.email')).sendKeys('äü adsfo vfoe');
    expect(element(by.css('.tc_emailNotValid')).isDisplayed()).toBe(true);
  });

  it('should show error messages for "Username" and "Password" when hitting the submit button without any given input data', function(){
    name.clear();
    passwd.clear();
    submitButton.click();
    expect(element(by.css('.tc_usernameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_passwdRequired')).isDisplayed()).toBe(true);

  });

  it('should have a submit button', function(){
    expect(element(by.css('.tc_submitButton')).isPresent()).toBe(true);
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should navigate to the user overview when hitting the back button', function(){
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();
    expect(element(by.css('.tc_oadatatable_users')).isDisplayed()).toBe(true);
  });

  afterAll(function(){
    console.log('users -> user_form_workflow.e2e.js');
  });
});
