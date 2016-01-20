var helpers = require('../../common.js');

describe('Volumes delete', function(){

  var volumesItem = element.all(by.css('ul .tc_menuitem > a')).get(3);
  var volumeNameInput = element(by.model('volume.name'));
  var volumePoolSelect = element(by.model('data.sourcePool'));
  var submitButton = element(by.css('.tc_submitButton'));
  var addBtn = element(by.css('.tc_add_btn'));

  var usePool = function(pool, callback){
    addBtn.click();
    volumePoolSelect.sendKeys(pool.name);
    callback(pool.name, pool);
  };

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    volumesItem.click();
  });

  it('should create a volume of each configured volume types in every configured pool', function(){
    for(var key in helpers.configs.pools){
      var pool = helpers.configs.pools[key];
      for(var i=0; i < pool.volumeTypes.length; i++){
        usePool(pool, function(exact_poolname, pool){
          var volumeType = pool.volumeTypes[i];
          var volumename = ('e2e_' + exact_poolname + '_' + volumeType).replace(/[^a-zA-Z0-9+_.-]/g, "_");
          var volume = element(by.cssContainingText('tr', volumename));

          //create a volume
          volumeNameInput.sendKeys(volumename);
          element(by.cssContainingText('label', volumeType)).click();
          element(by.id('data.megs')).sendKeys('100mb');
          submitButton.click();

          //is it displayed on the volume overview?
          browser.sleep(helpers.configs.sleep);
          expect(volume.isDisplayed()).toBe(true);
        });
      }
    }
  });

  it('delete all e2e volumes', function(){
    // Select all e2e volumes.
    element.all(by.cssContainingText('tr', 'e2e_')).all(by.css("input")).click();

    // Delete all volumes.
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_deleteItem')).click();
    element(by.model('input.enteredName')).sendKeys("yes");
    element(by.id('bot2-Msg1')).click();

    // Check if they are deleted.
    browser.sleep(10000);
    expect(element.all(by.cssContainingText('tr', 'e2e_'))).toEqual([]);
  });
});
