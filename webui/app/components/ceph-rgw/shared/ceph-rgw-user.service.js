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
import _ from "lodash";

export default class CephRgwUserService {
  constructor ($resource, $injector, $q, oaApiFilter) {
    let res = $resource(globalConfig.API.URL + "rgw/user", {}, {
      delete: {
        url: globalConfig.API.URL + "ceph_radosgw/user/delete",
        method: "DELETE"
      },
      getQuota: {
        method: "GET",
        url: globalConfig.API.URL + "rgw/user?quota",
        transformResponse: (data) => {
          let result = JSON.parse(data);
          // !!! Attention !!!
          // The returned object contains other attributes depending on the ceph version:
          // 10.2.6: max_size_kb
          // 12.0.3: max_size
          if (_.isObjectLike(result.user_quota)) {
            if ((result.user_quota.max_size_kb === -1) || (result.user_quota.max_size <= -1)) {
              result.user_quota.max_size = "";
              result.user_quota.max_size_unlimited = true;
            } else {
              result.user_quota.max_size = result.user_quota.max_size_kb + "K";
              result.user_quota.max_size_unlimited = false;
            }
            if (result.user_quota.max_objects === -1) {
              result.user_quota.max_objects = "";
              result.user_quota.max_objects_unlimited = true;
            } else {
              result.user_quota.max_objects_unlimited = false;
            }
          }
          if (_.isObjectLike(result.bucket_quota)) {
            if ((result.bucket_quota.max_size_kb === -1) || (result.bucket_quota.max_size <= -1)) {
              result.bucket_quota.max_size = "";
              result.bucket_quota.max_size_unlimited = true;
            } else {
              result.bucket_quota.max_size = result.bucket_quota.max_size_kb + "K";
              result.bucket_quota.max_size_unlimited = false;
            }
            if (result.bucket_quota.max_objects === -1) {
              result.bucket_quota.max_objects = "";
              result.bucket_quota.max_objects_unlimited = true;
            } else {
              result.bucket_quota.max_objects_unlimited = false;
            }
          }
          return result;
        }
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
        transformResponse: (data, headersGetter, status) => {
          // Make sure we have received valid data.
          if (!_.isString(data)) {
            return [];
          }
          data = JSON.parse(data);
          if (status !== 200) {
            return data;
          }
          // Return an array to be able to support wildcard searching someday.
          return [data];
        }
      },
      enumerate: {
        method: "GET",
        url: globalConfig.API.URL + "rgw/metadata/user",
        isArray: true
      },
      filter: {
        url: globalConfig.API.URL + "rgw/metadata/user",
        method: "GET",
        isArray: true,
        interceptor: {
          response: (response) => {
            let filterParams = _.cloneDeep(response.config.params);
            let count = undefined;
            let userIds = response.data;

            // Pre-filter if sort field is 'user_id', thus it is not necessary to request the
            // whole user information for users that we are not interested in.
            if (filterParams.sortfield === "user_id") {
              // Apply the filters. Note, set 'sortfield' to empty because we are processing
              // an array of strings.
              let result = oaApiFilter.filter(userIds, _.merge({}, filterParams,
                {sortfield: ""}));
              count = result.count;
              userIds = result.results;

              // Modify filter parameters to do not apply them twice.
              filterParams.search = "";
              filterParams.entries = 0;
            }

            // Get more user data per UID.
            let requests = [];
            let me = $injector.get("cephRgwUserService");
            _.forEach(userIds, (userId) => {
              let deferred = $q.defer();
              me.get({"uid": userId}, undefined, deferred.resolve, deferred.reject);
              requests.push(deferred.promise);
            });
            return $q.all(requests).then((users) => {
              // Apply the filter.
              let result = oaApiFilter.filter(users, filterParams);

              // Prepare the response object.
              return {
                $resolved: true,
                count: count || result.count,
                next: undefined,
                previous: undefined,
                results: result.results
              };
            });
          }
        }
      }
    });

    Object.assign(this, res);
  }
}
