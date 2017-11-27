/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

export default class CephPoolsService {
  constructor ($resource) {
    const res = $resource(globalConfig.API.URL + "ceph/:fsid/pools/:id", {
      fsid: "@fsid",
      id: "@id"
    }, {
      update: {
        method: "PUT"
      },
      delete: {
        method: "DELETE"
      },
      performancedata: {
        method: "GET",
        url: globalConfig.API.URL + "ceph/:fsid/performancedata_pools"
      },
      query: {
        method: "GET",
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        }
      }
    });

    Object.assign(this, res);
  }
}
