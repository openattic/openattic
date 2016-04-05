var helpers = require('../common.js');
describe('Volumes', function(){
  beforeEach(function(){
    helpers.login();

    var volumesItem = element.all(by.css('ul .tc_menuitem > a')).get(3);
    volumesItem.click();
  });

  it('should have a oadatatable element', function(){
    expect(element(by.css('oadatatable')).isPresent()).toBe(true);
  });

  it('should have an add button', function(){
    expect(element(by.css('oadatatable .tc_add_btn')).isPresent()).toBe(true);
  });

  afterAll(function(){
    console.log('volumes -> volumes.e2e.js');
  });
});
