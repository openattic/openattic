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

import "../ceph-cluster/ceph-cluster.module";
import cephRbdStripingModal from "./ceph-rbd-striping-modal/ceph-rbd-striping-modal.component";
import cephRbdStripingObjectSet from "./ceph-rbd-striping-modal/ceph-rbd-striping-object-set.component";
import cephRbdDeleteModal from "./ceph-rbd-delete-modal/ceph-rbd-delete-modal.component";
import cephRbdSnapshotDeleteModal from "./ceph-rbd-snapshot-delete-modal/ceph-rbd-snapshot-delete-modal.component";
import cephRbdDetail from "./ceph-rbd-detail/ceph-rbd-detail.component";
import cephRbdSnapshot from "./ceph-rbd-snapshot/ceph-rbd-snapshot.component";
import cephRbdSnapshotList from "./ceph-rbd-snapshot-list/ceph-rbd-snapshot-list.component";
import cephRbdForm from "./ceph-rbd-form/ceph-rbd-form.component";
import cephRbdList from "./ceph-rbd-list/ceph-rbd-list.component";
import cephRbdStatistics from "./ceph-rbd-statistics/ceph-rbd-statistics.component";
import cephRbdRoutes from "./ceph-rbd.routes";
import CephRbdService from "./shared/ceph-rbd.service";
import CephRbdSnapshotService from "./shared/ceph-rbd-snapshot.service";
import cephRbdFeatures from "./shared/ceph-rbd-features.constant";
import cephRbdSnapshotValidationErrors from "./shared/ceph-rbd-snapshot-validation-errors.constant";
import cephRbdSnapshotCreateModal from "./ceph-rbd-snapshot-create-modal/ceph-rbd-snapshot-create-modal.component";
import cephRbdSnapshotErrorModal from "./ceph-rbd-snapshot-error-modal/ceph-rbd-snapshot-error-modal.component";
import cephRbdSnapshotRollbackModal
  from "./ceph-rbd-snapshot-rollback-modal/ceph-rbd-snapshot-rollback-modal.component";

angular.module("openattic.cephRbd", [
  "openattic.cephCluster"
])
  .component("cephRbdStripingModal", cephRbdStripingModal)
  .component("cephRbdStripingObjectSet", cephRbdStripingObjectSet)
  .component("cephRbdDeleteModal", cephRbdDeleteModal)
  .component("cephRbdDetail", cephRbdDetail)
  .component("cephRbdSnapshot", cephRbdSnapshot)
  .component("cephRbdSnapshotList", cephRbdSnapshotList)
  .component("cephRbdForm", cephRbdForm)
  .component("cephRbdList", cephRbdList)
  .component("cephRbdStatistics", cephRbdStatistics)
  .component("cephRbdSnapshotCreateModal", cephRbdSnapshotCreateModal)
  .component("cephRbdSnapshotErrorModal", cephRbdSnapshotErrorModal)
  .component("cephRbdSnapshotDeleteModal", cephRbdSnapshotDeleteModal)
  .component("cephRbdSnapshotRollbackModal", cephRbdSnapshotRollbackModal)
  .service("cephRbdService", CephRbdService)
  .service("cephRbdSnapshotService", CephRbdSnapshotService)
  .constant("cephRbdFeatures", cephRbdFeatures)
  .constant("cephRbdSnapshotValidationErrors", cephRbdSnapshotValidationErrors)
  .config(cephRbdRoutes);
