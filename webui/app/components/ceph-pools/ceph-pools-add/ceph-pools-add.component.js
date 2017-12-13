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

class CephPoolsAdd {
  constructor ($state, $stateParams, $q, $uibModal, Notification,
      cephOsdService, cephCrushmapService, cephClusterService,
      cephErasureCodeProfilesService, cephPoolsService, $filter,
      SizeParserService) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.$uibModal = $uibModal;
    this.Notification = Notification;
    this.cephOsdService = cephOsdService;
    this.cephCrushmapService = cephCrushmapService;
    this.cephClusterService = cephClusterService;
    this.cephErasureCodeProfilesService = cephErasureCodeProfilesService;
    this.cephPoolsService = cephPoolsService;
    this.$filter = $filter;
    this.SizeParserService = SizeParserService;

    this.PG_MIN = 1;

    this.pool = {
      name: "",
      pg_num: this.PG_MIN,
      type: "",
      crush_ruleset: 0,
      size: 3,
      erasure: {
        profile: undefined
      },
      compression_algorithm: "snappy",
      compression_max_blob_size: 0,
      compression_min_blob_size: 0,
      compression_mode: "none",
      compression_required_ratio: 0.875
    };

    this.data = {
      cluster: undefined,
      poolTypes: [
        {
          name: "replicated",
          description: "Replicated pool"
        },
        {
          name: "erasure",
          description: "Erasure code pool"
        }
      ],
      pg_num: this.PG_MIN,
      profiles: [],
      expert: false,
      ruleset: undefined,
      osdCount: 1,
      flags: {},
      compressionAlgorithms: [
        {
          name: "none",
          description: "none"
        },
        {
          name: "snappy",
          description: "snappy"
        },
        {
          name: "zlib",
          description: "zlib"
        },
        {
          name: "zstd",
          description: "zstd"
        },
        {
          name: "lz4",
          description: "lz4"
        }
      ],
      compressionModes: [
        {
          name: "none",
          description: "none"
        },
        {
          name: "force",
          description: "force"
        },
        {
          name: "aggressive",
          description: "aggressive"
        },
        {
          name: "passive",
          description: "passive"
        }
      ],
      compression_min_blob_size: "0 B",
      compression_max_blob_size: "0 B"
    };

    this.clusters = undefined;

    this.app = {
      selected: undefined,
      add: (_app) => {
        if (!_.isString(_app) || _app === "") {
          return;
        }
        // A custom app without a name will be undefined
        this.app.remove(undefined);
        if (this.apps.used.indexOf(_app) === -1) {
          if (_app === "Custom application") {
            _app = undefined;
          } else if (this.apps.all.indexOf(_app) === -1) {
            this.apps.all.push(_app);
          }
          //this.apps.used.push(app);
          this.apps.used = [_app].concat(this.apps.used);
        }
      },
      remove: (_app) => {
        const emptyAppIndex = this.apps.used.indexOf(_app);
        if (emptyAppIndex !== -1) {
          this.app.removeByIndex(emptyAppIndex);
        }
      },
      removeByIndex: (index) => {
        this.apps.used.splice(index, 1);
      }
    };

    this.apps = {
      all: ["cephfs", "rbd", "rgw"],
      used: [],
      getAvail: () => {
        const appList = this.apps.all.filter((_app) => {
          return this.apps.used.indexOf(_app) === -1;
        }).sort();
        appList.push("Custom application");
        return appList;
      }
    };
  }

  $onInit () {
    if (this.$stateParams.poolId) {
      this.prepareEditForm();
    } else {
      this.prepareAddForm();
    }
  }

  onDataClusterChange () {
    if (this.data.cluster) {
      this.data.cluster.loaded = false;
      this.fsid = this.data.cluster.fsid;

      let promises = [];
      promises.push(
        this.cephClusterService.status({
          fsid: this.data.cluster.fsid
        }).$promise
      );
      promises.push(
        this.cephErasureCodeProfilesService.get({
          fsid: this.data.cluster.fsid
        }).$promise
      );
      promises.push(
        this.cephOsdService.get({
          fsid: this.data.cluster.fsid,
          osd_objectstore: "bluestore"
        }).$promise
      );
      promises.push(
        this.cephCrushmapService.get({
          fsid: this.data.cluster.fsid
        }).$promise
      );
      this.$q.all(promises)
        .then((res) => {
          this.data.osdCount = res[0].osdmap.osdmap.num_osds;
          this.data.profiles = res[1].results;
          this.bluestore = res[2].count > 0;
          this.data.cluster.rules = {
            replicated: [],
            erasure: []
          };
          /* Confusing types because of:
           * https://bitbucket.org/openattic/openattic/src/2a054091ffb56d69b7ccee9ee7070b5116261d6b/backend/ceph/
           * models.py?at=master&fileviewer=file-view-default#models.py-327
           */
          const type = {
            1: "replicated",
            3: "erasure"
          };
          _.forIn(res[3].crushmap.rules, (ruleset) => {
            this.data.cluster.rules[type[ruleset.type]].push(ruleset);
          });
          this.rulesetChange();
          this.data.cluster.loaded = true;
          this.pgSizeChange();
          this.ecProfileChange();
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  goToListView () {
    this.$state.go("cephPools");
  }

  prepareEditForm () {
    this.editing = true;
    this.cephClusterService.get({
      fsid: this.$stateParams.fsid
    })
      .$promise
      .then((cluster) => {
        this.clusters = [cluster];
        this.data.cluster = cluster;
        this.onDataClusterChange();
      });
    this.cephPoolsService.get({
      id: this.$stateParams.poolId,
      fsid: this.$stateParams.fsid
    }).$promise.then((res) => {
      _.extend(this.pool, res);
      this.data.pg_num = this.pool.pg_num;
      this.data.ruleset = this.pool.crush_ruleset;
      this.data.compression_min_blob_size = this.pool.compression_min_blob_size + "b";
      this.updateCompressionMinBlobSize();
      this.data.compression_max_blob_size = this.pool.compression_max_blob_size + "b";
      this.updateCompressionMaxBlobSize();
      this.data.flags.ec_overwrites = this.pool.flags.indexOf("ec_overwrites") !== -1;
      this.data.cluster = {
        fsid: this.$stateParams.fsid
      };
      this.clusters = [ this.data.cluster ];
      this.apps.used = Object.keys(this.pool.application_metadata);
      this.apps.all = this.apps.all.concat(this.apps.used).filter((app, index, apps) => {
        return apps.indexOf(app) === index;
      });

      this.rulesetChange();
      this.onDataClusterChange();
    });
  }

  prepareAddForm () {
    this.fsid = this.$stateParams.fsid;
    this.cephClusterService.get()
      .$promise
      .then((clusters) => {
        this.clusters = clusters.results;
        this.clusters.forEach((cluster) => {
          if (cluster.fsid === this.fsid) {
            this.data.cluster = cluster;
          }
        });
        if (!this.data.cluster) {
          if (clusters.count > 0) {
            this.data.cluster = this.clusters[0];
          } else {
            this.Notification.warning({
              title: "No cluster available",
              msg: "You can't create any pools with your configuration."
            });
          }
        }

        this.rulesetChange();
        this.onDataClusterChange();
      });
  }

  pgUpdate (pgs, jump) {
    pgs = pgs || this.data.pg_num;
    let power = Math.round(Math.log(pgs) / Math.log(2));
    if (_.isNumber(jump)) {
      power += jump;
    }
    pgs = Math.pow(2, power); // Set size the nearest accurate size.
    if (pgs < this.pool.pg_num) {
      pgs = this.pool.pg_num;
    } else {
      this.data.pg_num = pgs;
    }
  }

  pgSizeChange () {
    if (this.editing) {
      return;
    }
    let pgs = this.data.osdCount * 100;
    let type = this.pool.type;
    let eprofile = this.pool.erasure.profile;
    if (type === "replicated") {
      pgs = pgs / this.pool.size;
    } else if (type === "erasure" && eprofile) {
      pgs = pgs / (eprofile.k + eprofile.m);
    }
    this.pgUpdate(pgs);
  }

  pgKeyChange (event) {
    if (event.keyCode === 38 || event.keyCode === 40) { // 38 == up arrow && 40 == down arrow
      this.pgUpdate(undefined, 39 - event.keyCode);
    } else if (event.keyCode === 187 || event.keyCode === 189) { // 187 == plus sign && 189 == minus sign
      this.pgUpdate(undefined, 188 - event.keyCode);
    }
  }

  ecProfileChange () {
    if (this.data.profiles.length === 1) {
      this.pool.erasure.profile = this.data.profiles[0];
    }
  }

  getMaxSize () {
    let osdCount = this.data.osdCount;
    let ruleset = this.data.ruleset;
    if (ruleset && ruleset.max_size < osdCount) {
      return ruleset.max_size;
    }
    return osdCount;
  }

  describeStep (step) {
    return [
      step.op.replace("_", " "),
      step.item_name || "",
      step.type ? step.num + " type " + step.type : ""
    ].join(" ");
  }

  rulesetChange () {
    if (this.data.ruleset) {
      this.pool.crush_ruleset = this.data.ruleset.rule_id;
      this.useRulesetSize();
    } else {
      this.pool.crush_ruleset = undefined;
    }

    if (!this.pool.type || !this.data.cluster.loaded) {
      return;
    }
    let rules = this.data.cluster.rules[this.pool.type];
    let ruleset = this.data.ruleset;
    if (rules.length === 0) {
      ruleset = undefined;
    } else if (rules.length === 1) {
      ruleset = rules[0];
    }
    this.data.ruleset = ruleset;
    this.useRulesetSize();
    this.pgSizeChange();
  }

  useRulesetSize () {
    let ruleset = this.data.ruleset;
    if (!ruleset || this.pool.type !== "replicated") {
      return;
    }
    let size = this.pool.size;
    if (size < ruleset.min_size) {
      this.pool.size = ruleset.min_size;
    } else if (size > ruleset.max_size) {
      this.pool.size = ruleset.max_size;
    }
  }

  onSizeChange () {
    this.useRulesetSize();
    this.pgSizeChange();
  }

  submitAction () {
    setTimeout(() => {
      if (this.poolForm.$valid) {
        let pool = {
          name: this.pool.name,
          pg_num: this.data.pg_num
        };
        const apps = {};
        this.apps.used.forEach((_app) => {
          apps[_app] = {};
        });
        pool.application_metadata = apps;
        if (this.editing) {
          this.submitEdit(pool);
        } else {
          this.submitAdd(pool);
        }
      }
    });
  }

  submitEdit (pool) {
    pool.id = this.$stateParams.poolId;
    this.cephPoolsService.update({
      fsid: this.$stateParams.fsid,
      id: pool.id
    }, pool)
      .$promise
      .then(() => {
        this.goToListView();
      }, () => {
        this.poolForm.$submitted = false;
      });
  }

  submitAdd (pool) {
    _.extend(pool, {
      type: this.pool.type,
      fsid: this.fsid,
      crush_ruleset: this.data.ruleset && this.data.ruleset.rule_id
    });
    if (pool.type === "replicated") {
      pool.min_size = 1; // No need for this here - API update needed.
      pool.size = this.pool.size;
    } else if (pool.type === "erasure") {
      pool.erasure_code_profile = this.pool.erasure.profile.name;
    }
    _.forIn(this.data.flags, (isSet, flag) => {
      if (_.isUndefined(pool.flags) && isSet) {
        pool.flags = [];
      }
      return isSet && pool.flags.push(flag);
    });
    // Compression
    if (this.pool.compression_mode !== "none") {
      pool.compression_algorithm = this.pool.compression_algorithm;
      pool.compression_mode = this.pool.compression_mode;
      pool.compression_min_blob_size = this.SizeParserService
        .parseInt(this.data.compression_min_blob_size, "b");
      pool.compression_max_blob_size = this.SizeParserService
        .parseInt(this.data.compression_max_blob_size, "b");
      pool.compression_required_ratio =
        this.pool.compression_required_ratio;
    }
    this.cephPoolsService.save(pool)
      .$promise
      .then(() => {
        this.goToListView();
      }, () => {
        this.poolForm.$submitted = false;
      });
  }

  cancelAction () {
    this.goToListView();
  }

  // Erasure Code Profile
  addErasureCodeProfile () {
    let modalInstance = this.$uibModal.open({
      component: "cephErasureCodeProfilesAddComponent",
      windowTemplate: require("../../../templates/messagebox.html"),
      resolve: {
        cluster:  () => {
          return this.data.cluster;
        },
        osd: () => {
          return this.data.osdCount;
        }
      }
    });

    modalInstance.result.then((profile) => {
    // Add and select created profile
      let len = this.data.profiles.push(profile);
      this.pool.erasure.profile = this.data.profiles[len - 1];
    });
  }

  deleteErasureCodeProfile () {
    let modalInstance = this.$uibModal.open({
      component: "CephErasureCodeProfilesDeleteComponent",
      windowTemplate: require("../../../templates/messagebox.html"),
      resolve: {
        cluster: () => {
          return this.data.cluster;
        },
        profile: () => {
          return this.pool.erasure.profile;
        }
      }
    });

    modalInstance.result.then(() => {
    // Remove item from select box
      let idx = this.data.profiles.indexOf(this.pool.erasure.profile);
      this.data.profiles.splice(idx, 1);
    });
  }

  updateCompressionMaxBlobSize () {
    let size = this.SizeParserService
      .parseInt(this.data.compression_max_blob_size, "b");
    this.data.compression_max_blob_size = this.$filter("bytes")(size);
  }

  updateCompressionMinBlobSize () {
    let size = this.SizeParserService
      .parseInt(this.data.compression_min_blob_size, "b");
    this.data.compression_min_blob_size = this.$filter("bytes")(size);
  }
}

export default {
  template: require("./ceph-pools-add.component.html"),
  controller: CephPoolsAdd
};
