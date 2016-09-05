var helpers = require('../../../common.js');

describe('Should open the snapshot dialog of fs that creates a btrfs snapshot', function(){
  var type = 'btrfs';
  var volumename = 'protractor_testvol_' + type;
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  beforeAll(function(){
    helpers.login();
  });


  it('should not show size input while creating a ' + type + ' snapshot', function(){
    helpers.create_volume(volumename, type);
    volume.click();
    element(by.css('.tc_snapshotTab')).click();
    element(by.css('.tc_snapshotAdd')).click();
    expect(element(by.id('megs')).isDisplayed()).toBe(false);
    helpers.delete_volume(volume, volumename);
  });

  afterAll(function(){
    console.log('snapshot -> base/snapshots/add/snapshot_add_btrfs.e2e.js');
  });
});
