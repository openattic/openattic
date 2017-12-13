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

/**
 * @description
 * Returns a string with a language sensitive representation of the
 * given date.
 *
 * In HTML Template Binding
 * {{ date_expression | localeDate }}
 * In JavaScript
 * $filter('localeDate')(date)
 *
 * @param {string|number} value The value representing a date. This can be a
 *   string, e.g. '2016-11-18T10:16:07.730' or a UNIX time stamp.
 * @returns {string} Formatted string or the input if input is not recognized
 *   as date.
 */
export default () => {
  return (value) => {
    let dt;
    if (_.isNumber(value)) {
      // If value is a number, then assume it is an UNIX time stamp and
      // convert it into milliseconds.
      dt = new Date(value * 1000);
    } else {
      dt = new Date(value);
    }
    // Return the given value if the date object is invalid.
    if (isNaN(dt.getTime())) {
      return value;
    }
    return dt.toLocaleString();
  };
};
