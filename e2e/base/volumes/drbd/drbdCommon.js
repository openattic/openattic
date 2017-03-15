'use strict';
var helpers = require('../../../common.js');

(function(){
	var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
	var volumeName = 'drbd01';
	var volume = element(by.cssContainingText('tr', volumeName));
	var pool = helpers.configs.pools['vg01'];
	var remotePool = helpers.configs.pools['vg04'];
	var volumePoolEl = element(by.model('pool'));
	var mirroredEl = element(by.model('result.is_mirrored'));
	var remotePoolEl = element(by.model('data.remote_pool'));
	var syncRateEl = element(by.model('result.syncer_rate'));
	var protocolEl = element(by.model('result.protocol'));

	var drbdCommon = {
		volumeName: volumeName,
		volume: volume,

		create_volume: function(name, options) {
			options.type = options.type == undefined ? 'lun' : options.type;
			options.size = options.size == undefined ? '100MB' : options.size;
			options.syncrate = options.syncrate == undefined ? '30M' : options.syncrate;
			options.protocol = options.protocol == undefined ? 'C' : options.protocol;
			options.validate = options.validate == undefined ? true : options.validate;

			volumesItem.click();
			element(by.css('oadatatable .tc_add_btn')).click();

			// Set the volume name.
			element(by.model('result.name')).sendKeys(name);

			// Select the pool.
			volumePoolEl.element(by.cssContainingText('option', pool.name +
				' (volume group,')).click();

			// Set the volume size.
			element(by.model('data.megs')).sendKeys(options.size);

			// Select the type.
			element(by.id(options.type)).click();

			// Select the 'Volume Mirroring' checkbox.
			expect(mirroredEl.isPresent()).toBe(true);
			mirroredEl.click();

			// Select the remote pool.
			browser.sleep(helpers.configs.sleep);
			remotePoolEl.element(by.cssContainingText('option', remotePool.name +
				' (volume group,')).click();

			// Set the syncer rate.
			syncRateEl.clear();
			syncRateEl.sendKeys(options.syncrate);

			// Select the protocol.
			protocolEl.element(by.cssContainingText('option', '(' + options.protocol +
				')')).click();

			// Press the 'Submit' button.
			element(by.css('.tc_submitButton')).click();

			// Is the mirrored volume created?
			if (options.validate) {
				browser.sleep(helpers.configs.sleep);
				expect(helpers.get_list_element(name).isDisplayed()).toBe(true);
			}
		}
	};
	module.exports = drbdCommon;
}());
