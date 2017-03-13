var helpers = require('../../../common.js');
var drbdCommon = require('../drbdCommon.js');

describe('Should resize a mirrored volume', function(){
	var volumename = 'drbd01';
	var volume = element.all(by.cssContainingText('tr', volumename)).get(0);
	var actionMenu = element(by.css('.tc_menudropdown'));

	beforeAll(function(){
		helpers.login();
		drbdCommon.create_mirrored_volume(volumename, 'xfs', '500mb');
		browser.sleep(400);
	});

	beforeEach(function(){
		browser.refresh();
	});

	it('volume: should have a resize button instead of a clone button', function(){
		volume.click();
		expect(element(by.css('.tc_resize_btn')).isDisplayed()).toBe(true);
		expect(element(by.css('.tc_clone_btn')).isDisplayed()).toBe(false);
	});

	it('volume: should not have a disabled resize menu entry', function(){
		volume.click();
		actionMenu.click();
		expect(element.all(by.css('.oa-dropdown-actions li.disabled a')).count()).toBe(0);
	});

	it('subvolume: should have a disabled resize menu entry', function(){
		subvolume.click();
		actionMenu.click();
		expect(element(by.css('.oa-dropdown-actions li.disabled a')).getText()).toBe("Resize");
	});

	afterAll(function(){
		helpers.delete_volume(volume, volumename);
		console.log('volumes_resize -> drbd_resize.e2e.js');
	});
});
