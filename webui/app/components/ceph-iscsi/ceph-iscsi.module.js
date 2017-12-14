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

import CephIscsiService from "./shared/ceph-iscsi.service";
import cephIscsiDeleteModal from "./ceph-iscsi-delete-modal/ceph-iscsi-delete-modal.component";
import cephIscsiDetail from "./ceph-iscsi-detail/ceph-iscsi-detail.component";
import cephIscsiForm from "./ceph-iscsi-form/ceph-iscsi-form.component";
import cephIscsiFormImageSettingsModal
  from "./ceph-iscsi-form-image-settings-modal/ceph-iscsi-form-image-settings-modal.component";
import cephIscsiFormTargetSettingsModal
  from "./ceph-iscsi-form-target-settings-modal/ceph-iscsi-form-target-settings-modal.component";
import cephIscsiImageAdvangedSettings from "./shared/ceph-iscsi-image-advanged-settings.value";
import cephIscsiImageOptionalSettings from "./shared/ceph-iscsi-image-optional-settings.value";
import cephIscsiList from "./ceph-iscsi-list/ceph-iscsi-list.component";
import cephIscsiManageServiceModal from "./ceph-iscsi-manage-service-modal/ceph-iscsi-manage-service-modal.component";
import cephIscsiRoutes from "./ceph-iscsi.routes";
import cephIscsiStateFilter from "./shared/ceph-iscsi-state.filter";
import cephIscsiTargetAdvangedSettings from "./shared/ceph-iscsi-target-advanged-settings.value";
import CephIscsiStateService from "./shared/ceph-iscsi-state.service";
import cephIscsiRbdFeaturesValidator from "./shared/ceph-iscsi-rbd-features.validator";
import cephIscsiRbdUnsupportedFeatures from "./shared/ceph-iscsi-rbd-unsupported-features.value";

angular.module("openattic.cephIscsi", [])
  .component("cephIscsiDeleteModal", cephIscsiDeleteModal)
  .component("cephIscsiDetail", cephIscsiDetail)
  .component("cephIscsiForm", cephIscsiForm)
  .component("cephIscsiFormImageSettingsModal", cephIscsiFormImageSettingsModal)
  .component("cephIscsiFormTargetSettingsModal", cephIscsiFormTargetSettingsModal)
  .component("cephIscsiList", cephIscsiList)
  .component("cephIscsiManageServiceModal", cephIscsiManageServiceModal)
  .filter("cephIscsiState", cephIscsiStateFilter)
  .config(cephIscsiRoutes)
  .directive("cephIscsiRbdFeaturesValidator", cephIscsiRbdFeaturesValidator)
  .service("cephIscsiService", CephIscsiService)
  .service("cephIscsiStateService", CephIscsiStateService)
  .value("cephIscsiImageAdvangedSettings", cephIscsiImageAdvangedSettings)
  .value("cephIscsiImageOptionalSettings", cephIscsiImageOptionalSettings)
  .value("cephIscsiTargetAdvangedSettings", cephIscsiTargetAdvangedSettings)
  .value("cephIscsiRbdUnsupportedFeatures", cephIscsiRbdUnsupportedFeatures);
