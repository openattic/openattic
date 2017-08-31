'use strict';

var cephPoolCommons = function(){
  var helpers = require('../../common.js');
  this.cephPools = element(by.css('.tc_menuitem_ceph_pools'));

  this.clusters = helpers.configs.cephCluster;
  this.clusterCount = Object.keys(this.clusters).length;
  this.clusterSelect = element(by.model('registry.selectedCluster'));

  this.addButton = element(by.css('oadatatable .tc_add_btn'));
  this.statusTab = element(by.css('.tc_statusTab'));
  this.statisticsTab = element(by.className('tc_statisticsTab'));
  //this.cacheTieringTab = element(by.css('.tc_cacheTieringTab'));
  this.isBluestore = element(by.model('bluestore'));

  // Describes the attributes seen in the detail tab.
  this.detailAttributes = [
    {
      name: 'ID',
      displayed: true
    },
    {
      name: 'Placement Groups',
      displayed: true
    },
    {
      name: 'Type',
      displayed: true
    },
    {
      name: 'Flags',
      displayed: true
    },
    {
      name: 'Last change',
      displayed: true
    },
    {
      name: 'Mode',
      displayed: false
    },
    {
      name: 'Algorithm',
      displayed: false
    },
    {
      name: 'Minimum blob size',
      displayed: false
    },
    {
      name: 'Maximum blob size',
      displayed: false
    },
    {
      name: 'Required ratio',
      displayed: false
    }
  ];

  // Description of headers in the table.
  this.tableHeaders = [
    {
      name: 'Name',
      displayed: true
    },
    {
      name: 'ID',
      displayed: true
    },
    {
      name: 'Used',
      displayed: true
    },
    {
      name: 'Placement groups',
      displayed: true
    },
    {
      name: 'Replica size',
      displayed: true
    },
    {
      name: 'Erasure code profile',
      displayed: true
    },
    {
      name: 'Type',
      displayed: true
    },
    {
      name: 'Crush ruleset',
      displayed: true
    },
    {
      name: 'Compression mode',
      displayed: true
    },
    {
      name: 'Compression algorithm',
      displayed: false
    },
    {
      name: 'Compression min. blob size',
      displayed: false
    },
    {
      name: 'Compression max. blob size',
      displayed: false
    },
    {
      name: 'Compression required ratio',
      displayed: false
    }
  ];

  // Describes the form elements.
  this.formElements = {
    name: {
      name: 'Name',
      byClass: element(by.className('tc_pool_name')),
      byModel: element(by.model('pool.name')),
      type: 'text',
      displayed: true,
      items: {
        required: element(by.className('tc_nameRequired')),
        uniqueName: element(by.className('tc_noUniqueName')),
        validName: element(by.className('tc_noValidName'))
      }
    },
    /* Only for multi cluster systems
    cluster: {
      name: 'Cluster',
      byClass: element(by.className('tc_cluster_selection')),
      byModel: element(by.model('data.cluster')),
      displayed: false,
      type: 'select',
      items: {
        clusterSelection: element(by.className('tc_clusterOption')),
        helpCluster: element(by.className('tc_clusterRequired')),
        helpLoad: element(by.className('tc_clusterLoading'))
      }
    },
    */
    types: {
      name: 'Pool type',
      byClass: element(by.className('tc_poolTypes_selection')),
      byModel: element(by.model('pool.type')),
      displayed: true,
      type: 'select',
      items: {
        typeSelection: element(by.className('tc_poolTypesOption')),
        required: element(by.className('tc_typeRequired'))
      }
    },
    pgnum: {
      name: 'Placement groups',
      byClass: element(by.className('tc_pool_pgNum')),
      byModel: element(by.model('pool.pg_num')),
      displayed: false,
      displayedIf: 'replicated', // and 'erasure'
      type: 'number',
      items: {
        helpPgnum: element(by.className('tc_pgNumRequired'))
      }
    },
    replicatedSize: {
      name: 'Replicated size',
      byClass: element(by.className('tc_pool_size')),
      byModel: element(by.model('pool.size')),
      type: 'number',
      presented: false,
      displayedIf: 'replicated',
      items: {
        helpSize: element(by.className('tc-applied-rule-set')),
        helpSize: element(by.className('tc-size-out-of-range')),
        helpSize: element(by.className('tc_sizeRequired'))
      }
    },
    crushRules: {
      name: 'Crush ruleset',
      byClass: element(by.className('tc_crushSet_selection')),
      presented: false,
      displayedIf: 'replicated', // and 'erasure'
      type: 'select',
      items: {
        crushSelection: element(by.className('tc_crushSetOption')),
        helpRuleReq: element(by.className('tc_crushSetRequired'))
      }
    },
    erasureProfiles: {
      name: 'Erasure code profile',
      byClass: element(by.className('tc_erasureProfiles_selection')),
      byModel: element(by.model('pool.erasure.profile')),
      type: 'select',
      presented: false,
      displayedIf: 'erasure',
      items: {
        erasureSelection: element(by.className('tc_erasureProfilesOption')),
        erasureRequired: element(by.className('tc_erasureRequired'))
      }
    },
    ecOverwriteFlag: {
      name: 'EC Overwrites',
      byClass: element(by.className('tc-ec-overwrites')),
      type: 'checkbox',
      presented: false,
      displayedIf: 'erasure'
    },
    compressionMode: {
      name: 'Compression mode',
      byClass: element(by.className('tc_compressionMode')),
      byModel: element(by.model('pool.compression_mode')),
      type: 'select',
      displayed: false, //self.isBluestore && self.formElements.types.byModel ? true : false;
      displayedIf: 'bluestore',
      items: {
        compressionModeRequired: element(by.className('tc_compressionModeRequired'))
      }
    },
    compressionAlgorith: {
      name: 'Compression algorithm',
      byClass: element(by.className('tc_compressionAlgorithmSelection')),
      byModel: element(by.model('pool.compression_algorithm')),
      type: 'select',
      displayed: false,
      displayedIf: 'isCompression',
      items: {
        compressionAlgorithmRequired: element(by.className('tc_compressionAlgorithmRequired'))
      }
    },
    compressionMinBlobSize: {
      name: 'Compression min blob size',
      byClass: element(by.className('tc_compressionMaxBlobSize')),
      byModel: element(by.model('data.compression_min_blob_size')),
      type: 'text',
      displayed: false,
      displayedIf: 'isCompression',
      items: {
        compressionMinBlobSizeRequired: element(by.className('tc_compressionMinBlobSizeRequired')),
        compressionMinBlobSizeMin: element(by.className('tc_compressionMinBlobSizeMin'))
      }
    },
    compressionMaxBlobSize: {
      name: 'Compression max blob size',
      byClass: element(by.className('tc_compressionMaxBlobSize')),
      byModel: element(by.model('data.compression_max_blob_size')),
      type: 'text',
      displayed: false,
      displayedIf: 'isCompression',
      items: {
        compressionMaxBlobSizeRequired: element(by.className('tc_compressionMaxBlobSizeRequired')),
        compressionMaxBlobSizeMin: element(by.className('tc_compressionMaxBlobSizeMin'))
      }
    },
    compressionRequiredRatio: {
      name: 'Compression required ratio',
      byClass: element(by.className('tc_compressionRequiredRatio')),
      byModel: element(by.model('pool.compression_required_ratio')),
      type: 'number',
      displayed: false,
      displayedIf: 'isCompression',
      items: {
        ccompressionRequiredRatioRequired: element(by.className('tc_ccompressionRequiredRatioRequired')),
        compressionRequiredRatioMinMax: element(by.className('tc_compressionRequiredRatioMinMax'))
      }
    },
    backButton: {
      name: 'Back',
      byClass: element(by.className('tc_backButton')),
      type: 'button',
      displayed: true
    },
    createButton: {
      name: 'Create',
      byClass: element(by.className('tc_submitButton')),
      type: 'button',
      displayed: true
    }
  };

  this.formLabels = {
    header: {
      text: 'Create Ceph pool:',
      where: 'header',
      byClass: element(by.className('tc_formHeadline'))
    }
  };

  this.isListInSelectBox = function(e){
    self.selectNeededSelection(e);
    e.byClass.click();
    var listEntries = e.byClass.all(by.css('option'));
    expect(listEntries.count()).toBeGreaterThan(1);
  };

  this.selectNeededSelection = (e) => {
    if(e.displayedIf === 'replicated'){
      self.formElements.types.byModel.sendKeys('Replicated');
    }else if(e.displayedIf === 'erasure'){
      self.formElements.types.byModel.sendKeys('Erasure');
    }else if(e.displayedIf === 'isCompression'){
      self.formElements.types.byModel.sendKeys('Replicated');
      self.formElements.compressionMode.byModel.sendKeys('force');
    }
    self.formElements.name.byModel.click();
  };

  this.checkCheckboxToBe = function(e, bool){
    e.getAttribute('checked').then(function(value){
      if(Boolean(value) !== bool){
        e.click();
      }
    });
  };

  this.getFormElement = (e) =>  e.byModel || e.byClass;

  /*
   Selects cluster if a selection is available in the listing.
   */
  this.selectCluster = function(cluster){
    if(self.clusterCount > 1){
      self.clusterSelect.sendKeys(cluster.name);
      expect(self.clusterSelect.getText()).toContain(cluster.name);
    }
  };

  var self = this;
};

module.exports = cephPoolCommons;
