var helpers = require('../../../common.js');
var drbdCommon = require('./drbdCommon.js');

describe('Should add an mirrored volume', function(){
    var back_button = element(by.css('.tc_backButton'));

    beforeAll(function(){
        helpers.login();
    });

    it('should show an error message because of a missing sync rate', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, { syncrate: '', validate: false });
    	expect(element(by.css('.tc_syncRateRequired')).isDisplayed()).toBe(true);
    	back_button.click();
    });

    it('should show an error message because of an incorrect sync rate', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, { syncrate: '10K', validate: false });
    	expect(element(by.css('.tc_invalidSyncRate')).isDisplayed()).toBe(true);
    	back_button.click();
    });

    it('should show an error message because of an incorrect sync rate', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, { syncrate: '150M', validate: false });
    	expect(element(by.css('.tc_invalidSyncRate')).isDisplayed()).toBe(true);
    	back_button.click();
    });

    it('should create a mirrored volume w/o filesystem', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, { syncrate: '10M' , protocol: 'A' });
    });

    it('should delete the "drbd01" volume w/o filesystem', function(){
    	browser.sleep(helpers.configs.sleep);
        helpers.delete_volume(drbdCommon.volume, drbdCommon.volumeName);
    });

    it('should not show the "drbd01" volume w/o filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    it('should create a mirrored volume with filesystem', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, { type: 'ext4' });
    });

    it('should delete the "drbd01" volume with filesystem', function(){
    	browser.sleep(helpers.configs.sleep);
        helpers.delete_volume(drbdCommon.volume, drbdCommon.volumeName);
    });

    it('should not show the "drbd01" volume with filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    afterAll(function(){
        console.log('volumes_drbd -> volume_add.e2e.js');
    });
});
