describe('Volumes', function() {
  beforeEach(function() {
    browser.get('http://172.16.13.135/openattic/angular/login.html');
    element.all(by.model('username')).sendKeys('openattic');
    element.all(by.model('password')).sendKeys('openattic');
    element.all(by.css('input[type="submit"]')).click();

    browser.sleep(2000);

    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();
  });

  it('should have a oadatatable element', function(){
    expect(element(by.css('oadatatable')).isPresent()).toBe(true);
  });

  it('should have an add button', function(){
    expect(element(by.css('oadatatable .tc_add_btn')).isPresent()).toBe(true);
  });

  it('should open an add volume form', function(){
    var addBtn = element(by.css('oadatatable .tc_add_btn'));
    addBtn.click();

    expect(element(by.css('h2')).getText()).toEqual('Create Volume:');
  });
});