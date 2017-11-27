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

export default () => {
  return {
    require: "ngModel",
    link: (scope, elem, attrs, ctrl) => {
      const IQN_REGEX = /^iqn\.(19|20)\d\d-(0[1-9]|1[0-2])\.\D{2,3}(\.[A-Za-z0-9-]+)+(:[A-Za-z0-9-\.]+)*$/;
      ctrl.$validators.iqn = (modelValue, viewValue) => {
        if (ctrl.$isEmpty(modelValue)) {
          return true;
        }
        return IQN_REGEX.test(viewValue);
      };
    }
  };
};
