var helpers = require('../../../common.js');
describe('Btrfs resize', function(){
  var volumename = 'e2e_pool';
  var subvolumename = 'e2e_volume';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
  var subvolume = element.all(by.cssContainingText('tr', volumename)).get(1);
  var submit_button = element(by.id('bot2-Msg1'));
  var cancel_button = element(by.id('bot1-Msg1'));
  var actionMenu = element(by.css('.tc_menudropdown'));

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, "btrfs", "500mb");
    browser.sleep(400);
    helpers.create_volume(subvolumename, "btrfs", "200mb", volumename);
    element(by.css('ul .tc_menuitem_volumes > a')).click();
  });

  beforeEach(function(){
    browser.refresh();
  });

  it('volume: should have a resize button instead of a clone button', function(){
    volume.click();
    expect(element(by.css('.tc_resize_btn')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_clone_btn')).isDisplayed()).toBe(false);
  });

  it('subvolume: should have a clone button instead of a resize button', function(){
    subvolume.click();
    expect(element(by.css('.tc_resize_btn')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_clone_btn')).isDisplayed()).toBe(true);
  });

  it('volume: should not have a disabled resize menu entry', function(){
    volume.click();
    actionMenu.click();
    expect(element.all(by.css('.oa-dropdown-actions li.disabled a')).count()).toBe(0);
  });

  it('subvolume: should have a disabled resize menu entry', function(){
    subvolume.click();
    actionMenu.click();
    expect(element(by.css('.oa-dropdown-actions li.disabled a')).getText()).toBe("Resize");
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('volumes_resize -> btrfs_resize.e2e.js');
  });
});
