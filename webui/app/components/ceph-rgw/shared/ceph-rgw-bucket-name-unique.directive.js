/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in scope page.
 *
 * Copyright (c) 2017 SUSE LLC
 *
 *
 * The JavaScript code in scope page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * scope package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include scope license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in scope page.
 *
 */
"use strict";

import _ from "lodash";

/**
 * Validate the bucket name.
 */
export default ($q, cephRgwBucketService) => {
  return {
    // Restrict to an attribute type.
    restrict: "A",
    // Element must have ng-model attribute.
    require: "ngModel",
    // scope = The parent scope
    // elem  = The element the directive is on
    // attrs = A dictionary of attributes on the element
    // ctrl  = The controller for ngModel
    link: (scope, elem, attrs, ctrl) => {
      ctrl.$asyncValidators.cephRgwBucketNameUnique = (modelValue, viewValue) => {
        let value = modelValue || viewValue;
        let deferred = $q.defer();
        if (ctrl.$isEmpty(value) || elem[0].disabled || elem[0].readOnly) {
          // Do not validate the value via remote request if it is empty or the field
          // is disabled/read-only.
          deferred.resolve();
        } else {
          cephRgwBucketService.query({"bucket": value})
            .$promise
            .then((res) => {
              // Does any bucket with the given name exist?
              if (res.length === 0) {
                // No, mark the field as valid.
                deferred.resolve();
              } else {
                // Yes, mark the field as invalid.
                deferred.reject();
              }
            })
            .catch((error) => {
              // Display an error toasty for all errors except whether the bucket does not
              // exist (the Admin Ops API returns a 404 in this case).
              if (_.isObjectLike(error) && (error.status === 404)) {
                error.preventDefault();
              }
              // Mark the field as valid if the remote validation fails.
              deferred.resolve();
            });
        }
        return deferred.promise;
      };
    }
  };
};
