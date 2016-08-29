var helpers = require('../../../common.js');

describe('Volumes add', function(){

  var volumePoolSelect = element(by.model('pool'));
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  var addBtn = element(by.css('.tc_add_btn'));

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('ul .tc_menuitem_volumes > a')).click();
    browser.sleep(400);
    addBtn.click();
    browser.sleep(400);
  });

  it('should display a description when selecting a volume type (volume group)', function(){
    volumePoolSelect.click();
    // TODO make use the zpool here
    // after you have done the beneath
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

        // TODO Remove the static index numbers.
        // Will not work if no zfs exists -> Therefor moved here from base/volumes/add/volume_add.e2e.js

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

  afterAll(function(){
    console.log('zfs_volumes_add -> volumes_add.e2e.js');
  });
});
