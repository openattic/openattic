var helpers = require('../common.js');

describe('Storage Tab Test based on blockvol', function(){
	var volumename = 'blockvol_storageTabTest';
	var volume = element.all(by.cssContainingText('tr', volumename)).get(0);

	beforeAll(function(){
		helpers.login();
		element.all(by.css('ul .tc_menuitem')).get(3).click();
		helpers.create_volume(volumename, "lun");
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

	it('should not display any of the following tabs', function(){

		expect(element(by.css('.tc_fsStatisticsTab')).isDisplayed()).toBe(false);
		expect(element(by.css('.tc_cifsShareTab')).isDisplayed()).toBe(false);
		expect(element(by.css('.tc_nfsShareTab')).isDisplayed()).toBe(false);
		expect(element(by.css('.tc_httpShareTab')).isDisplayed()).toBe(false);

	});

	afterAll(function(){
		console.log('blockvolume storage tab test ended');
		helpers.delete_volume(volume, volumename);
	});

});
