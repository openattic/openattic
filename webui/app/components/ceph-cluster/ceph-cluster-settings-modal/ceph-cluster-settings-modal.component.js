/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

class cephClusterSettingsModal {

  constructor (cephClusterService) {
    this.cephClusterService = cephClusterService;

    this.model = undefined;
    this.data = {
      osd_flags: {
        "noin": {
          name: "No In",
          value: false,
          description: "OSDs that were previously marked out will not be marked back in when they start"
        },
        "noout": {
          name: "No Out",
          value: false,
          description: "OSDs will not automatically be marked out after the configured interval"
        },
        "noup": {
          name: "No Up",
          value: false,
          description: "OSDs are not allowed to start"
        },
        "nodown": {
          name: "No Down",
          value: false,
          description: "OSD failure reports are being ignored, such that the monitors will not mark OSDs down"
        },
        "pause": {
          name: "Pause",
          value: false,
          description: "Pauses reads and writes"
        },
        "noscrub": {
          name: "No Scrub",
          value: false,
          description: "Scrubbing is disabled"
        },
        "nodeep-scrub": {
          name: "No Deep Scrub",
          value: false,
          description: "Deep Scrubbing is disabled"
        },
        "nobackfill": {
          name: "No Backfill",
          value: false,
          description: "Backfilling of PGs is suspended"
        },
        "norecover": {
          name: "No Recover",
          value: false,
          description: "Recovery of PGs is suspended"
        }
      }
    };
  }

  $onInit () {
    this.cephClusterService.get({
      fsid: this.resolve.fsid
    })
      .$promise
      .then((res) => {
        this.model = res;

        res.osd_flags.forEach((value) => {
          if (this.data.osd_flags[value]) {
            this.data.osd_flags[value].value = true;
          }
        });
      })
      .catch((error) => {
        this.error = error;
      });
  }

  submitAction () {
    let requestModel = _.cloneDeep(this.model);
    let allFlags = Object.keys(this.data.osd_flags);
    requestModel.osd_flags =
      requestModel.osd_flags.filter(flag => !allFlags.includes(flag));

    _.forIn(this.data.osd_flags, (flag, key) => {
      if (flag.value) {
        requestModel.osd_flags.push(key);
      }
    });

    this.cephClusterService.update(requestModel)
      .$promise
      .then(() => {
        this.modalInstance.dismiss("cancel");
      }, () => {
        this.clusterForm.$submitted = false;
      });
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./ceph-cluster-settings-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: cephClusterSettingsModal
};

