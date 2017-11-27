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

export default ($stateProvider) => {
  $stateProvider
    .state("cephNfs", {
      url: "/ceph/nfs",
      views: {
        "main": {
          component: "cephNfsList"
        }
      },
      ncyBreadcrumb: {
        label: "Ceph NFS"
      }
    })
    .state("cephNfs-add", {
      url: "/ceph/:fsid/nfs/add",
      views: {
        "main": {
          component: "cephNfsForm"
        }
      },
      params: {
        fsid: null
      },
      ncyBreadcrumb: {
        parent: "cephNfs",
        label: "Add"
      }
    })
    .state("cephNfs-edit", {
      url: "/ceph/:fsid/nfs/edit/:host/:exportId",
      views: {
        "main": {
          component: "cephNfsForm"
        }
      },
      ncyBreadcrumb: {
        label: "Edit",
        parent: "cephNfs"
      }
    })
    .state("cephNfs-clone", {
      url: "/ceph/:fsid/nfs/clone/:host/:exportId",
      views: {
        "main": {
          component: "cephNfsForm"
        }
      },
      ncyBreadcrumb: {
        label: "Copy",
        parent: "cephNfs"
      }
    })
    .state("cephNfs.detail", {
      views        : {
        "tab": {
          component: "oaTabSet"
        }
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("cephNfs.detail.details", {
      url: "/details",
      views: {
        "tab-content": {
          component: "cephNfsDetail"
        }
      },
      ncyBreadcrumb: {
        label: "{{$ctrl.selection.item.host}}:{{$ctrl.selection.item.path}} details"
      }
    });
};
