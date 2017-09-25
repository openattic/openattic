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

import globalConfig from "globalConfig";

var app = angular.module("openattic.cephRgw");
app.factory("cephRgwBucketService", function ($resource, $injector, $q, $filter) {
  return $resource(globalConfig.API.URL + "rgw/bucket", {
  }, {
    create: {
      url: globalConfig.API.URL + "ceph_radosgw/bucket/create",
      method: "PUT"
    },
    put: {
      method: "PUT"
    },
    query: {
      method: "GET",
      isArray: true,
      transformResponse: function (data, headersGetter, status) {
        // Make sure we have received valid data.
        if (!angular.isString(data)) {
          return [];
        }
        data = angular.fromJson(data);
        if (status !== 200) {
          return data;
        }
        // Return an array to be able to support wildcard searching someday.
        return [ data ];
      }
    },
    filter: {
      url: globalConfig.API.URL + "rgw/bucket",
      method: "GET",
      isArray: true,
      interceptor: {
        response: function (response) {
          // Get the filter parameters.
          var filterParams = angular.copy(response.config.params);
          var matches = filterParams.ordering.match(/(-?)(.+)/);
          filterParams.sortorder = (matches[1] === "") ? "ASC" : "DESC";
          filterParams.sortfield = matches[2];
          // Get more bucket information.
          var requests = [];
          var me = $injector.get("cephRgwBucketService");
          angular.forEach(response.data, function (bucket) {
            var deferred = $q.defer();
            me.get({"bucket": bucket}, undefined, deferred.resolve, deferred.reject);
            requests.push(deferred.promise);
          });
          return $q.all(requests).then(function (buckets) {
            // Apply the filter.
            if (filterParams.search) {
              var expression = {};
              expression[filterParams.sortfield] = filterParams.search;
              buckets = $filter("filter")(buckets, expression);
            }
            buckets = $filter("orderBy")(buckets, filterParams.sortfield,
              filterParams.sortorder === "DESC");
            buckets = $filter("limitTo")(buckets, filterParams.pageSize,
              (filterParams.page - 1) * filterParams.pageSize);
            // Prepare the response object.
            return {
              $resolved: true,
              count: buckets.length,
              next: undefined,
              previous: undefined,
              results: buckets
            };
          });
        }
      }
    }
  });
});
