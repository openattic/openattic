'use strict';
var helpers = require('../../common.js');

(function(){
	var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
	var volumeName = 'drbd01';
	var volume = element(by.cssContainingText('tr', volumename));
	var pool = helpers.configs.pools['vg01'];
	var remotePool = helpers.configs.pools['vg02'];
	var volumePoolSelect = element(by.model('pool'));
	var mirroredCheckbox = element(by.model('result.is_mirrored'));
	var remotePoolSelect = element(by.model('data.remote_pool'));

	var drbdCommon = {
		volumeName: volumeName,
		volume: volume,
		mirroredCheckbox: mirroredCheckbox,

		create_volume: function(name, type, size, syncerRate, protocol) {
			type = type == null ? 'lun' : type;
			size = size == null ? '100MB' : size;
			syncerRate = syncerRate == null ? '30M' : syncerRate;
			protocol = protocol == null ? 'C' : protocol;

			volumesItem.click();
			element(by.css('oadatatable .tc_add_btn')).click();

			// Set the volume name.
			element(by.model('result.name')).sendKeys(name);

			// Select the pool.
			volumePoolSelect.click();
			element.all(by.cssContainingText('option', pool.name + ' (volume group,')).get(0).click();

			// Set the volume size.
			element(by.model('data.megs')).sendKeys(size);

			// Select the type.
			element(by.id(type)).click();

			// Select the 'Volume Mirroring' checkbox.
			expect(drbdCommon.mirroredCheckbox.isPresent()).toBe(true);
			mirroredCheckbox.click();

			// Select the remote pool.
			remotePoolSelect.click();
			element.all(by.cssContainingText('option', remotePool.name + ' (volume group,')).get(0).click();

			// Set the syncer rate.
			element(by.model('result.syncer_rate')).sendKeys(syncerRate);

			// Select the protocol.
			protocolSelect.click();
			element.all(by.cssContainingText('option', '(' + protocol + ')')).get(0).click();

			// Press the 'Submit' button.
			element(by.css('.tc_submitButton')).click();

			// Is the mirrored volume created?
			browser.sleep(helpers.configs.sleep);
			expect(helpers.get_list_element(name).isDisplayed()).toBe(true);
		}
	};
	module.exports = drbdCommon;
}());
