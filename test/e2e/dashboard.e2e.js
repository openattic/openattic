describe('Dashboard', function() {

  it('should have a title', function() {
    browser.get('http://srvopenatticci01.master.dns/openattic/angular/login.html');

    element.all(by.model('username')).sendKeys('openattic');
    element.all(by.model('password')).sendKeys('openattic');
    element.all(by.css('input[type="submit"]')).click();

    expect(browser.getTitle()).toEqual('openATTIC');
    expect(element.all(by.css('.breadcrumb li')).get(0).getText()).toEqual('Home');
    expect(element.all(by.css('.breadcrumb li')).get(1).getText()).toEqual('Dashboard');


  });



});
