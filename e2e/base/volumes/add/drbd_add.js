var helpers = require('../../../common.js');
var drbdCommon = require('../drbdCommon.js');

describe('Should add an mirrored volume', function(){
    beforeAll(function(){
        helpers.login();
    });

    it('should create a mirrored volume w/o filesystem', function(){
    	drbdCommon.create_mirrored_volume(drbdCommon.volumeName, 'lun', '100mb', '10M', 'A');
    });

    it('should delete the "drbd01" volume w/o filesystem', function(){
        drbdCommon.volume.click();
        browser.sleep(400);
        element(by.css('.tc_menudropdown')).click();
        browser.sleep(400);
        element(by.css('.tc_deleteItem')).click();
        browser.sleep(400);
        element(by.model('input.enteredName')).sendKeys('yes');
        element(by.id('bot2-Msg1')).click();
        browser.sleep(400);
    });

    it('should not show the "drbd01" volume w/o filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    it('should create a mirrored volume with filesystem', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, 'ext4', '200MB', '30M', 'C');
    });

    it('should delete the "drbd01" volume with filesystem', function(){
        drbdCommon.volume.click();
        browser.sleep(400);
        element(by.css('.tc_menudropdown')).click();
        browser.sleep(400);
        element(by.css('.tc_deleteItem')).click();
        browser.sleep(400);
        element(by.model('input.enteredName')).sendKeys('yes');
        element(by.id('bot2-Msg1')).click();
        browser.sleep(400);
    });

    it('should not show the "drbd01" volume with filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    afterAll(function(){
        console.log('volumes_add -> volumes_add_drbd.e2e.js');
    });
});
