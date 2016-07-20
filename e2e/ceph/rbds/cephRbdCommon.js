'use strict';

var rbdCommons = function(){
  this.cephMenu = element(by.css('.tc_menuitem_ceph > a'));
  this.cephRBDs = element(by.css('.tc_submenuitem_ceph_rbds'));
  this.addButton = element(by.css('oadatatable .tc_add_btn'));
  this.selectCluster = element(by.css('#cluster-selection option:nth-child(2)'));
  
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
    pool: {
      name: 'Poolname',
      testClass: 'tc_pool_selection',
      model: "data.pool",
      displayed: true,
      items: {
        poolSelection: 'tc_rbdPoolOption',
        poolSize: 'tc_poolSize',
        poolSizeAvailable: 'tc_poolAvailableSize',
        helpPool: 'tc_poolRequired'
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
      } else {
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

  var self = this;

  this.expandedFeatureCases = [];

  this.featureCases.forEach(function(featureCase) {
    self.expandFeatureCases(featureCase).forEach(function(testCase){
      self.expandedFeatureCases.push(testCase);
    })
  });
};

module.exports = rbdCommons;
