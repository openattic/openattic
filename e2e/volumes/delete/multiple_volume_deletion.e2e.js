var helpers = require('../../common.js');

describe('Volumes delete', function(){

  var volumesItem = element.all(by.css('ul .tc_menuitem > a')).get(3);
  var volumeNameInput = element(by.model('volume.name'));
  var volumePoolSelect = element(by.model('data.sourcePool'));
  var submitButton = element(by.css('.tc_submitButton'));
  var addBtn = element(by.css('.tc_add_btn'));
  var actionMenu = element(by.css('.tc_menudropdown'));

  var usePool = function(pool, callback){
    addBtn.click();
    volumePoolSelect.sendKeys(pool.name);
    browser.sleep(helpers.configs.sleep);
    callback(pool.name, pool);
  };

  beforeAll(function(){
    helpers.login();
    volumesItem.click();
    // should create a volume of each configured volume types in every configured pool
    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      for(var i = 0; i < pool.volumeTypes.length; i++){
        usePool(pool, function(exact_poolname, pool){
          var volumeType = pool.volumeTypes[i];
          var volumename = 'e2e_' + key + '_' + i;
          var volume = element(by.cssContainingText('tr', volumename));

          //create a volume
          volumeNameInput.sendKeys(volumename);
          element(by.cssContainingText('label', volumeType)).click();
          element(by.id('data.megs')).sendKeys('100mb');
          submitButton.click();
        });
      }
    }

    // Select all e2e volumes.
    element(by.css('.tc_entries_dropdown')).click();
    element(by.css('.tc_entries_100 > a')).click();
    element.all(by.cssContainingText('tr', 'e2e_')).all(by.css("input")).each(function(e, index){
      e.click();
      if(index === 0){
        browser.sleep(helpers.configs.sleep);
      }
    });
  });

  it('should not show any tab', function(){
    expect(element(by.css('.tabbable.tabs-left')).isDisplayed()).toBe(false);
  });

  it('should only have add and delete avaiable in the dropdown action menu', function(){
    actionMenu.click();
    var list = element.all(by.css('.oa-dropdown-actions li:not(.disabled) a'));
    expect(list.count()).toBe(2);
    expect(list.first().getText()).toBe('Add');
    expect(list.last().getText()).toBe('Delete');
    actionMenu.click();
  });

  it('should delete all volumes that begin with "e2e_"', function(){
    // Delete all volumes.
    actionMenu.click();
    element(by.css('.tc_deleteItem')).click();
    element(by.model('input.enteredName')).sendKeys("yes");
    element(by.id('bot2-Msg1')).click();

    // Check if they are deleted.
    expect(element.all(by.cssContainingText('tr', 'e2e_'))).toEqual([]);
    console.log('multiple_volume_deletion');
  });

});
