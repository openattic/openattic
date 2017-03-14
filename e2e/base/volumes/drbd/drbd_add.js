var helpers = require('../../../common.js');
var drbdCommon = require('./drbdCommon.js');

describe('Should add an mirrored volume', function(){
    beforeAll(function(){
        helpers.login();
    });

    it('should create a mirrored volume w/o filesystem', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, 'lun', '100mb', '10M', 'A');
    });

    it('should delete the "drbd01" volume w/o filesystem', function(){
        helpers.delete_volume(drbdCommon.volume, drbdCommon.volumeName);
    });

    it('should not show the "drbd01" volume w/o filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    it('should create a mirrored volume with filesystem', function(){
    	drbdCommon.create_volume(drbdCommon.volumeName, 'ext4', '200MB', '30M', 'C');
    });

    it('should delete the "drbd01" volume with filesystem', function(){
        helpers.delete_volume(drbdCommon.volume, drbdCommon.volumeName);
    });

    it('should not show the "drbd01" volume with filesystem anymore', function(){
        expect(drbdCommon.volume.isPresent()).toBe(false);
    });

    afterAll(function(){
        console.log('volumes_add -> volumes_add_drbd.e2e.js');
    });
});
