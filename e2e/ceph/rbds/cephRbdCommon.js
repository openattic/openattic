'use strict';

var rbdCommons = function(){
  var helpers = require('../../common.js');
  this.cephMenu = element(by.css('.tc_menuitem_ceph > a'));
  this.cephRBDs = element(by.css('.tc_submenuitem_ceph_rbds'));
  this.addButton = element(by.css('oadatatable .tc_add_btn'));
  this.clusters = helpers.configs.cephCluster;
  this.clusterCount = Object.keys(this.clusters).length;
  this.clusterSelect = element(by.model('registry.selectedCluster'));

  this.detailAttributes = [
    'Name',
    'Block name prefix',
    'Pool',
    'Size',
    'Object size',
    'Number of objects'
  ];

  this.tableHeaders = [
    {
      name: 'Name',
      displayed: true
    },
    {
      name: 'Poolname',
      displayed: true
    },
    {
      name: 'Size',
      displayed: true
    },
    {
      name: 'Used',
      displayed: true
    },
    {
      name: 'Object size',
      displayed: false
    },
    {
      name: 'Number of objects',
      displayed: false
    }
  ];

  this.formElements = {
    name: {
      name: 'Name',
      testClass: 'tc_rbd_name',
      model: "rbd.name",
      displayed: true
    },
    cluster: {
      name: 'Cluster',
      testClass: 'tc_cluster_selection',
      model: "data.cluster",
      displayed: true,
      items: {
        clusterSelection: 'tc_rbdClusterOption',
        helpCluster: 'tc_clusterRequired',
        helpLoad: 'tc_clusterLoading'
      }
    },
    pool: {
      name: 'Poolname',
      testClass: 'tc_pool_selection',
      model: "data.pool",
      displayed: true,
      items: {
        poolSelection: 'tc_rbdPoolOption',
        poolSize: 'tc_poolSize',
        poolSizeAvailable: 'tc_poolAvailableSize',
        helpPool: 'tc_poolRequired',
        helpLoad: 'tc_poolLoading'
      }
    },
    size: {
      name: 'Size',
      testClass: 'tc_rbd_size',
      model: "data.size",
      displayed: true,
      items: {
        helpSize: 'tc_sizeRequired'
      }
    },
    expertSettings: {
      name: 'Expert Settings',
      testClass: 'tc_expertSettings',
      model: "data.expert",
      displayed: true
    },
    objectSize: {
      name: 'Object size',
      testClass: 'tc_rbd_obj_size',
      model: "data.obj_size",
      displayed: false,
      items: {
        helpSize: 'tc_objSizeRequired'
      }
    },
    features: {
      name: 'Features',
      testClass: 'tc_features',
      displayed: false,
      items: {
        'deep-flatten': 'tc_feature_deep-flatten',
        'layering': 'tc_feature_layering',
        'stripingv2': 'tc_feature_stripingv2',
        'exclusive-lock': 'tc_feature_exclusive-lock',
        'object-map': 'tc_feature_object-map',
        'journaling': 'tc_feature_journaling',
        'fast-diff': 'tc_feature_fast-diff',
        'defaultFeatures': 'tc_featureDefaults',
        'helpSize': 'tc_objSizeRequired'
      }
    }
  };

  this.expertSettings = element(by.model(this.formElements.expertSettings.model));
  this.objSize = element(by.model(this.formElements.objectSize.model));
  this.size = element(by.model(this.formElements.size.model));
  this.name = element(by.model(this.formElements.name.model));
  this.poolSelect = element(by.model(this.formElements.pool.model));
  this.creationClusterSelect = element(by.model(this.formElements.cluster.model));

  this.featureCases = [ // 0 = unchecked; 1 = checked; -1= disabled; 2=true or false should not matter
    //all cases without layering and striping
    [2, 0, 0, 0, -1, -1, -1],
    [2, 0, 0, 1, 0, 2, -1],
    [2, 0, 0, 1, 1, 2, 2],
    //all cases with layering enabled
    [2, 1, -1, 0, -1, -1, -1],
    [2, 1, -1, 1, 0, 2, -1],
    [2, 1, -1, 1, 1, 2, 2],
    //all cases with striping enabled
    [2, -1, 1, 0, -1, -1, -1],
    [2, -1, 1, 1, 0, 2, -1],
    [2, -1, 1, 1, 1, 2, 2]
  ];

  this.isListInSelectBox = function(itemName){
    var item = element(by.model(self.formElements[itemName].model));
    item.click();
    var listEntries = item.all(by.css("." + self.formElements[itemName].testClass + " option"));

    expect(listEntries.count()).toBeGreaterThan(1);
  };

  this.checkCheckboxToBe = function(e, bool){
    e.getAttribute('checked').then(function(value){
      if(Boolean(value) !== bool){
        e.click();
      }
    });
  };

  this.expandFeatureCases = function(list){
    var expandCriteria = list.indexOf(2);
    if(expandCriteria === -1){
      return null;
    }
    var clone1 = list.slice();
    var clone2 = list.slice();
    var clones = [];
    clone1[expandCriteria] = 0;
    clone2[expandCriteria] = 1;
    [clone1, clone2].forEach(function(clone){
      var clonedClones = self.expandFeatureCases(clone);
      if(clonedClones){
        clonedClones.forEach(function(clone){
          clones.push(clone);
        });
      }else{
        clones.push(clone);
      }
    });
    return clones;
  };

  this.checkFeature = function(e, state){
    e.getAttribute('checked').then(function(checked){
      if(state === 1 && !checked || state === 0 && checked){
        e.click();
      }
      if(state === 1){
        expect(e.getAttribute('checked')).toBe('true');
      }else{
        expect(e.getAttribute('checked')).toBe(null);
      }
    });
  };

  this.useWriteablePools = function(callback){
    Object.keys(self.clusters).forEach(function(clusterName){
      var cluster = self.clusters[clusterName];
      Object.keys(cluster.pools).forEach(function(poolName){
        var pool = cluster.pools[poolName];
        if(pool.writable !== false){
          callback(cluster, pool);
        }
      });
    });
  };

  /*
   Selects cluster if a selection is available in the listing.
   */
  this.selectCluster = function(cluster){
    if(self.clusterCount > 1){
      self.clusterSelect.sendKeys(cluster.name);
      expect(self.clusterSelect.getText()).toContain(cluster.name);
    }
  };

  this.selectClusterAndPool = function(cluster, pool){
    self.selectCluster(cluster);
    self.addButton.click();
    self.checkCheckboxToBe(self.expertSettings, true);
    self.poolSelect.sendKeys(pool.name);
    expect(self.poolSelect.getText()).toContain(pool.name);
  };

  var self = this;

  this.expandedFeatureCases = [];

  this.featureCases.forEach(function(featureCase){
    self.expandFeatureCases(featureCase).forEach(function(testCase){
      self.expandedFeatureCases.push(testCase);
    });
  });

  this.deleteRbd = function(rbdName){
    var rbd = element(by.cssContainingText('tr', rbdName));
    expect(rbd.isDisplayed()).toBe(true);
    rbd.click();
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_deleteItem > a')).click();
    element(by.model('input.enteredName')).sendKeys('yes');
    element(by.id('bot2-Msg1')).click();
    expect(element(by.cssContainingText('tr', rbdName)).isPresent()).toBe(false);
  };

  this.createRbd = function(rbdName, rbdObjSize, rbdFeatureCase){
    rbdObjSize = rbdObjSize || "32.00 MB";
    self.name.clear();
    self.name.sendKeys(rbdName);
    self.size.clear();
    self.size.sendKeys(65);
    self.objSize.clear();
    self.objSize.sendKeys(rbdObjSize);
    browser.sleep(helpers.configs.sleep);
    element(by.className('tc_submitButton')).click();

    browser.sleep(helpers.configs.sleep);
    var rbd = element(by.cssContainingText('tr', rbdName));
    expect(rbd.isDisplayed()).toBe(true);
    rbd.click();

    browser.sleep(helpers.configs.sleep);
    expect(element(by.cssContainingText('dd', rbdObjSize)).isDisplayed()).toBe(true);
    if(rbdFeatureCase){
      var keys = Object.keys(self.formElements.features.items);
      rbdFeatureCase.forEach(function(state, index){ // check the features
        if(state === 1){
          expect(element(by.cssContainingText('dd', keys[index])).isDisplayed()).toBe(true);
        }
      });
    }
  };

};

module.exports = rbdCommons;
