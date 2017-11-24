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

export default class CephRgwBucketService {
  constructor ($resource, $injector, $q, oaApiFilter) {
    let res = $resource(globalConfig.API.URL + "rgw/bucket", {}, {
      create: {
        url: globalConfig.API.URL + "ceph_radosgw/bucket/create",
        method: "PUT"
      },
      get: {
        url: globalConfig.API.URL + "ceph_radosgw/bucket/get",
        method: "GET"
      },
      put: {
        method: "PUT"
      },
      delete: {
        url: globalConfig.API.URL + "ceph_radosgw/bucket/delete",
        method: "DELETE"
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
      filter: {
        url: globalConfig.API.URL + "rgw/bucket",
        method: "GET",
        isArray: true,
        interceptor: {
          response: (response) => {
            let filterParams = _.cloneDeep(response.config.params);
            let count = undefined;
            let bucketNames = response.data;

            // Pre-filter if sort field is 'bucket', thus it is not necessary to request the
            // whole bucket information for buckets that we are not interested in.
            if (filterParams.sortfield === "bucket") {
              // Apply the filters. Note, set 'sortfield' to empty because we are processing
              // an array of strings.
              let result = oaApiFilter.filter(bucketNames, _.merge({}, filterParams,
                {sortfield: ""}));
              count = result.count;
              bucketNames = result.results;

              // Modify filter parameters to do not apply them twice.
              filterParams.search = "";
              filterParams.entries = 0;
            }

            // Get more bucket information.
            let requests = [];
            let me = $injector.get("cephRgwBucketService");
            _.forEach(bucketNames, (bucketName) => {
              let deferred = $q.defer();
              me.get({"bucket": bucketName}, undefined, deferred.resolve, deferred.reject);
              requests.push(deferred.promise);
            });
            return $q.all(requests).then((buckets) => {
              // Apply the filters.
              let result = oaApiFilter.filter(buckets, filterParams);

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
