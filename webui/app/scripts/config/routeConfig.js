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

angular.module("openattic").config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise("/dashboard");

  $stateProvider
    .state("login", {
      url: "/login",
      views: {
        "main": {
          templateUrl: "templates/login.html",
          controller : "authController"
        }
      }
    })
    .state("disks", {
      url: "/disks",
      views: {
        "main": {
          templateUrl: "templates/disks.html",
          controller : "DiskCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Disks"
      }
    })
    .state("disks.detail", {
      url: "/:disk",
      views: {
        "tab": {templateUrl: "templates/disks/tab.html"}
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("disks.detail.status", {
      url: "/status",
      views: {
        "tab-content": {templateUrl: "templates/disks/status.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Status"
      }
    })
    .state("pools", {
      url: "/pools",
      views: {
        "main": {
          templateUrl: "templates/pools.html",
          controller : "PoolCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Pools"
      }
    })
    .state("pools-add", {
      url: "/pools/add/:diskId",
      views: {
        "main": {
          templateUrl: "templates/pools/pool-form.html",
          controller : "PoolFormCtrl"
        }
      },
      ncyBreadcrumb: {
        parent: "pools",
        label: "Add"
      }
    })
    .state("pools.detail", {
      url: "/:pool",
      views: {
        "tab": {templateUrl: "templates/pools/tab.html"}
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("pools.detail.status", {
      url: "/status",
      views: {
        "tab-content": {templateUrl: "templates/pools/status.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Status"
      }
    })
    .state("pools.detail.storage", {
      url: "/storage",
      views: {
        "tab-content": {
          templateUrl: "templates/pools/storage.html",
          controller : "PoolStorageCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Storage"
      }
    })
    .state("pools.detail.cephpool", {
      url: "/cephpool",
      views: {
        "tab-content": {templateUrl: "templates/pools/cephpool.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Cephpool"
      }
    })
    .state("volumes", {
      url: "/volumes",
      views: {
        "main": {
          templateUrl: "templates/volumes.html",
          controller : "VolumeCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Volumes"
      }
    })
    .state("volumes-add", {
      url: "/volumes/add",
      views: {
        "main": {
          templateUrl: "templates/volumes/volume-form.html",
          controller : "VolumeFormCtrl"
        }
      },
      ncyBreadcrumb: {
        parent: "volumes",
        label: "Add"
      }
    })
    .state("volumes.detail", {
      url: "/:volume",
      views: {
        "tab": {templateUrl: "templates/volumes/tab.html"}
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("volumes.detail.status", {
      url: "/status",
      views: {
        "tab-content": {templateUrl: "templates/volumes/status.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Status"
      }
    })
    .state("volumes.detail.statistics", {
      url: "/statistics",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/statistics.html",
          controller : "VolumeStatisticsCtrl"
        }
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("volumes.detail.statistics.utilgraphs", {
      url: "/util",
      views: {
        "statistics-content": {templateUrl: "templates/volumes/statistics-utilgraphs.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Utilization"
      }
    })
    .state("volumes.detail.statistics.perfgraphs", {
      url: "/perf",
      views: {
        "statistics-content": {templateUrl: "templates/volumes/statistics-perfgraphs.html"}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Performance"
      }
    })
    .state("volumes.detail.cifs", {
      url: "/cifs",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/cifs.html",
          controller : "VolumeCifsSharesCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} CIFS"
      }
    })
    .state("volumes.detail.cifs-add", {
      url: "/cifs/add",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/cifs-form.html",
          controller : "VolumeCifsSharesFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "volumes.detail.cifs"
      }
    })
    .state("volumes.detail.cifs-edit", {
      url: "/cifs/edit/:share",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/cifs-form.html",
          controller : "VolumeCifsSharesFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Edit",
        parent: "volumes.detail.cifs"
      }
    })
    .state("volumes.detail.nfs", {
      url: "/nfs",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/nfs.html",
          controller : "VolumeNfsSharesCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} NFS"
      }
    })
    .state("volumes.detail.nfs-add", {
      url: "/nfs/add",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/nfs-form.html",
          controller : "VolumeNfsSharesFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "volumes.detail.nfs"
      }
    })
    .state("volumes.detail.luns", {
      url: "/luns",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/luns.html",
          controller : "VolumeLunCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} LUNs"
      }
    })
    .state("volumes.detail.luns-add", {
      url: "/luns/add",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/lun-form.html",
          controller : "VolumeLunFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "volumes.detail.luns"
      }
    })
    .state("volumes.detail.http", {
      url: "/http",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/http.html",
          controller : "VolumeHttpSharesCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} HTTP"
      }
    })
    .state("volumes.detail.http-add", {
      url: "/http/add",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/http-form.html",
          controller : "VolumeHttpSharesFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "volumes.detail.http"
      }
    })
    .state("volumes.detail.storage", {
      url: "/storage",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/storage.html",
          controller : "VolumeStorageCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Storage"
      }
    })
    .state("volumes.detail.snapshots", {
      url: "/snapshots",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/snapshots.html",
          controller : "VolumeSnapshotsCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} Snapshots"
      }
    })
    .state("volumes.detail.snapshots-add", {
      url: "/snapshots/add",
      views: {
        "tab-content": {
          templateUrl: "templates/volumes/snapshot-form.html",
          controller : "VolumeSnapshotFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "volumes.detail.snapshots"
      }
    })
    .state("users", {
      url: "/users",
      views: {
        "main": {
          templateUrl: "templates/users.html",
          controller : "UserCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Users"
      }
    })
    .state("users-add", {
      url: "/users/add",
      views: {
        "main": {
          templateUrl: "templates/users/user-form.html",
          controller : "UserFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Add",
        parent: "users"
      }
    })
    .state("users-edit", {
      url: "/users/edit/:user",
      views: {
        "main": {
          templateUrl: "templates/users/user-form.html",
          controller : "UserFormCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Edit {{user.username}}",
        parent: "users"
      }
    })
    .state("apikeys", {
      url: "/apikeys",
      views: {
        "main": {
          templateUrl: "templates/apikeys.html"
        }
      },
      ncyBreadcrumb: {
        label: "Apikeys"
      }
    })
    .state("cmdlogs", {
      url: "/cmdlogs",
      views: {
        "main": {
          templateUrl: "templates/cmdlogs.html",
          controller : "CmdlogCtrl"
        }
      },
      ncyBreadcrumb: {
        label: "Command logs"
      }
    })
    .state("crushmap", {
      url: "/ceph/crushmap",
      views: {
        "main": {
          templateUrl: "templates/crushmap.html"
        }
      },
      ncyBreadcrumb: {
        label: "CRUSH Map Editor"
      }
    });
});
