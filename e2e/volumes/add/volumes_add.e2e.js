var helpers = require('../../common.js');

describe('Volumes add', function(){

  var volumeNameInput = element(by.model('result.name'));
  var volumePoolSelect = element(by.model('pool'));
  var volumeSizeInput = element(by.model('data.megs'));
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var submitButton = element(by.css('.tc_submitButton'));
  var addBtn = element(by.css('.tc_add_btn'));

  var usePool = function(pool, callback){
    volumePoolSelect.sendKeys(pool.name);
    browser.sleep(helpers.configs.sleep);
    callback(pool.name, pool);
  };

  var forEachPool = function(callback){
    for(var key in helpers.configs.pools){
      usePool(helpers.configs.pools[key], callback);
    }
  };

  var withFirstPool = function(callback){
    for(var key in helpers.configs.pools){
      usePool(helpers.configs.pools[key], callback);
      break;
    }
  };

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    browser.sleep(400);
    addBtn.click();
    browser.sleep(400);
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
    expect(volumePoolSelect.isDisplayed()).toBe(true);
  });

  it('should have a volume size input field', function(){
    expect(volumeSizeInput.isDisplayed()).toBe(true);
  });

  it('should stay on the create volume form if the submit button is clicked without editing anything', function(){
    submitButton.click();

    expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes/add');
  });

  it('should show required field errors if the submit button is clicked without editing anything', function(){
    volumeNameInput.clear();
    browser.sleep(400);
    submitButton.click();
    browser.sleep(400);

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
      browser.sleep(400);
      var pool_size = volumeSizeInput.evaluate('data.pool.usage.free_text').then(function(psize){
          browser.sleep(400);
          expect(element(by.css('.tc_poolAvailableSize')).getText()).toContain(psize + ' free');
          expect(element(by.css('.tc_poolAvailableSize')).isDisplayed()).toBe(true);
        });

      var pool_space = volumeSizeInput.evaluate('data.pool.usage.size_text').then(function(size){
        expect(element(by.css('.tc_poolSize')).getText()).toContain(size + ' used');
      });
    });
  });

  it('should show the correct hostname of the selected pool', function(){
    forEachPool(function(exact_poolname){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      browser.sleep(400);
      volumePoolSelect.evaluate('pool.host.title').then(function(host){
        browser.sleep(400);
        expect(volumePoolSelect.getText()).toContain(host);
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
      browser.sleep(400);
      var volumeSize = (pool.size + 0.1).toFixed(2);
      volumeSizeInput.clear().sendKeys(volumeSize + pool.unit);
      browser.sleep(400);
      expect(element(by.css('.tc_wrongVolumeSize')).isDisplayed()).toBe(true);
    });
  });

  it('should allow a volume size that is as high as the selected pool capacity', function(){
    forEachPool(function(exact_poolname){
      element.all(by.cssContainingText('option', exact_poolname)).get(0).click();
      browser.sleep(400);
      var pool_size = volumeSizeInput.evaluate('data.pool.usage.free_text').then(function(psize){
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
      browser.sleep(400);
      for(var i = 0; i < pool.volumeTypes.length; i++){
        expect(element(by.cssContainingText('label', pool.volumeTypes[i])).isDisplayed()).toBe(true);
      }
    });
  });

  it('should display a description when selecting a volume type (volume group)', function(){
    volumePoolSelect.click();
    element.all(by.cssContainingText('option', '(volume group,')).get(0).click();

    var descriptions = element.all(by.repeater('(fs, text) in filesystems'))
      .then(function(descriptions){
        descriptions[0].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('iSCSI, Fibre Channel shares and volume mirroring');
        });

        element(by.id('xfs')).click();
        descriptions[1].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('recommended for virtualization, optimized for parallel IO');
        });

        element(by.id('zfs')).click();
        descriptions[2].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('supports snapshots, deduplication and compression');
        });

        element(by.id('btrfs')).click();
        descriptions[3].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('supports snapshots, compression - Experimental');
        });

        element(by.id('ext4')).click();
        descriptions[4].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('max. 1 EiB - Linux default');
        });

        element(by.id('ext3')).click();
        descriptions[5].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('max. 32TiB - old Linux default since 2010');
        });

        element(by.id('ext2')).click();
        descriptions[6].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
          expect(txt).toEqual('deprecated');
        });
    });
  });

  it('should display a description when selecting a volume type (zpool)', function(){
    volumePoolSelect.click();
    element.all(by.cssContainingText('option', '(zpool,')).get(0).click();

    var descriptions = element.all(by.repeater('(fs, text) in filesystems'))
      .then(function(descriptions){
        descriptions[0].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
        expect(txt).toEqual('iSCSI, Fibre Channel shares and volume mirroring');
      });

      element(by.id('zfs')).click();
      browser.sleep(400);
      descriptions[2].element(by.css('.text-info')).evaluate('text.desc').then(function(txt){
        expect(txt).toEqual('supports snapshots, deduplication and compression');
      });
   });
  });

  it('should show a message if the chosen volume size is smaller than 100mb', function(){
    withFirstPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('99mb');
      browser.sleep(400);
      expect(element(by.css('.tc_wrongVolumeSize')).isPresent()).toBe(true);
    });
  });

  it('should show a message if the given volume size is just a string', function(){
    withFirstPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('abc');
      browser.sleep(400);
      expect(element(by.css('.tc_noValidNumber')).isPresent()).toBe(true);
    });
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
  //       var pool_size = volumeSizeInput.evaluate('data.pool.usage.free_text').then(function(psize){
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
    withFirstPool(function(exact_poolname, pool){
      volumeSizeInput.clear().sendKeys('120asd');
      browser.sleep(400);
      expect(element(by.css('.tc_noValidNumber')).isDisplayed()).toBe(true);
    });
  });

  it('should only allow unique volume names', function(){
    withFirstPool(function(exact_poolname, pool){
      //create a volume
      volumeNameInput.sendKeys(volumename);
      browser.sleep(400);
      volumeSizeInput.sendKeys('100mb');
      browser.sleep(400);
      submitButton.click();
      browser.sleep(helpers.configs.sleep);

      //try to create the volume again
      element(by.css('.tc_add_btn')).click();
      browser.sleep(400);
      volumeNameInput.sendKeys(volumename);
      browser.sleep(400);
      expect(element(by.css('.tc_noUniqueName')).isDisplayed()).toBe(true);
      browser.sleep(400);
      element(by.css('.tc_backButton')).click();
      browser.sleep(400);
      //delete the volume
      helpers.delete_volume(volume, volumename);
    });
  });

  var testTypes = function(pool){
    pool.volumeTypes.forEach(function(type){
      var volumename = pool.name + '_' + type;
      var volume = element(by.cssContainingText('tr', volumename));

      it('should create a ' + type + ' on ' + pool.name , function(){
        helpers.create_volume(volumename, type.toLowerCase(), '100MB', pool.name);
        expect(volume.isDisplayed()).toBe(true);
      });

      it('should delete a ' + type + ' on ' + pool.name , function(){
        helpers.delete_volume(volume, volumename);
        expect(volume.isPresent()).toBe(false);
      });
    });
  };

  //Create and delete every type on every pool (configs.js)
  for(var key in helpers.configs.pools){
    testTypes(helpers.configs.pools[key]);
  }

  afterAll(function(){
    console.log('volumes_add -> volumes_add.e2e.js');
  });
});
