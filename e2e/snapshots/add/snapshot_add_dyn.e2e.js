var helpers = require('../../common.js');

describe('Should open the snapshot dialog of fs that create dynamic snapshots', function(){
  var types = ['btrfs', 'zfs'];

  beforeAll(function(){
    helpers.login();
  });

  types.forEach(function(type){
    var volumename = 'protractor_testvol_' + type;
    var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
    it('should not show size input while creating a ' + type + ' snapshot', function(){
      console.log(volumename);
      helpers.create_volume(volumename, type);
      volume.click();
      element(by.css('.tc_snapshotTab')).click();
      element(by.css('.tc_snapshotAdd')).click();
      expect(element(by.id('megs')).isDisplayed()).toBe(false);
      helpers.delete_volume(volume, volumename);
    });
  });

  afterAll(function(){
    console.log('snapshot -> snapshot_add_dyn.e2e.js');
  });
});
