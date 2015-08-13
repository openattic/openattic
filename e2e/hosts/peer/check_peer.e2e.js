var helpers = require('../../common.js');

describe('should check the peer attribute', function(){

  var host = element.all(by.model('checked')).get(0);

  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem')).get(4).click();
  });

  it('host should have a peer attribute', function(){
    host.click();
    browser.sleep(600);
    peer = element(by.model('data.peerhosts'));
    expect(peer.isDisplayed()).toBe(true);
    peer.click();
    expect(element(by.model('data.peerhosts')).getText()).toContain('@');
  });

});
