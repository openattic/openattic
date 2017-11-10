/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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

import "../components/ceph-crushmap/ceph-crushmap.module";
import "../components/ceph-erasure-code-profiles/ceph-erasure-code-profiles.module";
import "../components/ceph-nodes/ceph-nodes.module";
import "../components/ceph-iscsi/ceph-iscsi.module";
import "../components/ceph-nfs/ceph-nfs.module";
import "../components/ceph-osd/ceph-osd.module";
import "../components/ceph-pools/ceph-pools.module";
import "../components/ceph-rbd/ceph-rbd.module";
import "../components/ceph-rgw/ceph-rgw.module";

angular.module("openattic.ceph", [
  "openattic.cephCrushmap",
  "openattic.cephErasureCodeProfiles",
  "openattic.cephNodes",
  "openattic.cephIscsi",
  "openattic.cephNfs",
  "openattic.cephOsd",
  "openattic.cephPools",
  "openattic.cephRbd",
  "openattic.cephRgw"
]);
