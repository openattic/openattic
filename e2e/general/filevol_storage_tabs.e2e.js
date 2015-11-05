var helpers = require('../common.js');

describe('Storage Tab Test based on filevol', function(){
  var volumename = 'filevol_storageTabTest';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);


  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem')).get(3).click();
    helpers.create_volume(volumename, "xfs");

  });

  it('should only display storage tabs / options which make sense for a filesystem volume', function(){
    expect(volume.isPresent()).toBe(true);
    volume.click();

    expect(element(by.css('.tc_statusTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_statusTab')).getText()).toEqual('Status');

    expect(element(by.css('.tc_fsStatisticsTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_fsStatisticsTab')).getText()).toEqual('Statistics');

    expect(element(by.css('.tc_cifsShareTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_cifsShareTab')).getText()).toEqual('CIFS');

    expect(element(by.css('.tc_nfsShareTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_nfsShareTab')).getText()).toEqual('NFS');

    expect(element(by.css('.tc_httpShareTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_httpShareTab')).getText()).toEqual('HTTP');

    expect(element(by.css('.tc_storageTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_storageTab')).getText()).toEqual('Storage');

    expect(element(by.css('.tc_snapshotTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_snapshotTab')).getText()).toEqual('Snapshots');


  });

  //TODO enable these tests after storage tabs bug has been fixed
  //  it('should not display any of the following tabs', function(){
  //    expect(element(by.css('.tc_iscsi_fcTab')).isDisplayed()).toBe(false);
  //    expect(element(by.css('.tc_blockStatisticsTab')).isDisplayed()).toBe(false);
  //  });

  afterAll(function(){
    console.log('filesystemvolume storage tab test ended');
    helpers.delete_volume(volume, volumename);
  });

});