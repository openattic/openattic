describe('Dashboard', function() {

  it('should have a title', function() {
    browser.get('http://172.16.13.125/openattic/angular/#/login');

    element(by.model('username')).sendKeys('openattic');
    element(by.model('password')).sendKeys('openattic');

    element(by.css('input[type="submit"]'))
      .click()
      


  });



});