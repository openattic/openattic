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

class CephRgwBucketForm {
  constructor ($state, $stateParams, $q, cephRgwUserService, cephRgwBucketService) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$q = $q;
    this.cephRgwUserService = cephRgwUserService;
    this.cephRgwBucketService = cephRgwBucketService;

    this.bucket = {};
    this.editing = false;
    this.formDataIsReady = false;
    this.error = false;
    this.requests = [];
    this.owners = [];
  }

  $onInit () {
    let promises = [
      // Get the list of possible owners.
      this.cephRgwUserService.enumerate().$promise
    ];

    if (!this.$stateParams.bucket) { // Add
      this.editing = false;
    } else { // Edit
      this.editing = true;
      // Load the bucket data.
      promises.push(
        this.cephRgwBucketService.get({
          "bucket": this.$stateParams.bucket
        })
          .$promise);
    }

    this.$q.all(promises)
      .then((res) => {
        this.owners = res[0];
        if (res[1]) {
          this.bucket = res[1];
        }
        this.formDataIsReady = true;
      })
      .catch((error) => {
        this.error = error;
      });
  }

  submitAction (bucketForm) {
    if (this.editing) { // Edit
      // Check if the general bucket settings have been modified.
      if (this._isBucketDirty(bucketForm)) {
        // Link the bucket to the specified user.
        let bucketArgs = {
          "bucket": this.bucket.bucket,
          "bucket-id": this.bucket.id,
          "uid": this.bucket.owner
        };
        this._addRequest((args) => {
          return this.cephRgwBucketService.put(args, undefined).$promise;
        }, [bucketArgs]);
      }
      // Process all requests.
      this._doSubmitAction(bucketForm);
    } else { // Add
      if (bucketForm.$valid === true) {
        // Get the arguments to create the bucket.
        let bucketArgs = {
          "bucket": this.bucket.bucket,
          "uid": this.bucket.owner
        };
        this._addRequest((args) => {
          return this.cephRgwBucketService.create(args, undefined).$promise;
        }, [bucketArgs]);
        // Process all requests (including the creation of the user and
        // additional RGW Admin Ops API calls).
        this._doSubmitAction(bucketForm);
      }
    }
  }

  /**
   * Go to the users list view.
   */
  goToListView () {
    this.$state.go("ceph-rgw-buckets");
  }

  /**
   * Helper function that executes all requests.
   * @param bucketForm The HTML formular.
   */
  _doSubmitAction (bucketForm) {
    let fn = (request) => {
      let promise = request.getPromiseFn.apply(this, request.args);
      promise.then(() => {
        // Remove the successful request.
        this.requests.shift();
        // Execute another request?
        if (this.requests.length > 0) {
          fn(this.requests[0]);
        } else {
          this.goToListView();
        }
      }, () => {
        bucketForm.$submitted = false;
        // Clear all requests.
        this.requests = [];
      });
    };
    // Process all requests (RGW Admin Ops API calls) in sequential order.
    if (this.requests.length > 0) {
      fn(this.requests[0]);
    } else {
      this.goToListView();
    }
  }

  /**
   * Check if the bucket settings have been modified.
   * @param bucketForm The HTML formular.
   * @returns {Boolean} Returns TRUE if the bucket settings have been modified.
   * @private
   */
  _isBucketDirty (bucketForm) {
    const names = ["owner"];
    const dirty = names.some((name) => {
      return bucketForm[name].$dirty;
    });
    return dirty;
  }

  /**
   * Add a request which will be executed when clicking the 'Submit'-button.
   * @param fn The function that builds the promise.
   * @param args The function arguments.
   * @private
   */
  _addRequest (fn, args) {
    this.requests.push({
      getPromiseFn: fn,
      args: _.cloneDeep(args)
    });
  }
}

export default {
  template: require("./ceph-rgw-bucket-form.component.html"),
  controller: CephRgwBucketForm
};
