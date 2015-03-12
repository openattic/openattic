describe('General', function() {
  beforeEach(function() {
    browser.get('http://172.16.13.135/openattic/angular/login.html');
    element.all(by.model('username')).sendKeys('openattic');
    element.all(by.model('password')).sendKeys('openattic');
    element.all(by.css('input[type="submit"]')).click();

    browser.sleep(2000);
  });

  it('should have a title', function(){
    expect(browser.getTitle()).toEqual('openATTIC');
  });

  it('should have dashboard as first nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(0).getText()).toEqual('Dashboard');
  });

  it('should have disks as second nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(1).getText()).toEqual('Disks');
  });

  it('should have pools as third nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(2).getText()).toEqual('Pools');
  });

  it('should have volumes as fourth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(3).getText()).toEqual('Volumes');
  });

  it('should have hosts as fifth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(4).getText()).toEqual('Hosts');
  });

  it('should have system as sixth nav item', function(){
    expect(element.all(by.css('ul .tc_menuitem')).get(5).getText()).toEqual('System');
  });
});
