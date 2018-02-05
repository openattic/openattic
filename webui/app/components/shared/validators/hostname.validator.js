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
import validator from "validator";

/**
 * Validate a hostname. This can be an IPv4, IPv6 or FQDN.
 */
export default () => {
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
      /**
       * Check if the specified value is a valid hostname.
       * @see https://en.wikipedia.org/wiki/Hostname#Restrictions_on_valid_hostnames
       */
      let isHostName = (value) => {
        // Check the entire hostname length (without trailing dot).
        if (_.trimEnd(value, ".").length > 253) {
          return false;
        }
        // Check the length of the labels. Note, the min. length of the TLD
        // label is 2, but this will be checked by validator.isFQDN() later.
        const labels = value.split(".");
        if (!labels.every((label) => {
          return _.inRange(label.length, 1, 63);
        })) {
          return false;
        }
        return validator.isFQDN(value, {
          require_tld: labels.length > 1,
          allow_underscores: false,
          allow_trailing_dot: false
        });
      };

      ctrl.$validators.hostnameValidator = (modelValue, viewValue) => {
        if (ctrl.$isEmpty(modelValue)) {
          return true;
        }
        if (!_.isString(viewValue)) {
          return false;
        }
        return validator.isIP(viewValue) || isHostName(viewValue);
      };
    }
  };
};
