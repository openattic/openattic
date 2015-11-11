var helpers = require('../../common.js');

describe('Volumes add', function(){

  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var volumeNameInput = element(by.model('volume.name'));
  var volumePoolSelect = element(by.model('data.sourcePool'));
  var volumeSizeInput = element(by.model('data.megs'));
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var submitButton = element(by.css('.tc_submitButton'));
  var addBtn = element(by.css('.tc_add_btn'));
      
  var selectPool = function(pool_name){
        volumePoolSelect.sendKeys(pool_name).then(function (pname){
          if(pool_name === pname){
            return pool_name;
          }
        });
      };
  var forEachPool = function(callback, onlyWithFirstPool){
        for(var key in helpers.configs.pools){
          var pool = helpers.configs.pools[key],
          exact_poolname = selectPool(pool.name);

          if(exact_poolname){
            console.log(exact_poolname);
            callback(exact_poolname, pool);
          }

          if(onlyWithFirstPool){
            break;
          }
        }
      };

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    volumesItem.click();
    addBtn.click();
  });

  it('should open an add volume form with "Create Volume:" header', function(){
    expect(element(by.css('.tc_formHeadline')).getText()).toEqual('Create Volume:');
  });

  it('should have a back button', function(){
    expect(element(by.css('.tc_backButton')).isPresent()).toBe(true);
  });

  it('should have a back button to navigate back to the volume overview', function(){
    var backButton = element(by.css('.tc_backButton'));
    backButton.click();

    expect(element(by.css('.tc_oadatatable_volumes')).isPresent()).toBe(true);
  });

  it('should show the typed in volume name in the header', function(){
    volumeNameInput.sendKeys('protractor_test');

    expect(element(by.css('.tc_formHeadline')).getText()).toEqual('Create Volume: protractor_test');
  });

  it('should have a volume name input field', function(){
    expect(volumeNameInput.isDisplayed()).toBe(true);
  });

  it('should have a volume pool select box', function(){
    expect(element(by.id('data.sourcePool')).isDisplayed()).toBe(true);
  });

  it('should have a volume size input field', function(){
    expect(element(by.id('data.megs')).isDisplayed()).toBe(true);
  });

  it('should stay on the create volume form if the submit button is clicked without editing anything', function(){
    submitButton.click();

    expect(element(by.id('ribbon')).getText()).toEqual('Volumes Add');
  });

  it('should show required field errors if the submit button is clicked without editing anything', function(){
    volumeNameInput.clear();
    submitButton.click();

    expect(element(by.css('.tc_nameRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_poolRequired')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_sizeRequired')).isDisplayed()).toBe(true);
  });

  it('should offer a list of volume pools', function(){
    volumePoolSelect.click();
    expect(volumePoolSelect.all(by.css('select .tc_volumePoolOption')).count()).toBeGreaterThan(0);
  });


  it('should have the configured pools', function(){
    forEachPool(function(exact_poolname){
      expect(element.all(by.cssContainingText('option', exact_poolname)).get(0).isDisplayed()).toBe(true);
    });
  });

  it('should show the correct size of the selected pool', function(){
    forEachPool(function(exact_poolname){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      var pool_size = element(by.id('data.megs')).evaluate('data.sourcePool.usage.free_text').then(function(psize){
          browser.sleep(400);
          expect(element(by.css('.tc_poolAvailableSize')).getText()).toContain(psize + ' free');
          expect(element(by.css('.tc_poolAvailableSize')).isDisplayed()).toBe(true);
        });

      var pool_space = element(by.id('data.megs')).evaluate('data.sourcePool.usage.size_text').then(function(size){
        expect(element(by.css('.tc_poolSize')).getText()).toContain(size + ' used');
      });
    });
  });

  // note: by using pool.size (see config.js) this test will only work with a brand new added pool!!! 
  //   it('should allow a volume size that is smaller than the selected pool capacity', function(){
  // 
  // 
  //     for(var key in helpers.configs.pools){
  //       var pool = helpers.configs.pools[key];
  //       volumePoolSelect.click();
  //       volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();
  // 
  //       var volumeSize = (pool.size - 0.1).toFixed(2);
  //       volumeSizeInput.clear().sendKeys(volumeSize + pool.unit);
  // 
  //       expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(false);
  //     }
  //   });

  it('should not allow a volume size that is higher than the selected pool capacity', function(){
    forEachPool(function(exact_poolname, pool){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      var volumeSize = (pool.size + 0.1).toFixed(2);
      volumeSizeInput.clear().sendKeys(volumeSize + pool.unit);
      expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(true);
    });
  });

  it('should allow a volume size that is as high as the selected pool capacity', function(){
    forEachPool(function(exact_poolname){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      var pool_size = element(by.id('data.megs')).evaluate('data.sourcePool.usage.free_text').then(function(psize){
        //console.log(psize);
        browser.sleep(400);
        volumeSizeInput.clear().sendKeys(psize);
        expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(false);
      });
    });
  });

  it('should show the predefined volume types for each pool', function(){
    forEachPool(function(exact_poolname, pool){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      for(var i = 0; i < pool.volumeTypes.length; i++){
        expect(element(by.cssContainingText('label', pool.volumeTypes[i])).isDisplayed()).toBe(true);
      }
    });
  });

  it('should show a message if the chosen volume size is smaller than 100mb', function(){
    forEachPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('99mb');
      expect(element(by.css('.tc_wrongVolumeSize')).isPresent()).toBe(true);
    }, true);
  });

  it('should show a message if the given volume size is just a string', function(){
    forEachPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('abc');
      expect(element(by.css('.tc_noValidNumber')).isPresent()).toBe(true);
    }, true);
  });

  //   it('should show link text "use max" after selecting a pool', function(){
  //     expect(element(by.linkText('use max')).isPresent()).toBe(false);
  //     for(var key in helpers.configs.pools){
  //       var pool = helpers.configs.pools[key];
  //       volumePoolSelect.click();
  //       element.all(by.cssContainingText('option', '(volume group,')).get(0).click();
  //       expect(element(by.linkText('use max')).isDisplayed()).toBe(true);
  //       element(by.linkText('use max')).click();
  //       
  //       var pool_size = element(by.id('data.megs')).evaluate('data.sourcePool.usage.free_text').then(function(psize){
  //         browser.sleep(400);
  //         expect(element(by.css('.tc_poolAvailableSize')).getText()).toContain(psize + ' free');
  //         volumeSizeInput.getAttribute('value').then(function(sizeMB){
  //           var cache_size = (parseInt(sizeMB, 10) / 1024).toString();
  //           var final_size = cache_size.slice(0, cache_size.indexOf(".") + 3);
  //           //console.log(final_size);
  //           expect(final_size + 'GB').toEqual(psize);
  //         });
  //       });
  //       
  //       break;
  //     }
  //   });

  it('should show a message if the given volume size is a combination of numbers and string', function(){
    forEachPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('120asd');
      expect(element(by.css('.tc_noValidNumber')).isDisplayed()).toBe(true);
    }, true);
  });

  it('should only allow unique volume names', function(){
    forEachPool(function(exact_poolname, pool){
      //create a volume
      volumeNameInput.sendKeys(volumename);
      element(by.id('data.megs')).sendKeys('100mb');
      submitButton.click();
      browser.sleep(helpers.configs.sleep);

      //try to create the volume again
      element(by.css('.tc_add_btn')).click();
      volumeNameInput.sendKeys(volumename);
      expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
      element(by.css('.tc_backButton')).click();

      //delete the volume
      helpers.delete_volume(volume, volumename);
    }, true);
  });

  it('should create a volume of the configured volume types in the configured pools', function(){
    forEachPool(function(exact_poolname, pool){
      for(var i=0; i < pool.volumeTypes.length; i++){
        var volumeType = pool.volumeTypes[i];
        var volumename = 'protractor_volume_' + exact_poolname;
        var volume = element(by.cssContainingText('tr', volumename));

        //create a volume
        volumeNameInput.sendKeys(volumename);
        console.log(volumename);

        element(by.cssContainingText('label', volumeType)).click();
        element(by.id('data.megs')).sendKeys('100mb');
        submitButton.click();

        //is it displayed on the volume overview?
        browser.sleep(helpers.configs.sleep);
        expect(volume.isDisplayed()).toBe(true);

        //delete the volume
        volume.click();
        browser.sleep(400);
        element(by.css('.tc_menudropdown')).click();
        browser.sleep(400);
        element(by.css('.tc_deleteItem')).click();
        browser.sleep(400);

        element(by.model('input.enteredName')).sendKeys(volumename);
        element(by.id('bot2-Msg1')).click();

        expect(volume.isPresent()).toBe(false);
        
        addBtn.click();
        console.log('volumes_add');
        selectPool(exact_poolname);
      }
    });
  });
});
