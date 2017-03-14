var helpers = require('../../../common.js');
var drbdCommon = require('./drbdCommon.js');

describe('Should resize a mirrored volume', function(){
	var submit_button = element(by.id('bot2-Msg1'));
  	var cancel_button = element(by.id('bot1-Msg1'));

	beforeAll(function(){
		helpers.login();
		drbdCommon.create_volume(drbdCommon.volumeName, 'xfs', '500mb');
	});

	it('should have a resize button instead of a clone button', function(){
		drbdCommon.volume.click();
		expect(element(by.css('.tc_resize_btn')).isDisplayed()).toBe(true);
		expect(element(by.css('.tc_clone_btn')).isDisplayed()).toBe(false);
	});

	it('should have a resize and a cancel button', function(){
		element(by.css('.tc_resize_btn')).click();
		expect(submit_button.isDisplayed()).toBe(true);
		expect(cancel_button.isDisplayed()).toBe(true);
		cancel_button.click();
	});

	afterAll(function(){
		helpers.delete_volume(drbdCommon.volume, drbdCommon.volumeName);
		console.log('volumes_drbd -> volume_resize.e2e.js');
	});
});
