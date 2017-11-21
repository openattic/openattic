"use strict";

var rbdCommons = function () {
  var helpers = require("../../common.js");
  var taskQueueHelpers = require("../../base/taskqueue/task_queue_common.js");
  this.cephRBDs = element(by.css(".tc_menuitem_ceph_rbds"));
  this.addButton = element(by.css("oadatatable .tc_add_btn"));
  this.statisticsTab = element(by.className("tc_statisticsTab"));

  this.detailAttributes = [
    "Name",
    "Block name prefix",
    "Pool",
    "Size",
    "Object size",
    "Number of objects"
  ];

  this.tableHeaders = [
    {
      name: "Name",
      displayed: true
    },
    {
      name: "Poolname",
      displayed: true
    },
    {
      name: "Size",
      displayed: true
    },
    {
      name: "Used",
      displayed: true
    },
    {
      name: "Data-pool",
      displayed: false
    },
    {
      name: "Object size",
      displayed: false
    },
    {
      name: "Number of objects",
      displayed: false
    }
  ];

  this.formElements = {
    name: {
      name: "Name",
      testClass: "tc_rbd_name",
      model: "$ctrl.rbd.name"
    },
    pool: {
      name: "Poolname",
      testClass: "tc_pool_selection",
      model: "$ctrl.data.pool",
      items: {
        poolSelection: "tc_rbdPoolOption",
        poolSize: "tc_poolSize",
        poolSizeAvailable: "tc_poolAvailableSize",
        helpPool: "tc_poolRequired",
        helpLoad: "tc_poolLoading"
      }
    },
    size: {
      name: "Size",
      testClass: "tc_rbd_size",
      model: "$ctrl.data.size",
      items: {
        helpSizeRequired: "tc_sizeRequired",
        helpSizeStripe: "tc_sizeIncreaseStriping",
        helpSizeMinimum: "tc_sizeIncrease"
      }
    },
    objectSize: {
      name: "Object size",
      testClass: "tc_rbd_obj_size",
      model: "$ctrl.data.obj_size",
      items: {
        helpSize: "tc_objSizeRequired",
        changed: "tc-objSize-changed"
      }
    },
    defaultFeatures: {
      name: "Default Features",
      model: "$ctrl.data.defaultFeatures"
    },
    features: {
      name: "Features",
      testClass: "tc_features",
      items: {
        "deep-flatten": {
          class: "tc_feature_deep-flatten",
          desc: "Deep flatten"
        },
        "layering": {
          class: "tc_feature_layering",
          desc: "Layering"
        },
        "stripingv2": {
          class: "tc_feature_stripingv2",
          desc: "Striping"
        },
        "exclusive-lock": {
          class: "tc_feature_exclusive-lock",
          desc: "Exclusive lock"
        },
        "object-map": {
          class: "tc_feature_object-map",
          desc: "Object map"
        },
        "journaling": {
          class: "tc_feature_journaling",
          desc: "Journaling"
        },
        "fast-diff": {
          class: "tc_feature_fast-diff",
          desc: "Fast diff"
        },
        "noFeature": {
          class: "tc_noFeature",
          desc: ""
        }
      }
    },
    stripingCount: {
      name: "Striping count",
      model: "$ctrl.data.striping.count",
      items: {
        required: "tc-stripingCount-required",
        min: "tc-stripingCount-min"
      }
    },
    stripingUnit: {
      name: "Striping unit",
      model: "$ctrl.data.striping.unitDisplayed",
      items: {
        required: "tc-stripingUnit-required",
        changed: "tc-stripingUnit-changed"
      }
    },
    stripingHelp: {
      testClass: "tc-striping-help"
    },
    stripingPreview: {
      testClass: "tc-striping-preview"
    }
  };

  this.defaultFeatures = element(by.model(this.formElements.defaultFeatures.model));
  this.objSize = element(by.model(this.formElements.objectSize.model));
  this.stripingUnit = element(by.model(this.formElements.stripingUnit.model));
  this.stripingCount = element(by.model(this.formElements.stripingCount.model));
  this.size = element(by.model(this.formElements.size.model));
  this.name = element(by.model(this.formElements.name.model));
  this.poolSelect = element(by.model(this.formElements.pool.model));
  this.poolEntries = this.poolSelect.all(by.css("." + this.formElements.pool.testClass + " option"));
  this.firstPool = this.poolSelect.all(by.tagName("option")).get(1);
  this.useDataPool = element(by.model("$ctrl.data.useDataPool"));
  this.dataPoolSelect = element(by.model("$ctrl.data.dataPool"));
  this.firstDataPool = this.dataPoolSelect.all(by.tagName("option")).get(1);

  this.featureCases = [ // 0 = unchecked; 1 = checked; -1= disabled; 2=true or false should not matter
    // TODO: Uncomment it when OP-2217 is fixed, to create a featureless RBD.
    //[2, 2, -1, 0, -1, -1, -1],
    // TODO: Remove the following two lines when OP-2217 is fixed.
    [1, 2, 2, 0, -1, -1, -1],
    [2, 1, 2, 0, -1, -1, -1],
    [2, 2, 2, 1, 0, 2, -1],
    [2, 2, 2, 1, 1, 2, 2]
  ];

  this.convertFeatureObjectToArray = (feature) => [
    feature.deepFlatten,
    feature.layering,
    feature.striping,
    feature.exclusiveLock,
    feature.objectMap,
    feature.journaling,
    feature.fastDiff
  ];

  this.convertFeatureArrayToObject = (feature) => ({
    deepFlatten: feature[0],
    layering: feature[1],
    striping: feature[2],
    exclusiveLock: feature[3],
    objectMap: feature[4],
    journaling: feature[5],
    fastDiff: feature[6]
  });

  // Works on every operating system that was tested
  this.defaultFeatureCase = this.convertFeatureObjectToArray({
    deepFlatten: 1,
    layering: 1,
    striping: 0,
    exclusiveLock: 1,
    objectMap: 1,
    journaling: 0,
    fastDiff: 1
  });

  this.checkCheckboxToBe = function (e, bool) {
    e.getAttribute("checked").then(function (value) {
      if (Boolean(value) !== bool) {
        e.click();
      }
    });
  };

  this.expandFeatureCases = function (list) {
    var expandCriteria = list.indexOf(2);
    if (expandCriteria === -1) {
      return [list];
    }
    var clone1 = list.slice();
    var clone2 = list.slice();
    clone1[expandCriteria] = 0;
    clone2[expandCriteria] = 1;
    return self.expandFeatureCases(clone1).concat(self.expandFeatureCases(clone2));
  };

  this.selectFeatures = function (features) {
    self.checkCheckboxToBe(self.defaultFeatures, false);
    var keys = Object.keys(self.formElements.features.items);
    var values = self.formElements.features.items;
    for (var i = 0; i < 7; i++) { // deselect all boxes
      self.checkCheckboxToBe(element(by.className(values[keys[i]].class)), false);
    }
    features.forEach(function (state, index) { // select the features
      self.checkCheckboxToBe(element(by.className(values[keys[index]].class)), state === 1);
    });
    features.forEach(function (state, index) { // control feature states
      self.controlFeatureState(element(by.className(values[keys[index]].class)), state);
    });
  };

  this.controlFeatureState = function (e, state) {
    expect(e.getAttribute("checked")).toBe(state === 1 ? "true" : null);
    expect(e.getAttribute("disabled")).toBe(state === -1 ? "true" : null);
  };

  this.useWriteablePools = (callback) => {
    helpers.getConfiguredPools().forEach((pool) => {
      if (pool.writable !== false) {
        callback(pool.name);
      }
    });
  };

  this.selectPool = function (poolName) {
    self.addButton.click();
    self.poolSelect.sendKeys(poolName);
    expect(self.poolSelect.getText()).toContain(poolName);
  };

  var self = this;

  this.expandedFeatureCases = [];

  this.featureCases.forEach(function (featureCase) {
    self.expandFeatureCases(featureCase).forEach(function (testCase) {
      self.expandedFeatureCases.push(testCase);
    });
  });

  this.deleteRbd = function (rbdName) {
    var rbd = helpers.get_list_element(rbdName).click();
    expect(rbd.isDisplayed()).toBe(true);
    helpers.delete_selection(undefined, "$ctrl");
    taskQueueHelpers.waitForPendingTasks();
    expect(element(by.cssContainingText("tr", rbdName)).isPresent()).toBe(false);
  };

  this.deleteRbdIfExists = function (rbdName) {
    browser.findElement(by.cssContainingText("td", rbdName)).then(function () {
      self.deleteRbd(rbdName);
    }).catch(function () {
    });
  };

  this.fillForm = function (rbdName, size, rbdObjSize, featureCase) {
    helpers.changeInput(self.name, rbdName);
    helpers.changeInput(self.size, size);
    helpers.changeInput(self.objSize, rbdObjSize || "4.00 MiB");
    if (featureCase) {
      self.selectFeatures(featureCase);
    }
  };

  this.createRbd = function (rbdName, size, rbdObjSize, featureCase) {
    rbdObjSize = rbdObjSize || "4.00 MiB";
    size = size || rbdObjSize;
    self.fillForm(rbdName, size, rbdObjSize, featureCase);
    element(by.className("tc_submitButton")).click();

    taskQueueHelpers.waitForPendingTasks();
    self.cephRBDs.click();
    browser.sleep(helpers.configs.sleep / 2);
    helpers.checkForUnsavedChanges(false);

    var rbd = helpers.search_for_element(rbdName);
    expect(rbd.isDisplayed()).toBe(true);
    rbd.click();

    expect(element(by.binding("$ctrl.selection.item.obj_size")).getText()).toBe(rbdObjSize);
    if (featureCase) {
      var keys = Object.keys(self.formElements.features.items);
      var values = self.formElements.features.items;
      featureCase.forEach(function (state, index) { // check the features
        if (state === 1) {
          expect(element(by.cssContainingText("dd", values[keys[index]].desc)).isDisplayed()).toBe(true);
        } else {
          expect(element(by.cssContainingText("dd", values[keys[index]].desc)).isPresent()).toBe(false);
        }
      });
    }
  };

};

module.exports = rbdCommons;
