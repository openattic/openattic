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

import cephNodesScrubModal from "./ceph-nodes-scrub-modal/ceph-nodes-scrub-modal.component";
import cephNodesDetail from "./ceph-nodes-detail/ceph-nodes-detail.component";
import cephNodesStatistics from "./ceph-nodes-statistics/ceph-nodes-statistics.component";
import cephNodesList from "./ceph-nodes-list/ceph-nodes-list.component";
import CephNodesService from "./shared/ceph-nodes.service";
import cephNodesRoute from "./ceph-nodes.route";

angular
  .module("openattic.cephNodes", [])
  .component("cephNodesScrubModal", cephNodesScrubModal)
  .component("cephNodesDetail", cephNodesDetail)
  .component("cephNodesStatistics", cephNodesStatistics)
  .component("cephNodesList", cephNodesList)
  .service("cephNodesService", CephNodesService)
  .config(cephNodesRoute);

