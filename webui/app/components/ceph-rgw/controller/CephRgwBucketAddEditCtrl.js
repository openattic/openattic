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

var app = angular.module("openattic.cephRgw");
app.controller("CephRgwBucketAddEditCtrl", function ($scope, $state, $stateParams, $uibModal,
    $q, $filter, $window, $timeout, cephRgwUserService, cephRgwBucketService) {
  $scope.bucket = {};
  $scope.error = false;
  $scope.requests = [];
  $scope.owners = [];

  // Get the list of possible owners.
  cephRgwUserService.enumerate()
    .$promise
    .then(function (res) {
      $scope.owners = res;
    });

  if (!$stateParams.bucket) {
    $scope.editing = false;

    $scope.submitAction = function (bucketForm) {
      if (bucketForm.$valid === true) {
        // Get the arguments to create the bucket.
        // !!! Note, this is the same API call as linking a bucket to a user,
        // except the 'bucket-id' is submitted. The bucket will be created
        // on demand. !!!
        var bucketArgs = {
          "bucket": $scope.bucket.bucket,
          "uid": $scope.bucket.owner
        };
        _addRequest(function (args) {
          return cephRgwBucketService.put(args, undefined).$promise;
        }, [bucketArgs]);
        // Process all requests (including the creation of the user and
        // additional RGW Admin Ops API calls).
        _doSubmitAction(bucketForm);
      }
    };
  } else {
    $scope.editing = true;

    // Load the bucket data.
    cephRgwBucketService.get({
      "bucket": $stateParams.bucket
    })
      .$promise
      .then(function (res) {
        $scope.bucket = res;
      })
      .catch(function (error) {
        $scope.error = error;
      });

    $scope.submitAction = function (bucketForm) {
      // Check if the general bucket settings have been modified.
      if (_isBucketDirty(bucketForm)) {
        // Link the bucket to the specified user.
        var bucketArgs = {
          "bucket": $scope.bucket.bucket,
          "bucket-id": $scope.bucket.id,
          "uid": $scope.bucket.owner
        };
        _addRequest(function (args) {
          return cephRgwBucketService.put(args, undefined).$promise;
        }, [bucketArgs]);
      }
      // Process all requests.
      _doSubmitAction(bucketForm);
    };
  }

  /**
   * Go to the users list view.
   */
  $scope.goToListView = function () {
    $state.go("ceph-rgw-buckets");
  };

  /**
   * Execute action if the 'Cancel' button has been pressed.
   */
  $scope.cancelAction = function () {
    $scope.goToListView();
  };

  /**
   * Helper function that executes all requests.
   * @param bucketForm The HTML formular.
   */
  var _doSubmitAction = function (bucketForm) {
    var fn = function (request) {
      var promise = request.getPromiseFn.apply(this, request.args);
      promise.then(function () {
        // Remove the successful request.
        $scope.requests.shift();
        // Execute another request?
        if ($scope.requests.length > 0) {
          fn($scope.requests[0]);
        } else {
          $scope.goToListView();
        }
      }, function () {
        bucketForm.$submitted = false;
        // Clear all requests.
        $scope.requests = [];
      });
    };
    // Process all requests (RGW Admin Ops API calls) in sequential order.
    if ($scope.requests.length > 0) {
      fn($scope.requests[0]);
    } else {
      $scope.goToListView();
    }
  };

  /**
   * Check if the bucket settings have been modified.
   * @param bucketForm The HTML formular.
   * @return Returns TRUE if the bucket settings have been modified.
   * @private
   */
  var _isBucketDirty = function (bucketForm) {
    var names = [
      "owner"
    ];
    var dirty = names.some(function (name) {
      return bucketForm[name].$dirty;
    });
    return dirty;
  };

  /**
   * Add a request which will be executed when clicking the 'Submit'-button.
   * @param fn The function that builds the promise.
   * @param args The function arguments.
   * @private
   */
  var _addRequest = function (fn, args) {
    $scope.requests.push({
      getPromiseFn: fn,
      args: angular.copy(args)
    });
  };
});
