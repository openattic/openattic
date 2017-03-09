var helpers = require('../../../common.js');

describe('creates a clone filesystem volume from a snapshot', function(){
  var snapshotname = 'protractor_snap_to_clone_fs';
  var clonename = 'protractor_filesystem_clone';
  var clone = element.all(by.cssContainingText('tr', clonename)).get(0);
  var volumename = 'protractor_clone_fsVol';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  beforeAll(function(){
    helpers.login();
    helpers.create_volume(volumename, 'xfs');
    helpers.create_snapshot(volume, snapshotname);
    helpers.create_snap_clone(volume, snapshotname, clonename);
    browser.sleep(800);
  });

  it('should display the clone in the volumes list', function(){
    browser.sleep(800);
    expect(clone.isDisplayed()).toBe(true);
  });

  it('should delete the clone volume', function(){
    helpers.delete_volume(clone, clonename);
  });

  afterAll(function(){
    helpers.delete_snapshot(volume, snapshotname);
    helpers.delete_volume(volume, volumename);
    console.log('snapshot_clone -> filesystem_vol_snapshot_clone.e2e.js');
  });

});
