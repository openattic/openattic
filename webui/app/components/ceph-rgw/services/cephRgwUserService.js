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
app.factory("cephRgwUserService", function ($resource, $injector, $q, $filter) {
  return $resource(globalConfig.API.URL + "rgw/user", {
  }, {
    getQuota: {
      method: "GET",
      url: globalConfig.API.URL + "rgw/user?quota"
    },
    putQuota: {
      method: "PUT",
      url: globalConfig.API.URL + "rgw/user?quota"
    },
    put: {
      method: "PUT"
    },
    putType: {
      method: "PUT",
      params: {
        type: "@type"
      },
      url: globalConfig.API.URL + "rgw/user?:type",
      isArray: true
    },
    post: {
      method: "POST"
    },
    postType: {
      method: "POST",
      params: {
        type: "@type"
      },
      url: globalConfig.API.URL + "rgw/user?:type",
      isArray: true
    },
    deleteType: {
      method: "DELETE",
      params: {
        type: "@type"
      },
      url: globalConfig.API.URL + "rgw/user?:type",
      isArray: true
    },
    query: {
      method: "GET",
      isArray: true,
      transformResponse: function (data) {
        // Make sure we have received valid data.
        if (!angular.isString(data)) {
          return [];
        }
        data = angular.fromJson(data);
        // The Admin Ops API returns a 404 with the 'Code'='NoSuchKey' if the requested
        // user does not exist.
        if (angular.isObject(data) && data.hasOwnProperty("Code") && (data.Code === "NoSuchKey")) {
          return [];
        }
        return [ data ];
      }
    },
    filter: {
      url: globalConfig.API.URL + "rgw/metadata/user",
      method: "GET",
      isArray: true,
      interceptor: {
        response: function (response) {
          // Get the filter parameters.
          var filterParams = angular.copy(response.config.params);
          var matches = filterParams.ordering.match(/(-?)(.+)/);
          filterParams.sortorder = (matches[1] === "") ? "ASC" : "DESC";
          filterParams.sortfield = matches[2];
          // Get more user data per UID.
          var requests = [];
          var me = $injector.get("cephRgwUserService");
          angular.forEach(response.data, function (uid) {
            var deferred = $q.defer();
            me.get({"uid": uid}, undefined, deferred.resolve, deferred.reject);
            requests.push(deferred.promise);
          });
          return $q.all(requests).then(function (users) {
            // Apply the filter.
            if (filterParams.search) {
              var expression = {};
              expression[filterParams.sortfield] = filterParams.search;
              users = $filter("filter")(users, expression);
            }
            users = $filter("orderBy")(users, filterParams.sortfield,
              filterParams.sortorder === "DESC");
            users = $filter("limitTo")(users, filterParams.pageSize,
              (filterParams.page - 1) * filterParams.pageSize);
            // Prepare the response object.
            return {
              count: users.length,
              next: null,
              previous: null,
              results: users
            };
          });
        }
      }
    }
  });
});
