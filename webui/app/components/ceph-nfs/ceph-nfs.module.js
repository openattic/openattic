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

import cephNfsDeleteModal from "./ceph-nfs-delete-modal/ceph-nfs-delete-modal.component";
import cephNfsDetail from "./ceph-nfs-detail/ceph-nfs-detail.component";
import cephNfsForm from "./ceph-nfs-form/ceph-nfs-form.component";
import cephNfsFormClient from "./ceph-nfs-form-client/ceph-nfs-form-client.component";
import cephNfsList from "./ceph-nfs-list/ceph-nfs-list.component";
import cephNfsManageServiceModal from "./ceph-nfs-manage-service-modal/ceph-nfs-manage-service-modal.component";
import CephNfsFormService from "./ceph-nfs-form/ceph-nfs-form.service";
import cephNfsStateFilter from "./shared/ceph-nfs-state.filter";
import CephNfsStateService from "./shared/ceph-nfs-state.service";
import CephNfsService from "./shared/ceph-nfs.service";
import cephNfsAccessType from "./shared/ceph-nfs-access-type.value";
import cephNfsFsal from "./shared/ceph-nfs-fsal.value";
import cephNfsSquash from "./shared/ceph-nfs-squash.value";
import cephNfsRoutes from "./ceph-nfs.routes";

angular
  .module("openattic.cephNfs", [])
  .component("cephNfsDeleteModal", cephNfsDeleteModal)
  .component("cephNfsDetail", cephNfsDetail)
  .component("cephNfsForm", cephNfsForm)
  .component("cephNfsFormClient", cephNfsFormClient)
  .component("cephNfsList", cephNfsList)
  .component("cephNfsManageServiceModal", cephNfsManageServiceModal)
  .filter("cephNfsState", cephNfsStateFilter)
  .service("cephNfsFormService", CephNfsFormService)
  .service("cephNfsService", CephNfsService)
  .service("cephNfsStateService", CephNfsStateService)
  .value("cephNfsAccessType", cephNfsAccessType)
  .value("cephNfsFsal", cephNfsFsal)
  .value("cephNfsSquash", cephNfsSquash)
  .config(cephNfsRoutes);
