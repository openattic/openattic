/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2018 SUSE LLC
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

export default class CephRbdSnapshotService {
  constructor ($resource) {
    const resource = $resource(globalConfig.API.URL + "ceph/:fsid/rbdsnaps", {
      fsid: "@fsid",
      pool: "@pool",
      image: "@image",
      imagename: "@imagename",
      name: "@name",
      snap: "@snap"
    }, {
      list: {
        method: "GET",
        url: globalConfig.API.URL + "ceph/:fsid/rbdsnaps?image__id=:pool/:imagename"
      },
      create: {
        method: "POST",
        url: globalConfig.API.URL + "ceph/:fsid/rbdsnaps"
      },
      update: {
        method: "PUT",
        url: globalConfig.API.URL + "ceph/:fsid/rbdsnaps/:pool/:imagename@:snap"
      },
      delete: {
        method: "DELETE",
        url: globalConfig.API.URL + "ceph/:fsid/rbdsnaps/:pool/:imagename@:snap"
      },
      rollback: {
        method: "POST",
        url: globalConfig.API.URL + "ceph/:fsid/rbdsnaps/:pool/:imagename@:snap/rollback"
      }
    });

    Object.assign(this, resource);
  }
}
