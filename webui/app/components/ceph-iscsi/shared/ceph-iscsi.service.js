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

export default class CephIscsiService {
  constructor ($resource) {
    let res = $resource(globalConfig.API.URL + "ceph_iscsi/:fsid/iscsitargets/:targetId", {
      fsid: "@fsid",
      targetId: "@targetId"
    }, {
      save: {
        method: "POST",
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsitargets"
      },
      update: {
        method: "PUT"
      },
      bulk_delete: {
        method: "POST",
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsitargets/bulk_delete"
      },
      iscsistatus: {
        method: "GET",
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsistatus"
      },
      iscsideploy: {
        method: "POST",
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsideploy"
      },
      iscsiundeploy: {
        method: "POST",
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsiundeploy"
      },
      interfaces: {
        method: "GET",
        isArray: true,
        transformResponse: function (data) {
          return JSON.parse(data).results;
        },
        url: globalConfig.API.URL + "ceph_iscsi/:fsid/iscsiinterfaces"
      }
    });

    Object.assign(this, res);
  }
}

