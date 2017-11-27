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

export default class OaApiFilter {
  constructor ($filter) {
    this.$filter = $filter;
  }

  /**
   * Apply the given filter parameters.
   * @param {Array} array The source array.
   * @param {Object} filterParams The filter parameters with the fields:
   *   - search: The predicate to be used for selecting items from array.
   *   - sortfield: The field used for sorting. Can be undefined.
   *   - sortorder: The sort order, can be ASC or DESC.
   *   - page: The number of the requested page.
   *   - entries: The number of elements per page.
   * @return {Object} Returns an object with the fields count and results.
   */
  filter (array, filterParams) {
    let results = _.cloneDeep(array);

    // Selects a subset of items from array.
    if (!_.isEmpty(filterParams.search)) {
      let expression = filterParams.search;
      if (!_.isEmpty(filterParams.sortfield)) {
        expression = {};
        expression[filterParams.sortfield] = filterParams.search;
      }
      results = this.$filter("filter")(results, expression);
    }

    // Order items from array.
    results = this.$filter("orderBy")(results, filterParams.sortfield,
      filterParams.sortorder === "DESC");

    const count = results.length; // Remember total count.

    // Get only a specified number of items from array.
    if (_.isInteger(filterParams.entries) && (filterParams.entries > 0)) {
      results = this.$filter("limitTo")(results, filterParams.entries,
        filterParams.page * filterParams.entries);
    }

    return {
      count: count,
      results: results
    };
  }
}
