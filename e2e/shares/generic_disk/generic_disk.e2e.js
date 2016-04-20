var helpers = require('../../common.js');

describe('should not allow sharing a disk via iscsi/fc in the volumes panel', function(){
  var disk = element.all(by.cssContainingText('tr', 'generic disk')).get(0);

  beforeAll(function(){
    helpers.login();
  });

  it('should display a generic disk', function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    expect(disk.isDisplayed()).toBe(true);
  });

  it('should not display iscsi/fc share tab for a disk', function(){
    disk.click();
    expect(element(by.css('.tc_iscsi_fcTab')).isDisplayed()).toBe(false);
  });

  afterAll(function(){
    console.log('disk_share -> generic_disk.e2e.js');
  });
});
