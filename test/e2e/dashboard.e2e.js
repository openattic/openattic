describe('Dashboard', function() {

  it('should have a title', function() {
    browser.get('http://openattic:openattic@172.16.13.125/openattic/angular2/#/pools');

    expect(browser.getTitle()).toEqual('openATTIC');
    expect(element.all(by.css('.breadcrumb li')).get(0).getText()).toEqual('Home');
    expect(element.all(by.css('.breadcrumb li')).get(1).getText()).toEqual('Dashboard');


  });



});