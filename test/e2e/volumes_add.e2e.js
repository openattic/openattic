describe('Volumes add', function() {
  beforeEach(function() {
    browser.get('http://172.16.13.135/openattic/angular/login.html');
    element.all(by.model('username')).sendKeys('openattic');
    element.all(by.model('password')).sendKeys('openattic');
    element.all(by.css('input[type="submit"]')).click();

    browser.sleep(2000);

    var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
    volumesItem.click();

    var addBtn = element(by.css('oadatatable .tc_add_btn'));
    addBtn.click();
  });

  it('should open an add volume form with "Create Volume:" header', function(){
    expect(element(by.css('h2')).getText()).toEqual('Create Volume:');
  });
});