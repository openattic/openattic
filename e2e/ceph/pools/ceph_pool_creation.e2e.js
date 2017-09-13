'use strict';

var helpers = require('../../common.js');
var cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool creation', function(){
  var cephPoolProperties = new cephPoolCommon();

  const createName = (type, pgs) => ['e2e', type, 'with', pgs, 'pgs'].join('_');

  beforeAll(function(){
    helpers.login();
    cephPoolProperties.cephPools.click();
  });

  [64, 128].forEach(function(pgs){
    ['replicated', 'erasure'].forEach(function(type){
      const name = createName(type, pgs);
      it('should create a ceph pool named ' + name, function(){
        cephPoolProperties.addButton.click();
        cephPoolProperties.createPool(name, type, pgs);
      });
      it('should delete pool named ' + name, function(){
        cephPoolProperties.deletePool(name);
      });
    });
  });

  if(cephPoolProperties.isBluestore){ // TODO: Fix this as it will always resolve to true
    const ecName = createName('erasure', 32);
    it('should create pool with overwrite enabled named ' + ecName, function(){
      cephPoolProperties.addButton.click();
      cephPoolProperties.fillForm(ecName, 'erasure', 32);
      cephPoolProperties.checkCheckboxToBe(element(by.model('data.flags.ec_overwrites')));
      cephPoolProperties.submitForm(ecName, 'erasure', 32);
      expect(element(by.className('tc-flag-ec_overwrites')).isDisplayed()).toBe(true);
    });
    it('should delete pool named ' + ecName, function(){
      cephPoolProperties.deletePool(ecName);
    });

    const compressedName = createName('erasure', 16) + '_compressed';
    it('should create a compressed pool', function(){
      cephPoolProperties.addButton.click();
      cephPoolProperties.createPool(compressedName, 'erasure', 16, true);
    });
    it('should delete pool named ' + compressedName, function(){
      cephPoolProperties.deletePool(compressedName);
    });
  }

  afterAll(function(){
    console.log('ceph_pool_creation -> ceph_pool_creation.e2e.js');
  });
});
