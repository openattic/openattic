'use strict';
var helpers = require('../../../common.js');

describe('Should add an mirrored volume', function(){
    var pool = helpers.configs.pools['vg01'];
    var remotePool = helpers.configs.pools['vg02']
    var mirrored = element(by.model('result.is_mirrored'));
    var volumename = 'drbd01';
    var volumePoolSelect = element(by.model('pool'));
    var volume = element(by.cssContainingText('tr', volumename));
    var remoteVolumePoolSelect = element(by.model('data.remote_pool'));
    var protocolSelect = element(by.model('result.protocol'));
    var typeColumn = volume.element(by.model('row.type.name'));

    beforeAll(function(){
        helpers.login();
    });

    beforeEach(function(){
        element(by.css('ul .tc_menuitem_volumes > a')).click();
        var addBtn = element(by.css('oadatatable .tc_add_btn'));
        addBtn.click();
    });

    it('should have a mirrored checkbox', function(){
        expect(mirrored.isPresent()).toBe(true);
    });

    it('should create a mirrored volume w/o filesystem', function(){
        // Set the volume name.
        element(by.model('result.name')).sendKeys(volumename);

        // Select the pool.
        volumePoolSelect.click();
        element.all(by.cssContainingText('option', pool.name + ' (volume group,')).get(0).click();

        // Set the volume size.
        element(by.model('data.megs')).sendKeys('100mb');

        // Select the 'Volume Mirroring' checkbox.
        mirrored.click();

        // Select the remote pool.
        remoteVolumePoolSelect.click();
        element.all(by.cssContainingText('option', remotePool.name + ' (volume group,')).get(0).click();

        // Set the syncer rate.
        element(by.model('result.syncer_rate')).sendKeys('10M');

        // Select the protocol.
        protocolSelect.click();
        element.all(by.cssContainingText('option', 'Asynchronous')).get(0).click();

        // Press the 'Submit' button.
        element(by.css('.tc_submitButton')).click();
        browser.sleep(helpers.configs.sleep);
    });

    it('should display the "drbd01" volume w/o filesystem in the volume panel', function(){
        expect(volume.isDisplayed()).toBe(true);
        expect(typeColumn).toEqual("connection");
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
        // Set the volume name.
        element(by.model('result.name')).sendKeys(volumename);

        // Select the pool.
        volumePoolSelect.click();
        element.all(by.cssContainingText('option', pool.name + ' (volume group,')).get(0).click();

        // Set the volume size.
        element(by.model('data.megs')).sendKeys('200mb');

        // Select the 'ext4' filesystem.
        element(by.css("label[for='ext4']")).click();

        // Select the 'Volume Mirroring' checkbox.
        mirrored.click();

        // Select the remote pool.
        remoteVolumePoolSelect.click();
        element.all(by.cssContainingText('option', remotePool.name + ' (volume group,')).get(0).click();

        // Set the syncer rate.
        element(by.model('result.syncer_rate')).sendKeys('30M');

        // Select the protocol.
        protocolSelect.click();
        element.all(by.cssContainingText('option', 'Synchronous')).get(0).click();

        // Press the 'Submit' button.
        element(by.css('.tc_submitButton')).click();
        browser.sleep(helpers.configs.sleep);
    });

    it('should display the "drbd01" volume with filesystem in the volume panel', function(){
        expect(volume.isDisplayed()).toBe(true);
        expect(typeColumn).toEqual("ext4");
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
