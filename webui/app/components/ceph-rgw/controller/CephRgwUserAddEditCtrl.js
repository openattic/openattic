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
app.controller("CephRgwUserAddEditCtrl", function ($scope, $state, $stateParams, $uibModal,
    $q, $filter, $window, $timeout, cephRgwHelpersService, cephRgwUserService) {
  $scope.user = {
    "subusers": [],
    "keys": [],
    "swift_keys": [],
    "caps": [],
    "bucket_quota": {
      "enabled": false,
      "max_size": "",
      "max_size_unlimited": true,
      "max_objects": "",
      "max_objects_unlimited": true
    },
    "user_quota": {
      "enabled": false,
      "max_size": "",
      "max_size_unlimited": true,
      "max_objects": "",
      "max_objects_unlimited": true
    }
  };
  $scope.error = false;
  $scope.requests = [];

  if (!$stateParams.user_id) {
    $scope.editing = false;

    angular.extend($scope.user, {
      generate_key: true,
      access_key: "",
      secret_key: ""
    });

    $scope.submitAction = function (userForm) {
      if (userForm.$valid === true) {
        // Get the arguments to create the user.
        var userArgs = _getUserPutArgs(userForm);
        _addRequest(function (args) {
          return cephRgwUserService.put(args, undefined).$promise;
        }, [userArgs]);
        // Check if user quota has been modified.
        if (_isUserQuotaDirty(userForm)) {
          var userQuotaArgs = _getUserQuotaPutArgs(userForm);
          _addRequest(function (args) {
            return cephRgwUserService.putQuota(args, undefined).$promise;
          }, [userQuotaArgs]);
        }
        // Check if bucket quota has been modified.
        if (_isBucketQuotaDirty(userForm)) {
          var bucketQuotaArgs = _getBucketQuotaPutArgs(userForm);
          _addRequest(function (args) {
            return cephRgwUserService.putQuota(args, undefined).$promise;
          }, [bucketQuotaArgs]);
        }
        // Process all requests (including the creation of the user and
        // additional RGW Admin Ops API calls).
        _doSubmitAction(userForm);
      }
    };
  } else {
    $scope.editing = true;

    // Load the user data.
    var requests = [];
    requests.push(
      // Load the user information.
      cephRgwUserService.get({
        "uid": $stateParams.user_id
      }).$promise);
    requests.push(
      // Load the user/bucket quota.
      cephRgwUserService.getQuota({
        "uid": $stateParams.user_id
      }).$promise
    );
    $q.all(requests)
      .then(function (res) {
        // Map capabilities.
        var mapPerm = {"read, write": "*"};
        angular.forEach(res[0].caps, function (cap) {
          if (cap.perm in mapPerm) {
            cap.perm = mapPerm[cap.perm];
          }
        });
        // Set the user information.
        $scope.user = res[0];
        // Append the user/bucket quota.
        $scope.user.user_quota = res[1].user_quota;
        $scope.user.bucket_quota = res[1].bucket_quota;
      })
      .catch(function (error) {
        $scope.error = error;
      });

    $scope.submitAction = function (userForm) {
      // Check if the general user settings have been modified.
      if (_isUserDirty(userForm)) {
        var userArgs = _getUserPostArgs(userForm);
        _addRequest(function (args) {
          return cephRgwUserService.post(args, undefined).$promise;
        }, [userArgs]);
      }
      // Check if user quota has been modified.
      if (_isUserQuotaDirty(userForm)) {
        var userQuotaArgs = _getUserQuotaPutArgs(userForm);
        _addRequest(function (args) {
          return cephRgwUserService.putQuota(args, undefined).$promise;
        }, [userQuotaArgs]);
      }
      // Check if bucket quota has been modified.
      if (_isBucketQuotaDirty(userForm)) {
        var bucketQuotaArgs = _getBucketQuotaPutArgs(userForm);
        _addRequest(function (args) {
          return cephRgwUserService.putQuota(args, undefined).$promise;
        }, [bucketQuotaArgs]);
      }
      // Process all requests.
      _doSubmitAction(userForm);
    };

    $scope.$watch("user.user_quota.max_size_unlimited", function (checked) {
      // Reset an invalid value to ensure that the form is not blocked.
      if (checked && $scope.userForm.user_quota_max_size.$invalid) {
        $scope.user.user_quota.max_size = "";
      }
    });

    $scope.$watch("user.user_quota.max_objects_unlimited", function (checked) {
      // Reset an invalid value to ensure that the form is not blocked.
      if (checked && $scope.userForm.user_quota_max_objects.$invalid) {
        $scope.user.user_quota.max_objects = "";
      }
    });

    $scope.$watch("user.bucket_quota.max_size_unlimited", function (checked) {
      // Reset an invalid value to ensure that the form is not blocked.
      if (checked && $scope.userForm.bucket_quota_max_size.$invalid) {
        $scope.user.bucket_quota.max_size = "";
      }
    });

    $scope.$watch("user.bucket_quota.max_objects_unlimited", function (checked) {
      // Reset an invalid value to ensure that the form is not blocked.
      if (checked && $scope.userForm.bucket_quota_max_objects.$invalid) {
        $scope.user.bucket_quota.max_objects = "";
      }
    });

    /**
     * Select the specified input field when the checkbox is unchecked.
     * @param checked The status of the checkbox.
     * @param id The HTML ID of the input field that should be focused.
     */
    $scope.onChangeUnlimited = function (checked, id) {
      var element = $window.document.getElementById(id);
      if (element && !checked) {
        $timeout(function () {
          element.focus();
          element.select();
        });
      }
    };
  }

  /**
   * Go to the users list view.
   */
  $scope.goToListView = function () {
    $state.go("ceph-rgw-users");
  };

  /**
   * Helper function that executes all requests.
   * @param userForm The HTML formular.
   */
  var _doSubmitAction = function (userForm) {
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
        userForm.$submitted = false;
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
   * Display a modal dialog.
   * @param type The type of the dialog, e.g. subuser|s3key|swiftkey|capability.
   * @param index Optional. The index of the selected configuration object.
   * @private
   */
  var _showModalDialog = function (type, index) {
    var typeMap = {
      subuser: {
        templateUrl: "components/ceph-rgw/templates/cephRgwUserAddEditSubuserModal.html",
        controller: "CephRgwUserAddEditSubuserModalCtrl"
      },
      s3key: {
        templateUrl: "components/ceph-rgw/templates/cephRgwUserAddEditS3KeyModal.html",
        controller: "CephRgwUserAddEditS3KeyModalCtrl"
      },
      swiftkey: {
        templateUrl: "components/ceph-rgw/templates/cephRgwUserAddEditSwiftKeyModal.html",
        controller: "CephRgwUserAddEditSwiftKeyModalCtrl"
      },
      capability: {
        templateUrl: "components/ceph-rgw/templates/CephRgwUserAddEditCapabilityModal.html",
        controller: "CephRgwUserAddEditCapabilityModalCtrl"
      }
    };
    return $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: typeMap[type].templateUrl,
      controller: typeMap[type].controller,
      resolve: {
        user: function () {
          return $scope.user;
        },
        index: function () {
          return index;
        }
      }
    });
  };

  /**
   * Helper function to get the arguments of the PUT request when a new
   * user is created.
   * @private
   */
  var _getUserPutArgs = function () {
    var caps = [];
    angular.forEach($scope.user.caps, function (cap) {
      caps.push(cap.type + "=" + cap.perm.replace(" ", ""));
    });
    var args = {
      "uid": $scope.user.user_id,
      "display-name": $scope.user.display_name
    };
    if ($scope.user.suspended) {
      angular.extend(args, {
        "suspended": Boolean($scope.user.suspended)
      });
    }
    if (angular.isString($scope.user.email) && $scope.user.email !== "") {
      angular.extend(args, {
        "email": $scope.user.email
      });
    }
    if (caps.length > 0) {
      angular.extend(args, {
        "user-caps": caps.join(";")
      });
    }
    if ($scope.user.max_buckets > 0) {
      angular.extend(args, {
        "max-buckets": $scope.user.max_buckets
      });
    }
    if (!$scope.user.generate_key) {
      angular.extend(args, {
        "access-key": $scope.user.access_key,
        "secret-key": $scope.user.secret_key
      });
    } else {
      angular.extend(args, {
        "generate-key": true
      });
    }
    return args;
  };

  /**
   * Check if the user settings have been modified.
   * @param userForm The HTML formular.
   * @return Returns TRUE if the user settings have been modified.
   * @private
   */
  var _isUserDirty = function (userForm) {
    var names = [
      "display_name",
      "email",
      "max_buckets",
      "suspended"
    ];
    var dirty = names.some(function (name) {
      return userForm[name].$dirty;
    });
    return dirty;
  };

  /**
   * Helper function to get the arguments for the POST request when the user
   * configuration has been modified.
   * @param userForm The HTML formular.
   * @private
   */
  var _getUserPostArgs = function (userForm) {
    var map = [{
      "formName": "display_name",
      "srcName": "display_name",
      "dstName": "display-name"
    }, {
      "formName": "email",
      "srcName": "email",
      "dstName": "email"
    }, {
      "formName": "max_buckets",
      "srcName": "max_buckets",
      "dstName": "max-buckets"
    }, {
      "formName": "suspended",
      "srcName": "suspended",
      "dstName": "suspended",
      "convertFn": function (value) {
        return Boolean(value);
      }
    }];
    var args = {
      "uid": $scope.user.user_id
    };
    angular.forEach(map, function (item) {
      if (userForm[item.formName].$dirty === true) {
        var value = $scope.user[item.srcName];
        if (angular.isFunction(item.convertFn)) {
          value = item.convertFn.apply(this, [value]);
        }
        args[item.dstName] = value;
      }
    });
    return args;
  };

  /**
   * Helper method to mark the formular as dirty.
   */
  var _markFormAsDirty = function () {
    $scope.userForm.$setDirty();
  };

  /**
   * Check if the user quota has been modified.
   * @param userForm The HTML formular.
   * @return Returns TRUE if the user quota has been modified.
   * @private
   */
  var _isUserQuotaDirty = function (userForm) {
    return [
      "user_quota_enabled",
      "user_quota_max_size",
      "user_quota_max_size_unlimited",
      "user_quota_max_objects",
      "user_quota_max_objects_unlimited"
    ].some(function (name) {
      return userForm[name].$dirty;
    });
  };

  /**
   * Check if the bucket quota has been modified.
   * @param userForm The HTML formular.
   * @return Returns TRUE if the bucket quota has been modified.
   * @private
   */
  var _isBucketQuotaDirty = function (userForm) {
    return [
      "bucket_quota_enabled",
      "bucket_quota_max_size",
      "bucket_quota_max_size_unlimited",
      "bucket_quota_max_objects",
      "bucket_quota_max_objects_unlimited"
    ].some(function (name) {
      return userForm[name].$dirty;
    });
  };

  /**
   * Helper function to get the arguments for the PUT request when the user
   * quota configuration has been modified.
   * @private
   */
  var _getUserQuotaPutArgs = function () {
    var args = {
      "uid": $scope.user.user_id,
      "quota-type": "user",
      "enabled": $scope.user.user_quota.enabled
    };
    if ($scope.user.user_quota.max_size_unlimited) {
      args["max-size-kb"] = -1;
    } else {
      // Convert the given value to bytes.
      var bytes = $filter("toBytes")($scope.user.user_quota.max_size);
      // Finally convert the value to KiB.
      args["max-size-kb"] = $filter("bytes")(bytes, {
        "outPrecision": 0,
        "outUnit": "KiB",
        "appendUnit": false
      });
    }
    if ($scope.user.user_quota.max_objects_unlimited) {
      args["max-objects"] = -1;
    } else {
      args["max-objects"] = $scope.user.user_quota.max_objects;
    }
    return args;
  };

  /**
   * Helper function to get the arguments for the PUT request when the bucket
   * quota configuration has been modified.
   * @private
   */
  var _getBucketQuotaPutArgs = function () {
    var args = {
      "uid": $scope.user.user_id,
      "quota-type": "bucket",
      "enabled": $scope.user.bucket_quota.enabled
    };
    if ($scope.user.bucket_quota.max_size_unlimited) {
      args["max-size-kb"] = -1;
    } else {
      // Convert the given value to bytes.
      var bytes = $filter("toBytes")($scope.user.bucket_quota.max_size);
      // Finally convert the value to KiB.
      args["max-size-kb"] = $filter("bytes")(bytes, {
        "outPrecision": 0,
        "outUnit": "KiB",
        "appendUnit": false
      });
    }
    if ($scope.user.bucket_quota.max_objects_unlimited) {
      args["max-objects"] = -1;
    } else {
      args["max-objects"] = $scope.user.bucket_quota.max_objects;
    }
    return args;
  };

  /**
   * Helper function to get the arguments for the request e.g. add, modify or
   * delete subusers, keys and capabilites.
   * @param type The request type, e.g. subuser, s3key, swiftkey or caps.
   * @param action The request action, e.g. add, modify or delete.
   * @param data The request data.
   * @private
   */
  var _getTypeArgs = function (type, action, data) {
    var mapPermission = {
      "full-control": "full",
      "read-write": "readwrite"
    };
    var args = {
      "type": type,
      "uid": $scope.user.user_id
    };
    switch (action) {
      case "add":
        switch (type) {
          case "subuser":
            angular.extend(args, {
              "subuser": data.subuser,
              "access": (data.permissions in mapPermission) ?
                mapPermission[data.permissions] :
                data.permissions,
              "key-type": "swift"
            });
            if (!data.generate_secret) {
              angular.extend(args, {
                "secret-key": data.secret_key
              });
            } else {
              angular.extend(args, {
                "generate-secret": true
              });
            }
            break;
          case "s3key":
            angular.extend(args, {
              "type": "key",
              "key-type": "s3",
              "generate-key": Boolean(data.generate_key)
            });
            if (cephRgwHelpersService.isSubuser($scope.user, data.user)) {
              angular.extend(args, {
                "subuser": data.user
              });
            }
            if (!data.generate_key) {
              angular.extend(args, {
                "access-key": data.access_key,
                "secret-key": data.secret_key
              });
            }
            break;
          case "swiftkey":
            /* A key is automatically created with a subuser. It is not possible to
             * apply multiple Swift keys per user.
            angular.extend(args, {
              "type": "key",
              "subuser": data.user,
              "key-type": "swift",
              "generate-key": Boolean(data.generate_key)
            });
            if (!data.generate_key) {
              angular.extend(args, {
                "secret-key": data.secret_key
              });
            }
            */
            break;
          case "caps":
            angular.extend(args, {
              "user-caps": data.type + "=" + data.perm
            });
            break;
        }
        break;
      case "modify":
        switch (type) {
          case "subuser":
            angular.extend(args, {
              "subuser": data.subuser,
              "access": (data.permissions in mapPermission) ?
                mapPermission[data.permissions] :
                data.permissions
            });
            break;
          case "s3key":
            break;
          case "swiftkey":
            break;
          case "caps":
            break;
        }
        break;
      case "delete":
        switch (type) {
          case "subuser":
            angular.extend(args, {
              "subuser": data.id,
              "purge-keys": true
            });
            break;
          case "s3key":
            angular.extend(args, {
              "type": "key",
              "key-type": "s3",
              "access-key": data.access_key
            });
            break;
          case "swiftkey":
            /* A Swift key is purged when the subuser is deleted.
            angular.extend(args, {
              "type": "key",
              "key-type": "swift",
              "subuser": data.user
            });
            */
            break;
          case "caps":
            angular.extend(args, {
              "user-caps": data.type + "=" + data.perm
            });
            break;
        }
        break;
    }
    return args;
  };

  /**
   * Get the deferred promise that will be executed when the 'Submit' button is
   * pressed. This should be done when a subuser, capability or key is created,
   * modified or deleted.
   * @param type The request type, e.g. subuser, s3key, swiftkey or caps.
   * @param action The request action, e.g. add, modify or delete.
   * @param data The request data.
   * @private
   */
  var _getPromiseByType = function (type, action, data) {
    var promise;
    var args = _getTypeArgs(type, action, data);
    switch (action) {
      case "add":
        promise = cephRgwUserService.putType(args, undefined).$promise;
        break;
      case "modify":
        promise = cephRgwUserService.postType(args, undefined).$promise;
        break;
      case "delete":
        promise = cephRgwUserService.deleteType(args, undefined).$promise;
        break;
    }
    return promise;
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

  $scope.addEditSubuser = function (index) {
    var modalInstance = _showModalDialog("subuser", index);
    modalInstance.result.then(function (result) {
      _addRequest(_getPromiseByType, ["subuser", result.action, result.data]);
      var subuser = {
        "id": cephRgwHelpersService.buildSubuserId($scope.user.user_id, result.data.subuser),
        "permissions": result.data.permissions
      };
      switch (result.action) {
        case "add":
          $scope.user.subusers.push(subuser);
          // Additionally a Swift key will be added.
          $scope.user.swift_keys.push({
            "user": subuser.id,
            "secret_key": result.data.generate_secret ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
        case "modify":
          $scope.user.subusers[index] = subuser;
          break;
      }
      _markFormAsDirty();
    });
  };

  $scope.removeSubuser = function (index) {
    var subuser = $scope.user.subusers[index];
    _addRequest(_getPromiseByType, ["subuser", "delete", subuser]);
    // Remove the associated S3 keys.
    $scope.user.keys = $scope.user.keys.filter(function (key) {
      return key.user !== subuser.id;
    });
    // Remove the associated Swift keys.
    $scope.user.swift_keys = $scope.user.swift_keys.filter(function (key) {
      return key.user !== subuser.id;
    });
    // Finally remove the subuser itself.
    $scope.user.subusers.splice(index, 1);
    _markFormAsDirty();
  };

  $scope.addViewS3Key = function (index) {
    var modalInstance = _showModalDialog("s3key", index);
    modalInstance.result.then(function (result) {
      _addRequest(_getPromiseByType, ["s3key", result.action, result.data]);
      switch (result.action) {
        case "add":
          $scope.user.keys.push({
            "user": result.data.user,
            "access_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.access_key,
            "secret_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
      }
      _markFormAsDirty();
    });
  };

  $scope.removeS3Key = function (index) {
    _addRequest(_getPromiseByType, ["s3key", "delete", $scope.user.keys[index]]);
    $scope.user.keys.splice(index, 1);
    _markFormAsDirty();
  };

  $scope.addViewSwiftKey = function (index) {
    var modalInstance = _showModalDialog("swiftkey", index);
    modalInstance.result.then(function (result) {
      _addRequest(_getPromiseByType, ["swiftkey", result.action, result.data]);
      switch (result.action) {
        case "add":
          $scope.user.swift_keys.push({
            "user": result.data.user,
            "secret_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
      }
      _markFormAsDirty();
    });
  };

  /* A Swift key is purged when the subuser is deleted.
  $scope.removeSwiftKey = function (index) {
    _addRequest(_getPromiseByType, ["swiftkey", "delete", $scope.user.swift_keys[index]]);
    $scope.user.swift_keys.splice(index, 1);
    _markFormAsDirty();
  };
  */

  $scope.addEditCapability = function (index) {
    var modalInstance = _showModalDialog("capability", index);
    modalInstance.result.then(function (result) {
      switch (result.action) {
        case "add":
          _addRequest(_getPromiseByType, ["caps", result.action, result.data]);
          $scope.user.caps.push(angular.copy(result.data));
          break;
        case "modify":
          // Note, the RadosGW Admin OPS API does not support the modification of
          // user capabilities. Because of that it is necessary to delete it and
          // then to re-add the capability with its new value/permission.
          _addRequest(_getPromiseByType, ["caps", "delete", $scope.user.caps[index]]);
          _addRequest(_getPromiseByType, ["caps", "add", result.data]);
          $scope.user.caps[index] = angular.copy(result.data);
          break;
      }
      _markFormAsDirty();
    });
  };

  $scope.removeCapability = function (index) {
    _addRequest(_getPromiseByType, ["caps", "delete", $scope.user.caps[index]]);
    $scope.user.caps.splice(index, 1);
    _markFormAsDirty();
  };
});
