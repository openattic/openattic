var helpers = require('../common.js');
describe('Volumes', function(){
  beforeEach(function(){
    helpers.login();

    element(by.css('ul .tc_menuitem_volumes > a')).click();
  });

  it('should have a oadatatable element', function(){
    expect(element(by.css('oadatatable')).isPresent()).toBe(true);
  });

  it('should have an add button', function(){
    expect(element(by.css('oadatatable .tc_add_btn')).isPresent()).toBe(true);
  });
});
