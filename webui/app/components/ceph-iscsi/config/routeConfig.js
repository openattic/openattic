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

var app = angular.module("openattic.cephIscsi");
app.config(function ($stateProvider) {
  $stateProvider
    .state("cephIscsi", {
      url: "/ceph/iscsi",
      views: {
        "main": {
          templateUrl: "components/ceph-iscsi/templates/listing.html",
          controller: "CephIscsiCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Ceph iSCSI"
      }
    })
    .state("cephIscsi-add", {
      url: "/ceph/:fsid/iscsi/add",
      views: {
        "main": {
          templateUrl: "components/ceph-iscsi/templates/form.html",
          controller : "CephIscsiFormCtrl"
        }
      },
      params: {
        fsid: null
      },
      ncyBreadcrumb: {
        parent: "cephIscsi",
        label: "Add"
      }
    })
    .state("cephIscsi-edit", {
      url: "/ceph/:fsid/iscsi/edit/:targetId",
      views: {
        "main": {
          templateUrl: "components/ceph-iscsi/templates/form.html",
          controller : "CephIscsiFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Edit - {{targetId}}",
        parent: "cephIscsi"
      }
    })
    .state("cephIscsi-clone", {
      url: "/ceph/:fsid/iscsi/clone/:targetId",
      views: {
        "main": {
          templateUrl: "components/ceph-iscsi/templates/form.html",
          controller : "CephIscsiFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Copy {{targetId}}",
        parent: "cephIscsi"
      }
    })
    .state("cephIscsi.detail", {
      views        : {
        "tab": {templateUrl: "components/ceph-iscsi/templates/tab.html"}
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("cephIscsi.detail.details", {
      url: "/details",
      views: {
        "tab-content": {templateUrl: "components/ceph-iscsi/templates/details.html"} },
      ncyBreadcrumb: {
        label: "{{selection.item.targetId}} details"
      }
    });
});
