var helpers = require('../../common.js');
describe('Volumes resize', function(){
  var volumename = 'protractor_test_volume';
  var pool;
  var volume = element(by.cssContainingText('tr', volumename));
  var submit_button = element(by.id('bot2-Msg1'));
  var cancel_button = element(by.id('bot1-Msg1'));
  var actionMenu = element(by.css('.tc_menudropdown'));

  var wrongSize = function(new_size){
    element(by.id('newsize')).sendKeys(new_size);
    expect(element(by.css('.tc_wrongSize')).isDisplayed()).toBe(true);
    element(by.id('newsize')).clear();
  };

  var createNewTestVol = function(fs, size){
    helpers.delete_volume(volume, volumename);
    pool = helpers.create_volume(volumename, fs, size);
  };

  beforeAll(function(){
    helpers.login();
    pool = helpers.create_volume(volumename, "lun", "200mb");
    volume.click();
  });

  it('should have a resize and a cancel button', function(){
    element(by.css('.tc_resize_btn')).click();
    expect(submit_button.isDisplayed()).toBe(true);
    expect(cancel_button.isDisplayed()).toBe(true);
  });

  it('should show a required field error if the submit button is clicked without editing anything', function(){
    submit_button.click();
    expect(element(by.css('.tc_required')).isDisplayed()).toBe(true);
  });

  it('should show a message if the chosen size is smaller than 100mb', function(){
    wrongSize('99mb');
  });

  it('should show a message if the chosen size is higher than the pool size', function(){
    wrongSize(pool.size + 201 + pool.unit);
  });

  it('should not allow to shrink the volume', function(){
    wrongSize('170mb');
  });

  it('should be able to resize a volume with a valid size', function(){
    element(by.id('newsize')).sendKeys('250mb');
    submit_button.click();

    var volume = element(by.cssContainingText('tr', volumename));
    expect(volume.element(by.binding('row.usage.size_text')).getText()).toEqual('250.00MB');
  });

  it('btrfs: should have a clone button instead of a resize button', function(){
    createNewTestVol("btrfs", "200mb");
    volume.click();
    expect(element(by.css('.tc_resize_btn')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_clone_btn')).isDisplayed()).toBe(true);
  });

  it('btrfs: should have a disabled resize menu entry', function(){
    actionMenu.click();
    expect(element(by.css('.oa-dropdown-actions li.disabled a')).getText()).toBe("Resize");
    //createNewTestVol("lun", "200mb"); // Enable if another test follows.
  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('resize volume');
  });
});
