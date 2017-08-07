'use strict';

var rbdCommons = function(){
  var helpers = require('../../common.js');
  var taskQueueHelpers = require('../../base/taskqueue/task_queue_common.js');
  this.cephRBDs = element(by.css('.tc_menuitem_ceph_rbds'));
  this.addButton = element(by.css('oadatatable .tc_add_btn'));
  this.clusters = helpers.configs.cephCluster;
  this.clusterCount = Object.keys(this.clusters).length;
  this.clusterSelect = element(by.model('$ctrl.registry.selectedCluster'));
  this.statisticsTab = element(by.className('tc_statisticsTab'));

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
      model: '$ctrl.rbd.name',
      displayed: true
    },
    cluster: {
      name: 'Cluster',
      testClass: 'tc_cluster_selection',
      model: '$ctrl.data.cluster',
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
      model: '$ctrl.data.pool',
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
      model: '$ctrl.data.size',
      displayed: true,
      items: {
        helpSize: 'tc_sizeRequired'
      }
    },
    expertSettings: {
      name: 'Expert Settings',
      testClass: 'tc_expertSettings',
      model: '$ctrl.data.expert',
      displayed: true
    },
    objectSize: {
      name: 'Object size',
      testClass: 'tc_rbd_obj_size',
      model: '$ctrl.data.obj_size',
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
        'deep-flatten': {
          class: 'tc_feature_deep-flatten',
          desc: 'Deep flatten'
        },
        'layering': {
          class: 'tc_feature_layering',
          desc: 'Layering'
        },
        'stripingv2': {
          class: 'tc_feature_stripingv2',
          desc: 'Striping (currently unsupported)'
        },
        'exclusive-lock': {
          class: 'tc_feature_exclusive-lock',
          desc: 'Exclusive lock'
        },
        'object-map': {
          class: 'tc_feature_object-map',
          desc: 'Object map'
        },
        'journaling': {
          class: 'tc_feature_journaling',
          desc: 'Journaling'
        },
        'fast-diff': {
          class: 'tc_feature_fast-diff',
          desc: 'Fast diff'
        },
        'defaultFeatures': {
          class: 'tc_featureDefaults',
          desc: ''
        },
        'helpSize': {
          class: 'tc_objSizeRequired',
          desc: ''
        }
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
    // TODO: Uncomment it when OP-2217 is fixed, to create a featureless RBD.
    //[2, 2, -1, 0, -1, -1, -1],
    // TODO: Remove the following two lines when OP-2217 is fixed.
    [1, 2, -1, 0, -1, -1, -1],
    [2, 1, -1, 0, -1, -1, -1],
    [2, 2, -1, 1, 0, 2, -1],
    [2, 2, -1, 1, 1, 2, 2],
  ];

  this.convertFeatureObjectToFeatureArray = function(feature){
    return [
      feature.deepFlatten,
      feature.layering,
      feature.striping,
      feature.exclusiveLock,
      feature.objectMap,
      feature.journaling,
      feature.fastDiff
    ];
  };

  // Works on every operating system that was tested
  this.defaultFeatureCase = this.convertFeatureObjectToFeatureArray({
    deepFlatten: 1,
    layering: 1,
    striping: -1,
    exclusiveLock: 1,
    objectMap: 1,
    journaling: 0,
    fastDiff: 1
  });

  this.isListInSelectBox = function(itemName){
    var item = element(by.model(self.formElements[itemName].model));
    item.click();
    var listEntries = item.all(by.css('.' + self.formElements[itemName].testClass + ' option'));

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
      return [list];
    }
    var clone1 = list.slice();
    var clone2 = list.slice();
    clone1[expandCriteria] = 0;
    clone2[expandCriteria] = 1;
    return self.expandFeatureCases(clone1).concat(self.expandFeatureCases(clone2));
  };

  this.selectFeatures = function(features){
    self.checkCheckboxToBe(self.expertSettings, true);
    var keys = Object.keys(self.formElements.features.items);
    var values = self.formElements.features.items;
    for (var i = 0; i < 7; i++){ // deselect all boxes
      self.checkCheckboxToBe(element(by.className(values[keys[i]].class)), false);
    }
    features.forEach(function(state, index){ // select the features
      self.checkCheckboxToBe(element(by.className(values[keys[index]].class)), state === 1);
    });
    features.forEach(function(state, index){ // control feature states
      self.controlFeatureState(element(by.className(values[keys[index]].class)), state);
    });
  };

  this.controlFeatureState = function(e, state){
    expect(e.getAttribute('checked')).toBe(state === 1 ? 'true' : null);
    expect(e.getAttribute('disabled')).toBe(state === -1 ? 'true' : null);
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

  this.selectCluster = function(clusterName){
    if(self.clusterCount > 1){
      self.clusterSelect.sendKeys(clusterName);
      expect(self.clusterSelect.getText()).toContain(clusterName);
    }
  };

  this.selectClusterAndPool = function(clusterName, poolName){
    self.selectCluster(clusterName);
    self.addButton.click();
    self.checkCheckboxToBe(self.expertSettings, true);
    self.poolSelect.sendKeys(poolName);
    expect(self.poolSelect.getText()).toContain(poolName);
  };

  var self = this;

  this.expandedFeatureCases = [];

  this.featureCases.forEach(function(featureCase){
    self.expandFeatureCases(featureCase).forEach(function(testCase){
      self.expandedFeatureCases.push(testCase);
    });
  });

  this.deleteRbd = function(rbdName){
    var rbd = helpers.get_list_element(rbdName).click();
    expect(rbd.isDisplayed()).toBe(true);
    helpers.delete_selection(undefined, '$ctrl');
    expect(element(by.cssContainingText('tr', rbdName)).isPresent()).toBe(false);
  };

  this.fillForm = function(rbdName, size, rbdObjSize, featureCase){
    rbdObjSize = rbdObjSize || '4.00 MiB';
    self.checkCheckboxToBe(self.expertSettings, true);
    self.name.clear();
    self.name.sendKeys(rbdName);
    self.size.clear();
    self.size.sendKeys(size);
    self.objSize.clear();
    self.objSize.sendKeys(rbdObjSize);
    if(featureCase){
      self.selectFeatures(featureCase);
    }
  };

  this.createRbd = function(rbdName, rbdObjSize, featureCase){
    rbdObjSize = rbdObjSize || '4.00 MiB';
    self.fillForm(rbdName, rbdObjSize, rbdObjSize, featureCase);
    element(by.className('tc_submitButton')).click();
    taskQueueHelpers.waitForPendingTasks();

    var rbd = helpers.search_for_element(rbdName);
    expect(rbd.isDisplayed()).toBe(true);
    rbd.click();

    expect(element(by.binding('$ctrl.selection.item.obj_size')).getText()).toBe(rbdObjSize);
    if(featureCase){
      var keys = Object.keys(self.formElements.features.items);
      var values = self.formElements.features.items;
      featureCase.forEach(function(state, index){ // check the features
        if(state === 1){
          expect(element(by.cssContainingText('dd', values[keys[index]].desc)).isDisplayed()).toBe(true);
        } else {
          expect(element(by.cssContainingText('dd', values[keys[index]].desc)).isPresent()).toBe(false);
        }
      });
    }
  };

};

module.exports = rbdCommons;
