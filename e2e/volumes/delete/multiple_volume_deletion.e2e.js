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
    browser.sleep(400);
    volumePoolSelect.sendKeys(pool.name);
    browser.sleep(helpers.configs.sleep);
    callback(pool.name, pool);
  };

  beforeAll(function(){
    helpers.login();
    browser.sleep(400);
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
          browser.sleep(400);
          element(by.cssContainingText('label', volumeType)).click();
          browser.sleep(400);
          element(by.id('data.megs')).sendKeys('100mb');
          browser.sleep(400);
          submitButton.click();
          browser.sleep(400);
        });
      }
    }

    // Select all e2e volumes.
    element(by.css('.tc_entries_dropdown')).click();
    browser.sleep(400);
    element(by.css('.tc_entries_100 > a')).click();
    browser.sleep(400);
    element.all(by.cssContainingText('tr', 'e2e_')).all(by.css("input")).each(function(e, index){
      e.click();
      if(index === 0){
        browser.sleep(helpers.configs.sleep);
      }
    });
  });

  it('should not show any tab', function(){
    expect(element(by.id('more')).isDisplayed()).toBe(false);
  });

  it('should display the delete button when selecting several volumes', function(){
    expect(element(by.css('.tc_delete_btn')).isDisplayed()).toBe(true);
    browser.sleep(400);
  });

  it('should only have add and delete avaiable in the dropdown action menu', function(){
    actionMenu.click();
    browser.sleep(400);
    var list = element.all(by.css('.oa-dropdown-actions li:not(.disabled) a'));
    browser.sleep(400);
    expect(list.count()).toBe(2);
    browser.sleep(400);
    expect(list.first().getText()).toBe('Add');
    browser.sleep(400);
    expect(list.last().getText()).toBe('Delete');
    browser.sleep(400);
    var disabledOptionList = element.all(by.css('.oa-dropdown-actions .disabled'));

    disabledOptionList.getText().then(function(disabledOptionList){
      expect(disabledOptionList.toString()).toEqual('Resize,Clone,Protection,More Options');
    });

    browser.sleep(400);
    actionMenu.click();
  });

  it('should delete all volumes that begin with "e2e_"', function(){
    // Delete all volumes.
    actionMenu.click();
    browser.sleep(400);
    element(by.css('.tc_deleteItem')).click();
    browser.sleep(400);
    element(by.model('input.enteredName')).sendKeys("yes");
    browser.sleep(400);
    element(by.id('bot2-Msg1')).click();
    browser.sleep(helpers.configs.sleep);

    // Check if they are deleted.
    expect(element.all(by.cssContainingText('tr', 'e2e_'))).toEqual([]);
  });

  afterAll(function(){
    console.log('volumes_multi_delete -> multiple_volume_deletion.e2e.js');
  });
});
