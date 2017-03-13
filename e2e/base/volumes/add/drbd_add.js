var helpers = require('../../../common.js');
var drbdCommon = require('../drbdCommon.js');

describe('Should add an mirrored volume', function(){
    var volumename = 'drbd01';
	var volume = element(by.cssContainingText('tr', volumename));

    beforeAll(function(){
        helpers.login();
    });

    beforeEach(function(){
        element(by.css('ul .tc_menuitem_volumes > a')).click();
        var addBtn = element(by.css('oadatatable .tc_add_btn'));
        addBtn.click();
    });

    it('should have a mirrored checkbox', function(){
    	expect(drbdCommon.mirroredCheckbox.isPresent()).toBe(true);
    });

    it('should create a mirrored volume w/o filesystem', function(){
    	drbdCommon.create_mirrored_volume(volumename, 'lun', '100mb', '10M', 'A');
    });

    it('should delete the "drbd01" volume w/o filesystem', function(){
        volume.click();
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
        expect(volume.isPresent()).toBe(false);
    });

    it('should create a mirrored volume with filesystem', function(){
    	drbdCommon.create_mirrored_volume(volumename, 'ext4', '200MB');
    });

    it('should delete the "drbd01" volume with filesystem', function(){
        volume.click();
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
        expect(volume.isPresent()).toBe(false);
    });

    afterAll(function(){
        console.log('volumes_add -> volumes_add_drbd.e2e.js');
    });
});
