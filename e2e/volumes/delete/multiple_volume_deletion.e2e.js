var helpers = require('../../common.js');

describe('Volumes delete', function(){
  var actionMenu = element(by.css('.tc_menudropdown'));
  var deleteBtn = element(by.css('.tc_delete_btn'));
  var volumes = element.all(by.cssContainingText('tr', 'e2e_'));

  beforeAll(function(){
    helpers.login();
    browser.sleep(400);
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    helpers.create_volume('e2e_1', 'lun');
    helpers.create_volume('e2e_2', 'xfs');

    // Select all e2e volumes.
    element(by.css('.tc_entries_dropdown')).click();
    element(by.css('.tc_entries_100 > a')).click();
    volumes.all(by.css('input')).each(function(e, index){
      e.click();
      if(index === 0){
        browser.sleep(helpers.configs.sleep);
      }
    });
  });

  it('should not show any tab', function(){
    expect(element(by.css('#more .nav')).isDisplayed()).toBe(false);
  });

  it('should display the delete button when selecting several volumes', function(){
    expect(deleteBtn.isDisplayed()).toBe(true);
  });

  it('should only have add and delete avaiable in the dropdown action menu', function(){
    actionMenu.click();
    var list = element.all(by.css('.oa-dropdown-actions li:not(.disabled) a'));
    expect(list.count()).toBe(2);
    expect(list.first().getText()).toBe('Add');
    expect(list.last().getText()).toBe('Delete');
    var disabledOptionList = element.all(by.css('.oa-dropdown-actions .disabled'));
    disabledOptionList.getText().then(function(disabledOptionList){
      expect(disabledOptionList.toString()).toEqual('Resize,Clone,Protection,More Options');
    });
    actionMenu.click();
  });

  it('should delete all volumes that begin with "e2e_"', function(){
    // Delete all volumes.
    deleteBtn.click();
    browser.sleep(400);
    element(by.model('input.enteredName')).sendKeys('yes');
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);

    // Check if they are deleted.
    expect(volumes).toEqual([]);
  });

  afterAll(function(){
    console.log('volumes_multi_delete -> multiple_volume_deletion.e2e.js');
  });
});
