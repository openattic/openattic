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

import cephRgwRoutes from "./ceph-rgw.routes";
import cephRgwBucketForm from "./ceph-rgw-bucket-form/ceph-rgw-bucket-form.component";
import cephRgwBucketDeleteModal from "./ceph-rgw-bucket-delete-modal/ceph-rgw-bucket-delete-modal.component";
import cephRgwBucketDetail from "./ceph-rgw-bucket-detail/ceph-rgw-bucket-detail.component";
import cephRgwBucketList from "./ceph-rgw-bucket-list/ceph-rgw-bucket-list.component";
import cephRgwUserForm from "./ceph-rgw-user-form/ceph-rgw-user-form.component";
import cephRgwUserFormCapabilityModal from "./ceph-rgw-user-form/ceph-rgw-user-form-capability-modal.component";
import cephRgwUserFormS3KeyModal from "./ceph-rgw-user-form/ceph-rgw-user-form-s3key-modal.component";
import cephRgwUserFormSubuserModal from "./ceph-rgw-user-form/ceph-rgw-user-form-subuser-modal.component";
import cephRgwUserFormSwiftKeyModal from "./ceph-rgw-user-form/ceph-rgw-user-form-swiftkey-modal.component";
import cephRgwUserDeleteModal from "./ceph-rgw-user-delete-modal/ceph-rgw-user-delete-modal.component";
import cephRgwUserDetail from "./ceph-rgw-user-detail/ceph-rgw-user-detail.component";
import cephRgwUserList from "./ceph-rgw-user-list/ceph-rgw-user-list.component";
import cephRgwUserStatistics from "./ceph-rgw-user-statistics/ceph-rgw-user-statistics.component";
import cephRgwBucketService from "./shared/ceph-rgw-bucket.service";
import cephRgwBucketNameUnique from "./shared/ceph-rgw-bucket-name-unique.directive";
import cephRgwBucketNameValidate from "./shared/ceph-rgw-bucket-name-validate.directive";
import cephRgwHelpersService from "./shared/ceph-rgw-helpers.service";
import cephRgwQuotaMaxSizeValidate from "./shared/ceph-rgw-quota-max-size-validate.directive";
import cephRgwUserService from "./shared/ceph-rgw-user.service";
import cephRgwUserIdUnique from "./shared/ceph-rgw-user-id-unique.directive";

angular
  .module("openattic.cephRgw", [])
  .config(cephRgwRoutes)
  .component("cephRgwBucketForm", cephRgwBucketForm)
  .component("cephRgwBucketDeleteModal", cephRgwBucketDeleteModal)
  .component("cephRgwBucketDetail", cephRgwBucketDetail)
  .component("cephRgwBucketList", cephRgwBucketList)
  .component("cephRgwUserForm", cephRgwUserForm)
  .component("cephRgwUserFormCapabilityModal", cephRgwUserFormCapabilityModal)
  .component("cephRgwUserFormS3KeyModal", cephRgwUserFormS3KeyModal)
  .component("cephRgwUserFormSubuserModal", cephRgwUserFormSubuserModal)
  .component("cephRgwUserFormSwiftKeyModal", cephRgwUserFormSwiftKeyModal)
  .component("cephRgwUserDeleteModal", cephRgwUserDeleteModal)
  .component("cephRgwUserDetail", cephRgwUserDetail)
  .component("cephRgwUserList", cephRgwUserList)
  .component("cephRgwUserStatistics", cephRgwUserStatistics)
  .directive("cephRgwBucketNameUnique", cephRgwBucketNameUnique)
  .directive("cephRgwBucketNameValidate", cephRgwBucketNameValidate)
  .directive("cephRgwQuotaMaxSizeValidate", cephRgwQuotaMaxSizeValidate)
  .directive("cephRgwUserIdUnique", cephRgwUserIdUnique)
  .service("cephRgwBucketService", cephRgwBucketService)
  .service("cephRgwHelpersService", cephRgwHelpersService)
  .service("cephRgwUserService", cephRgwUserService);
