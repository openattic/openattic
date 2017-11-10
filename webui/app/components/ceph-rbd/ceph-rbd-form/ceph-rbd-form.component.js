/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

import _ from "lodash";

class CephRbdForm {
  constructor ($state, $stateParams, cephRbdService, cephPoolsService,
      SizeParserService, $filter, Notification, cephClusterService,
      cephRbdFeatures, $uibModal) {
    this.$filter = $filter;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.Notification = Notification;
    this.SizeParserService = SizeParserService;
    this.cephPoolsService = cephPoolsService;
    this.cephRbdService = cephRbdService;
    this.cephClusterService = cephClusterService;

    this.submitted = false;
    this.rbd = {
      name: "",
      size: 0,
      pool: -1,
      obj_size: 4194304
    };

    this.data = {
      cluster: null,
      pool: null,
      striping: {
        count: 5,
        unit: 4194304,
        unitDisplayed: "4 MiB"
      },
      features: {
        "deep-flatten": {
          checked: false,
          disabled: false
        },
        "layering": {
          checked: false,
          disabled: false
        },
        "stripingv2": {
          checked: false,
          disabled: false
        },
        "exclusive-lock": {
          checked: false,
          disabled: false
        },
        "object-map": {
          checked: false,
          disabled: true
        },
        "journaling": {
          checked: false,
          disabled: true
        },
        "fast-diff": {
          checked: false,
          disabled: true
        }
      },
      defaultFeatures: true,
      obj_num: 1,
      obj_size: "4 MiB",
      size: "",
      expert: false
    };

    this.pools = {
      replicated: [],
      erasure: []
    };
    this.clusters = undefined;

    this.features = cephRbdFeatures;

    this.defaultFeatureValues = {};
    _.cloneDeep(this.data.features, this.defaultFeatureValues);

    this.fsid = $stateParams.fsid;
    this.fromState = $stateParams.fromState;

    this.waitingClusterMsg = "Retrieving cluster list...";

    this.waitingPoolMsg = "Select a cluster first";
  }

  $onInit () {
    this.cephClusterService.get()
      .$promise
      .then((res) => {
        this.clusters = res.results;
        this.waitingClusterMsg = "-- Select a cluster --";
        if (this.fsid) {
          this.clusters.some((cluster) => {
            if (cluster.fsid === this.fsid) {
              this.data.cluster = cluster;
              this.watchDataCluster();
            }
          });
        }
        if (!this.data.cluster) {
          if (res.count > 0) {
            this.data.cluster = res.results[0];
            this.watchDataCluster();
          } else {
            this.waitingClusterMsg = "No cluster avialable.";
            this.Notification.warning({
              title: this.waitingClusterMsg,
              msg: "You can't create any RBDs with your configuration."
            });
          }
        }
        this.data.pools = null;
      })
      .catch((clusterError) => {
        if (!this.clusterFailure) {
          this.clusterFailure = true;
          this.clusterFailureTitle = clusterError.status + ": " + clusterError.statusText.toLowerCase();
          this.clusterFailureError = clusterError;
          this.waitingClusterMsg = "Error: Cluster couldn't be loaded!";
          this.rbdForm.$setValidity("clusterLoading", false);
        }
      });
  }

  deepBoxCheck (key, checked) {
    _.forIn(this.features, (details, feature) => {
      if (details.requires === key) {
        this.data.features[feature].disabled = !checked;
        if (!checked) {
          this.data.features[feature].checked = checked; // Always.
          this.watchDataFeatures(feature);
          this.deepBoxCheck(feature, checked);
        }
      }
      if (details.excludes === key) {
        this.data.features[feature].disabled = checked;
      }
    });
  }

  featureFormUpdate (key) {
    let checked = this.data.features[key].checked;
    if (checked) {
      let required = this.features[key].requires;
      let excluded = this.features[key].excludes;
      if (excluded && this.data.features[excluded].checked || required && !this.data.features[required].checked) {
        this.data.features[key].checked = false;
        return;
      }
    }
    this.deepBoxCheck(key, checked);
  }

  watchDataFeatures (key) {
    if (key === "stripingv2") {
      this.sizeValidator();
    }
    let defaults = this.data.defaultFeatures;
    if (!defaults) {
      if (key) {
        this.featureFormUpdate(key);
      }
      let noneSelected = Object.keys(this.data.features).every((feature) => {
        return !this.data.features[feature].checked;
      });
      this.rbdForm.$setValidity("noFeatureSelected", !noneSelected);
    } else {
      this.rbdForm.$setValidity("noFeatureSelected", defaults);
    }
  }

  defaultFeatures () {
    _.cloneDeep(this.defaultFeatureValues, this.data.features);
  }

  getSizeInBytes (size, jump) {
    if (!size) {
      return Math.pow(2, 12);
    }
    if (size.match(/[+-]+/)) {
      size = size.replace(/[+-]+/, "");
    }
    size = this.SizeParserService.parseFloat(size, "b", "k"); //default input size is KiB
    let power = 0;
    if (size !== null && size !== 0) {
      power = Math.round(Math.log(size) / Math.log(2));
      if (_.isNumber(jump)) {
        power += jump;
      }
    }
    if (power < 12) {
      size = Math.pow(2, 12); // 1 << 12; Set size to minimum of 4 KiB.
    } else if (power > 25) {
      size = Math.pow(2, 25); // 1 << 25; Set size to maximum of 32 MiB.
    } else {
      size = Math.pow(2, power); // 1 << power; Set size the nearest accurate size.
    }
    return size;
  }

  updateObjSize (newSize, jump) {
    this.setMutex("obj_size", newSize);
    this.rbd.obj_size = newSize || this.getSizeInBytes(this.data.obj_size, jump);
    let size = this.rbd.obj_size;
    if (!this.rbdForm.stripingUnit) {
      this.updateStripingUnit(size);
    }
    if (this.data.striping.unit > size) {
      this.updateStripingUnit(size);
    }
    this.data.obj_size = this.$filter("bytes")(size);
    this.sizeValidator();
  }

  updateStripingUnit (newSize, jump) {
    this.setMutex("stripingUnit", newSize);
    this.data.striping.unit = newSize || this.getSizeInBytes(this.data.striping.unitDisplayed, jump);
    let unit = this.data.striping.unit;
    if (unit > this.rbd.obj_size) {
      this.updateObjSize(unit);
    }
    this.data.striping.unitDisplayed = this.$filter("bytes")(unit);
    this.data.striping.unit = unit;
  }

  setMutex (inputName, setLock) {
    if (!this.rbdForm[inputName]) {
      return;
    }
    if (setLock) {
      this.changedField = inputName;
      this.rbdForm[inputName].$touched = false;
      this.rbdForm[inputName].$untouched = true;
    } else {
      if (this.changedField === inputName) {
        this.changedField = undefined;
      }
    }
  }

  stripingDescription () {
    let message = "";
    if (_.isString(this.data.size)) {
      let size = this.SizeParserService.parseFloat(this.data.size, "b");
      this.sizeValidator(size);
      const striping = this.data.striping;
      if (this.data.size !== "-" &&
        _.isString(this.data.obj_size) && this.data.obj_size !== "0 B" &&
        _.isString(striping.unitDisplayed) && striping.unitDisplayed !== "0 B" &&
        _.isNumber(striping.count)) {
        const stripeSize = striping.count * striping.unit;
        const objectSetSize = striping.count * this.rbd.obj_size;
        let maxSets = Math.ceil(size / objectSetSize);
        let maxStripes = Math.ceil(size / stripeSize);
        let isLastStripePartial = size % stripeSize !== 0;
        let stripeSizeStr = this.$filter("bytes")(stripeSize);
        let numCompleteStripes = isLastStripePartial ? (maxStripes - 1) : maxStripes;

        message += `Each stripe has ${stripeSizeStr} spanned across ${striping.count} objects.`;
        message += "<br>";
        message += `The RBD can hold up to ${maxSets} `;
        message += maxSets === 1 ? "object set" : "object sets";
        message += ` (${numCompleteStripes} `;
        message += numCompleteStripes === 1 ? "stripe" : "stripes";
        message += isLastStripePartial ? " + 1 partial stripe" : "";
        message += ").";
      }
    }
    return message;
  }

  sizeChange (event, callback) {
    if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
      callback.call(this, undefined, 39 - event.keyCode);
    } else if (event.keyCode === 187 || event.keyCode === 189) {
      callback.call(this, undefined, 188 - event.keyCode);
    }
  }

  useMaxSize (pool) {
    this.data.size = this.$filter("bytes")(pool.max_avail - pool.num_bytes);
    this.watchDataSize();
  }

  watchDataSize () {
    if (this.data.size === "") {
      return;
    }
    const size = this.SizeParserService.parseFloat(this.data.size, "b", "m"); //default input size is MiB
    this.sizeValidator(size);
    if (_.isNumber(size)) {
      if (size / this.data.obj_size < 1) {
        this.data.size = this.$filter("bytes")(this.data.obj_size);
      } else {
        this.data.size = this.$filter("bytes")(size);
      }
    } else {
      this.data.size = "";
    }
  }

  sizeValidator (size = this.SizeParserService.parseFloat(this.data.size, "b")) {
    let valid = _.isNumber(size) && this.rbd.obj_size <= size;
    if (this.data.features.stripingv2.checked &&
      this.rbdForm.stripingCount &&
      this.rbdForm.stripingCount.$valid &&
      this.rbdForm.obj_size.$valid) {
      valid = this.data.striping.count * this.rbd.obj_size <= size;
    }
    this.rbdForm.size.$setValidity("valid", valid);
  }

  goToListView () {
    this.$state.go(this.fromState, {
      fsid: this.fsid
    });
  }

  getCephPools () {
    this.getReplicatedPools();
    this.getEcOverwritesPools();
  }

  getReplicatedPools () {
    this.waitingPoolMsg = "Retrieving pool list...";
    this.cephPoolsService.get({
      fsid: this.fsid,
      type: "replicated"
    })
      .$promise
      .then((res) => {
        this.poolFailure = false;
        this.rbdForm.$setValidity("poolLoading", true);

        res.results.forEach((pool) => this.addPoolAttributes(pool));

        if (res.count === 1 && !this.data.pool) {
          this.data.pool = res.results[0];
        }
        this.pools.replicated = res.results;
        if (res.count === 0) {
          this.waitingPoolMsg = "No suitable pool aviable.";
          this.Notification.warning({
            title: this.waitingPoolMsg,
            msg: "You can't create any RBDs in the selected cluster."
          });
        } else {
          this.waitingPoolMsg = "-- Select a pool --";
        }
      })
      .catch((poolError) => {
        if (!this.poolFailure) {
          this.poolFailure = true;
          this.poolFailureTitle = poolError.status + ": " + poolError.statusText.toLowerCase();
          this.poolFailureError = poolError;
          this.rbdForm.$setValidity("poolLoading", false);
          this.waitingPoolMsg = "Error: List couldn't be loaded!";
        }
      });
  }

  getEcOverwritesPools () {
    this.cephPoolsService.get({
      fsid: this.fsid,
      flags: "ec_overwrites"
    })
      .$promise
      .then((res) => {
        res.results.forEach((pool) => {
          this.addPoolAttributes(pool);
        });

        this.pools.erasure = res.results;
      });
  }

  addPoolAttributes (pool) {
    pool.oaFree = pool.max_avail - pool.num_bytes;
    pool.oaFreeText = this.$filter("bytes")(pool.oaFree);
  }

  getDataPools () {
    if (!this.data.pool) {
      return [];
    }
    return this.pools.erasure.concat(this.pools.replicated.filter((pool) => {
      return this.data.pool.id !== pool.id;
    }));
  }

  watchDataCluster () {
    if (this.data.cluster) {
      this.fsid = this.data.cluster.fsid;
      this.getCephPools();
    }
  }

  previewStriping () {
    this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRbdStripingModal",
      resolve: {
        size: () => {
          return this.data.size;
        },
        objectSize: () => {
          return this.data.obj_size;
        },
        stripeUnit: () => {
          return this.data.striping.unitDisplayed;
        },
        stripeCount: () => {
          return this.data.striping.count;
        }
      }
    });
  }

  submitAction (rbdForm) {
    if (rbdForm.$valid) {
      if (!this.data.defaultFeatures) {
        let features = [];
        _.forIn(this.data.features, (feature, featureName) => {
          if (feature.checked) {
            features.push(featureName);
          }
        });
        this.rbd.features = features;
        if (features.indexOf("stripingv2") !== -1) {
          this.rbd.stripe_count = this.data.striping.count;
          this.rbd.stripe_unit = this.data.striping.unit;
        }
      }
      this.rbd.pool = this.data.pool.id;
      if (this.data.useDataPool) {
        this.rbd.data_pool = this.data.dataPool.id;
      }
      this.rbd.fsid = this.fsid;
      this.rbd.size = this.SizeParserService.parseInt(this.data.size, "b"); // Limit around 868 EiB
      this.submitted = true;
      this.cephRbdService.save(this.rbd)
        .$promise
        .then((res) => {
          this.rbd = res;
          this.goToListView();
        }, (error) => {
          this.rbdForm.$submitted = false;
          if (error.status === 400 && error.data.size) {
            let size = error.data.size[0].match(/[0-9]+/)[0];
            this.Notification.error({
              title: "RBD creation error " + error.status,
              msg: "Chosen RBD size is too big. Choose a size lower than " + this.$filter("bytes")(size) + "."
            }, error);
          }
        });
    }
  }

  cancelAction () {
    this.goToListView();
  }
}

export default {
  template: require("./ceph-rbd-form.component.html"),
  bindings: {},
  controller: CephRbdForm
};
