var configs = require('../configs.js');

describe('should test the login', function(){

  var name = element(by.model('username'));
  var passwd = element(by.model('password'));
  var nameRequired = element(by.css('.tc_usernameRequired'));
  var passwdRequired = element(by.css('.tc_passwdRequired'));
  var correctInput = element(by.binding('correctInput'));

  var submitBtn = element(by.css('input[type="submit"]'));

  it('should login and get to the dashboard site', function(){
    browser.get(configs.url);
    element.all(by.model('username')).sendKeys(configs.username);
    element.all(by.model('password')).sendKeys(configs.password);
    submitBtn.click();
    //if login was successful the url should contain /dashboard
    expect(browser.getCurrentUrl()).toContain('#/dashboard');
  });

  it('should click any menu entry', function(){
    element.all(by.css('ul .tc_menuitem > a')).get(3).click();
    expect(browser.getCurrentUrl()).toContain('#/volumes');
  });

  it('should logout again', function(){
    element(by.css('.tc_logout a')).click();
    expect(browser.getCurrentUrl()).toContain('/#/login');

  });

  //login workflow

  it('should have an user input field', function(){
    expect(name.isDisplayed()).toBe(true);
  });

  it('should have an password input field', function(){
    expect(element(by.model('password')).isDisplayed()).toBe(true);
  });

  it('should show an error if user input field has no data', function(){
    //make sure that input field username is empty
    name.clear();
    submitBtn.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(element(by.css('.tc_usernameRequired')).getText()).toBe('This field is required.');
  });

  it('should show an error if password input field has no data', function(){
    passwd.clear();
    submitBtn.click();
    expect(passwdRequired.isDisplayed()).toBe(true);
    expect(passwdRequired.getText()).toBe('This field is required.');
  });

  it('should show an error if username and password input fields have no input data and submit button was clicked', function(){
    //make sure that user and password fields are empty
    name.clear();
    passwd.clear();
    submitBtn.click();
    expect(nameRequired.isDisplayed()).toBe(true);
    expect(nameRequired.getText()).toBe('This field is required.');
    expect(passwdRequired.isDisplayed()).toBe(true);
    expect(passwdRequired.getText()).toBe('This field is required.');
    expect(correctInput.isDisplayed()).toBe(false);
  });

  it('should display an error message if given credentials are incorrect', function(){
    name.click();
    browser.sleep(400);
    name.clear();
    name.sendKeys('wer344fv     resfferwwxd');
    passwd.click();
    browser.sleep(400);
    passwd.clear();
    passwd.sendKeys('2943tr3befc vr');
    submitBtn.click();
    expect(correctInput.isDisplayed()).toBe(true);
    expect(correctInput.getText()).toBe('The given credentials are not correct.');
    expect(nameRequired.isDisplayed()).toBe(false);
    expect(passwdRequired.isDisplayed()).toBe(false);

  });
});
