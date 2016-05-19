var helpers = require('../common.js');

describe('Storage Tab Test based on blockvol', function(){
  var volumename = 'blockvol_storageTabTest';
  var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

  beforeAll(function(){
    helpers.login();
    element.all(by.css('ul .tc_menuitem_volumes > a')).click();
    helpers.create_volume(volumename, 'lun');
  });

  it('should only display storage tabs / options which make sense for a block volume', function(){

    expect(volume.isPresent()).toBe(true);
    volume.click();

    expect(element(by.css('.tc_statusTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_statusTab')).getText()).toEqual('Status');

    expect(element(by.css('.tc_snapshotTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_snapshotTab')).getText()).toEqual('Snapshots');

    expect(element(by.css('.tc_iscsi_fcTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_iscsi_fcTab')).getText()).toEqual('iSCSI/FC');

    expect(element(by.css('.tc_storageTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_storageTab')).getText()).toEqual('Storage');

    expect(element(by.css('.tc_blockStatisticsTab')).isDisplayed()).toBe(true);
    expect(element(by.css('.tc_blockStatisticsTab')).getText()).toEqual('Statistics');

  });

  it('should check the url of status tab', function(){
    element(by.css('.tc_statusTab')).click();
    expect(browser.getCurrentUrl()).toContain('status');
  });

  it('should check the url of statistics', function(){
    element(by.css('.tc_blockStatisticsTab')).click();
    expect(browser.getCurrentUrl()).toContain('statistics/perf');
  });

  it('should not display any of the following tabs', function(){

    expect(element(by.css('.tc_fsStatisticsTab')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_cifsShareTab')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_nfsShareTab')).isDisplayed()).toBe(false);
    expect(element(by.css('.tc_httpShareTab')).isDisplayed()).toBe(false);

  });

  afterAll(function(){
    helpers.delete_volume(volume, volumename);
    console.log('general -> blockvol_storage_tabs.e2e.js');
  });

});
