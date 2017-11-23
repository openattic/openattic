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

class CephRgwUserForm {
  constructor ($state, $stateParams, $uibModal, $q, $filter,
      cephRgwHelpersService, cephRgwUserService, Notification) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$uibModal = $uibModal;
    this.$filter = $filter;
    this.$q = $q;
    this.cephRgwHelpersService = cephRgwHelpersService;
    this.cephRgwUserService = cephRgwUserService;
    this.Notification = Notification;

    this.user = {
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
    this.editing = false;
    this.error = false;
    this.requests = [];
  }

  $onInit () {
    if (!this.$stateParams.user_id) { // Add
      this.editing = false;
      // Set default values.
      _.extend(this.user, {
        generate_key: true,
        access_key: "",
        secret_key: ""
      });
    } else { // Edit
      this.editing = true;
      // Load the user data.
      let promises = [];
      promises.push(
        // Load the user information.
        this.cephRgwUserService.get({
          "uid": this.$stateParams.user_id
        }).$promise);
      promises.push(
        // Load the user/bucket quota.
        this.cephRgwUserService.getQuota({
          "uid": this.$stateParams.user_id
        }).$promise
      );
      this.$q.all(promises)
        .then((res) => {
          // Map capabilities.
          const mapPerm = {"read, write": "*"};
          res[0].caps.forEach((cap) => {
            if (cap.perm in mapPerm) {
              cap.perm = mapPerm[cap.perm];
            }
          });
          // Set the user information.
          this.user = res[0];
          // Append the user/bucket quota.
          this.user.user_quota = res[1].user_quota;
          this.user.bucket_quota = res[1].bucket_quota;
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  submitAction (userForm) {
    if (this.editing) { // Edit
      // Check if the general user settings have been modified.
      if (this._isUserDirty(userForm)) {
        const userArgs = this._getUserPostArgs(userForm);
        this._addRequest((args) => {
          return this.cephRgwUserService.post(args, undefined).$promise;
        }, [userArgs]);
      }
      // Check if user quota has been modified.
      if (this._isUserQuotaDirty(userForm)) {
        const userQuotaArgs = this._getUserQuotaPutArgs(userForm);
        this._addRequest((args) => {
          return this.cephRgwUserService.putQuota(args, undefined).$promise;
        }, [userQuotaArgs]);
      }
      // Check if bucket quota has been modified.
      if (this._isBucketQuotaDirty(userForm)) {
        const bucketQuotaArgs = this._getBucketQuotaPutArgs(userForm);
        this._addRequest((args) => {
          return this.cephRgwUserService.putQuota(args, undefined).$promise;
        }, [bucketQuotaArgs]);
      }
      // Process all requests.
      this._doSubmitAction(userForm);
    } else { // Add
      if (userForm.$valid === true) {
        // Get the arguments to create the user.
        const userArgs = this._getUserPutArgs(userForm);
        this._addRequest((args) => {
          return this.cephRgwUserService.put(args, undefined).$promise;
        }, [userArgs]);
        // Check if user quota has been modified.
        if (this._isUserQuotaDirty(userForm)) {
          const userQuotaArgs = this._getUserQuotaPutArgs(userForm);
          this._addRequest((args) => {
            return this.cephRgwUserService.putQuota(args, undefined).$promise;
          }, [userQuotaArgs]);
        }
        // Check if bucket quota has been modified.
        if (this._isBucketQuotaDirty(userForm)) {
          const bucketQuotaArgs = this._getBucketQuotaPutArgs(userForm);
          this._addRequest((args) => {
            return this.cephRgwUserService.putQuota(args, undefined).$promise;
          }, [bucketQuotaArgs]);
        }
        // Process all requests (including the creation of the user and
        // additional RGW Admin Ops API calls).
        this._doSubmitAction(userForm);
      }
    }
  }

  onChangeUserQuotaMaxSizeUnlimited () {
    const checked = this.user.user_quota.max_size_unlimited;
    // Reset an invalid value to ensure that the form is not blocked.
    if (checked && this.userForm.user_quota_max_size.$invalid) {
      this.user.user_quota.max_size = "";
    }
    this._onChangeUnlimitedSetFocus(checked,
      this.userForm.user_quota_max_size.$name);
  }

  onChangeUserQuotaMaxObjectsUnlimited () {
    const checked = this.user.user_quota.max_objects_unlimited;
    // Reset an invalid value to ensure that the form is not blocked.
    if (checked && this.userForm.user_quota_max_objects.$invalid) {
      this.user.user_quota.max_objects = "";
    }
    this._onChangeUnlimitedSetFocus(checked,
      this.userForm.user_quota_max_objects.$name);
  }

  onChangeBucketQuotaMaxSizeUnlimited () {
    const checked = this.user.bucket_quota.max_size_unlimited;
    // Reset an invalid value to ensure that the form is not blocked.
    if (checked && this.userForm.bucket_quota_max_size.$invalid) {
      this.user.bucket_quota.max_size = "";
    }
    this._onChangeUnlimitedSetFocus(checked,
      this.userForm.bucket_quota_max_size.$name);
  }

  onChangeBucketQuotaMaxObjectsUnlimited () {
    const checked = this.user.bucket_quota.max_objects_unlimited;
    // Reset an invalid value to ensure that the form is not blocked.
    if (checked && this.userForm.bucket_quota_max_objects.$invalid) {
      this.user.bucket_quota.max_objects = "";
    }
    this._onChangeUnlimitedSetFocus(checked,
      this.userForm.bucket_quota_max_objects.$name);
  }

  /**
   * Select the specified input field when the checkbox is unchecked.
   * @param checked The status of the checkbox.
   * @param id The HTML ID of the input field that should be focused.
   */
  _onChangeUnlimitedSetFocus (checked, id) {
    const element = document.getElementById(id);
    if (element && !checked) {
      setTimeout(() => {
        element.select();
        element.focus();
      });
    }
  }

  /**
   * Go to the users list view.
   */
  goToListView () {
    this.$state.go("ceph-rgw-users");
  }

  /**
   * Helper function that executes all requests.
   * @param userForm The HTML formular.
   */
  _doSubmitAction (userForm) {
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
      }, (error) => {
        if (_.isObjectLike(error.data) && error.data.Code === "EmailExists") {
          // Do not display the default error message, instead display a more
          // meaningful error message. Additionally mark the input field as
          // invalid.
          error.preventDefault();
          this.Notification.error({
            title: "Email already exists",
            msg: `The email address ${this.user.email} is already assigned to another user.`
          });
          userForm.email.$invalid = true;
        }
        userForm.$submitted = false;
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
   * Display a modal dialog.
   * @param type The type of the dialog, e.g. subuser|s3key|swiftkey|capability.
   * @param index Optional. The index of the selected configuration object.
   * @private
   */
  _showModalDialog (type, index) {
    const typeMap = {
      subuser: "cephRgwUserFormSubuserModal",
      s3key: "cephRgwUserFormS3KeyModal",
      swiftkey: "cephRgwUserFormSwiftKeyModal",
      capability: "cephRgwUserFormCapabilityModal"
    };
    return this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: typeMap[type],
      resolve: {
        user: () => {
          return this.user;
        },
        index: () => {
          return index;
        }
      }
    });
  }

  /**
   * Helper function to get the arguments of the PUT request when a new
   * user is created.
   * @private
   */
  _getUserPutArgs () {
    let caps = [];
    this.user.caps.forEach((cap) => {
      caps.push(cap.type + "=" + cap.perm.replace(" ", ""));
    });
    let args = {
      "uid": this.user.user_id,
      "display-name": this.user.display_name
    };
    if (this.user.suspended) {
      _.extend(args, {
        "suspended": Boolean(this.user.suspended)
      });
    }
    if (_.isString(this.user.email) && this.user.email !== "") {
      _.extend(args, {
        "email": this.user.email
      });
    }
    if (caps.length > 0) {
      _.extend(args, {
        "user-caps": caps.join(";")
      });
    }
    if (this.user.max_buckets > 0) {
      _.extend(args, {
        "max-buckets": this.user.max_buckets
      });
    }
    if (!this.user.generate_key) {
      _.extend(args, {
        "access-key": this.user.access_key,
        "secret-key": this.user.secret_key
      });
    } else {
      _.extend(args, {
        "generate-key": true
      });
    }
    return args;
  }

  /**
   * Check if the user settings have been modified.
   * @param userForm The HTML formular.
   * @return {Boolean} Returns TRUE if the user settings have been modified.
   * @private
   */
  _isUserDirty (userForm) {
    const names = [
      "display_name",
      "email",
      "max_buckets",
      "suspended"
    ];
    const dirty = names.some((name) => {
      return userForm[name].$dirty;
    });
    return dirty;
  }

  /**
   * Helper function to get the arguments for the POST request when the user
   * configuration has been modified.
   * @param userForm The HTML formular.
   * @private
   */
  _getUserPostArgs (userForm) {
    const map = [{
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
      "convertFn": (value) => {
        return Boolean(value);
      }
    }];
    let args = {
      "uid": this.user.user_id
    };
    map.forEach((item) => {
      if (userForm[item.formName].$dirty === true) {
        let value = this.user[item.srcName];
        if (_.isFunction(item.convertFn)) {
          value = item.convertFn.apply(this, [value]);
        }
        args[item.dstName] = value;
      }
    });
    return args;
  }

  /**
   * Helper method to mark the formular as dirty.
   */
  _markFormAsDirty () {
    this.userForm.$setDirty();
  }

  /**
   * Check if the user quota has been modified.
   * @param userForm The HTML formular.
   * @return Returns TRUE if the user quota has been modified.
   * @private
   */
  _isUserQuotaDirty (userForm) {
    return [
      "user_quota_enabled",
      "user_quota_max_size",
      "user_quota_max_size_unlimited",
      "user_quota_max_objects",
      "user_quota_max_objects_unlimited"
    ].some((name) => {
      return userForm[name].$dirty;
    });
  }

  /**
   * Check if the bucket quota has been modified.
   * @param userForm The HTML formular.
   * @return Returns TRUE if the bucket quota has been modified.
   * @private
   */
  _isBucketQuotaDirty (userForm) {
    return [
      "bucket_quota_enabled",
      "bucket_quota_max_size",
      "bucket_quota_max_size_unlimited",
      "bucket_quota_max_objects",
      "bucket_quota_max_objects_unlimited"
    ].some((name) => {
      return userForm[name].$dirty;
    });
  }

  /**
   * Helper function to get the arguments for the PUT request when the user
   * quota configuration has been modified.
   * @private
   */
  _getUserQuotaPutArgs () {
    let args = {
      "uid": this.user.user_id,
      "quota-type": "user",
      "enabled": this.user.user_quota.enabled
    };
    if (this.user.user_quota.max_size_unlimited) {
      args["max-size-kb"] = -1;
    } else {
      // Convert the given value to bytes.
      const bytes = this.$filter("toBytes")(this.user.user_quota.max_size);
      // Finally convert the value to KiB.
      args["max-size-kb"] = this.$filter("bytes")(bytes, {
        "outPrecision": 0,
        "outUnit": "KiB",
        "appendUnit": false
      });
    }
    if (this.user.user_quota.max_objects_unlimited) {
      args["max-objects"] = -1;
    } else {
      args["max-objects"] = this.user.user_quota.max_objects;
    }
    return args;
  }

  /**
   * Helper function to get the arguments for the PUT request when the bucket
   * quota configuration has been modified.
   * @private
   */
  _getBucketQuotaPutArgs () {
    let args = {
      "uid": this.user.user_id,
      "quota-type": "bucket",
      "enabled": this.user.bucket_quota.enabled
    };
    if (this.user.bucket_quota.max_size_unlimited) {
      args["max-size-kb"] = -1;
    } else {
      // Convert the given value to bytes.
      const bytes = this.$filter("toBytes")(this.user.bucket_quota.max_size);
      // Finally convert the value to KiB.
      args["max-size-kb"] = this.$filter("bytes")(bytes, {
        "outPrecision": 0,
        "outUnit": "KiB",
        "appendUnit": false
      });
    }
    if (this.user.bucket_quota.max_objects_unlimited) {
      args["max-objects"] = -1;
    } else {
      args["max-objects"] = this.user.bucket_quota.max_objects;
    }
    return args;
  }

  /**
   * Helper function to get the arguments for the request e.g. add, modify or
   * delete subusers, keys and capabilites.
   * @param type The request type, e.g. subuser, s3key, swiftkey or caps.
   * @param action The request action, e.g. add, modify or delete.
   * @param data The request data.
   * @private
   */
  _getTypeArgs (type, action, data) {
    let mapPermission = {
      "full-control": "full",
      "read-write": "readwrite"
    };
    let args = {
      "type": type,
      "uid": this.user.user_id
    };
    switch (action) {
      case "add":
        switch (type) {
          case "subuser":
            _.extend(args, {
              "subuser": data.subuser,
              "access": (data.permissions in mapPermission) ?
                mapPermission[data.permissions] :
                data.permissions,
              "key-type": "swift"
            });
            if (!data.generate_secret) {
              _.extend(args, {
                "secret-key": data.secret_key
              });
            } else {
              _.extend(args, {
                "generate-secret": true
              });
            }
            break;
          case "s3key":
            _.extend(args, {
              "type": "key",
              "key-type": "s3",
              "generate-key": Boolean(data.generate_key)
            });
            if (this.cephRgwHelpersService.isSubuser(this.user, data.user)) {
              _.extend(args, {
                "subuser": data.user
              });
            }
            if (!data.generate_key) {
              _.extend(args, {
                "access-key": data.access_key,
                "secret-key": data.secret_key
              });
            }
            break;
          case "swiftkey":
            /* A key is automatically created with a subuser. It is not possible to
             * apply multiple Swift keys per user.
            _.extend(args, {
              "type": "key",
              "subuser": data.user,
              "key-type": "swift",
              "generate-key": Boolean(data.generate_key)
            });
            if (!data.generate_key) {
              _.extend(args, {
                "secret-key": data.secret_key
              });
            }
            */
            break;
          case "caps":
            _.extend(args, {
              "user-caps": data.type + "=" + data.perm
            });
            break;
        }
        break;
      case "modify":
        switch (type) {
          case "subuser":
            _.extend(args, {
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
            _.extend(args, {
              "subuser": data.id,
              "purge-keys": true
            });
            break;
          case "s3key":
            _.extend(args, {
              "type": "key",
              "key-type": "s3",
              "access-key": data.access_key
            });
            break;
          case "swiftkey":
            /* A Swift key is purged when the subuser is deleted.
            _.extend(args, {
              "type": "key",
              "key-type": "swift",
              "subuser": data.user
            });
            */
            break;
          case "caps":
            _.extend(args, {
              "user-caps": data.type + "=" + data.perm
            });
            break;
        }
        break;
    }
    return args;
  }

  /**
   * Get the deferred promise that will be executed when the 'Submit' button is
   * pressed. This should be done when a subuser, capability or key is created,
   * modified or deleted.
   * @param type The request type, e.g. subuser, s3key, swiftkey or caps.
   * @param action The request action, e.g. add, modify or delete.
   * @param data The request data.
   * @private
   */
  _getPromiseByType (type, action, data) {
    let promise;
    let args = this._getTypeArgs(type, action, data);
    switch (action) {
      case "add":
        promise = this.cephRgwUserService.putType(args, undefined).$promise;
        break;
      case "modify":
        promise = this.cephRgwUserService.postType(args, undefined).$promise;
        break;
      case "delete":
        promise = this.cephRgwUserService.deleteType(args, undefined).$promise;
        break;
    }
    return promise;
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

  addEditSubuser (index) {
    let modalInstance = this._showModalDialog("subuser", index);
    modalInstance.result.then((result) => {
      this._addRequest(this._getPromiseByType, ["subuser", result.action, result.data]);
      var subuser = {
        "id": this.cephRgwHelpersService.buildSubuserId(this.user.user_id, result.data.subuser),
        "permissions": result.data.permissions
      };
      switch (result.action) {
        case "add":
          this.user.subusers.push(subuser);
          // Additionally a Swift key will be added.
          this.user.swift_keys.push({
            "user": subuser.id,
            "secret_key": result.data.generate_secret ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
        case "modify":
          this.user.subusers[index] = subuser;
          break;
      }
      this._markFormAsDirty();
    });
  }

  removeSubuser (index) {
    let subuser = this.user.subusers[index];
    this._addRequest(this._getPromiseByType, ["subuser", "delete", subuser]);
    // Remove the associated S3 keys.
    this.user.keys = this.user.keys.filter((key) => {
      return key.user !== subuser.id;
    });
    // Remove the associated Swift keys.
    this.user.swift_keys = this.user.swift_keys.filter((key) => {
      return key.user !== subuser.id;
    });
    // Finally remove the subuser itself.
    this.user.subusers.splice(index, 1);
    this._markFormAsDirty();
  }

  addViewS3Key (index) {
    let modalInstance = this._showModalDialog("s3key", index);
    modalInstance.result.then((result) => {
      this._addRequest(this._getPromiseByType, ["s3key", result.action, result.data]);
      switch (result.action) {
        case "add":
          this.user.keys.push({
            "user": result.data.user,
            "access_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.access_key,
            "secret_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
      }
      this._markFormAsDirty();
    });
  }

  removeS3Key (index) {
    this._addRequest(this._getPromiseByType, ["s3key", "delete", this.user.keys[index]]);
    this.user.keys.splice(index, 1);
    this._markFormAsDirty();
  }

  addViewSwiftKey (index) {
    let modalInstance = this._showModalDialog("swiftkey", index);
    modalInstance.result.then((result) => {
      this._addRequest(this._getPromiseByType, ["swiftkey", result.action, result.data]);
      switch (result.action) {
        case "add":
          this.user.swift_keys.push({
            "user": result.data.user,
            "secret_key": result.data.generate_key ?
              "Apply your changes first..." : result.data.secret_key
          });
          break;
      }
      this._markFormAsDirty();
    });
  }

  /* A Swift key is purged when the subuser is deleted.
  removeSwiftKey (index) {
    this._addRequest(this._getPromiseByType, ["swiftkey", "delete", this.user.swift_keys[index]]);
    this.user.swift_keys.splice(index, 1);
    this._markFormAsDirty();
  }
  */

  addEditCapability (index) {
    let modalInstance = this._showModalDialog("capability", index);
    modalInstance.result.then((result) => {
      switch (result.action) {
        case "add":
          this._addRequest(this._getPromiseByType, ["caps", result.action, result.data]);
          this.user.caps.push(_.cloneDeep(result.data));
          break;
        case "modify":
          // Note, the RadosGW Admin OPS API does not support the modification of
          // user capabilities. Because of that it is necessary to delete it and
          // then to re-add the capability with its new value/permission.
          this._addRequest(this._getPromiseByType, ["caps", "delete", this.user.caps[index]]);
          this._addRequest(this._getPromiseByType, ["caps", "add", result.data]);
          this.user.caps[index] = _.cloneDeep(result.data);
          break;
      }
      this._markFormAsDirty();
    });
  }

  removeCapability (index) {
    this._addRequest(this._getPromiseByType, ["caps", "delete", this.user.caps[index]]);
    this.user.caps.splice(index, 1);
    this._markFormAsDirty();
  }
}

export default {
  template: require("./ceph-rgw-user-form.component.html"),
  controller: CephRgwUserForm
};
