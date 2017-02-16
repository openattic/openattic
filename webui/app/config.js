var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
    "activeModules"   : {
      "btrfs"      : true,
      "ceph"       : false,
      "cron"       : true,
      "drbd"       : true,
      "http"       : true,
      "lvm"        : true,
      "mailaliases": true,
      "nagios"     : true,
      "nfs"        : true,
      "samba"      : true,
      "zfs"        : true
    },
    "defaultToastTimes": {
      "success": 3000,
      "warning": 6000,
      "error": 9000
    },
    "defaultTaskReloadTime": 5000,
    "defaultDashboard": {
      "boards"  : [{
        "name"   : "Default",
        "widgets": [{
          "name"    : "openATTIC cluster status",
          "manager" : {
            "name"   : "openATTIC cluster status",
            "manager": "openattic-cluster-status",
            "group"  : "Local storage"
          },
          "settings": {},
          "minSizeX": 3,
          "minSizeY": 3
        }, {
          "name"    : "openATTIC wizards",
          "manager" : {
            "name"   : "openATTIC wizards",
            "manager": "openattic-wizards",
            "group"  : "Local storage"
          },
          "settings": {},
          "minSizeX": 3,
          "minSizeY": 3
        }]
      }, {
        "name"   : "Ceph",
        "widgets": [{
          "name"    : "Ceph Status",
          "manager" : {
            "name"   : "Ceph Cluster Status",
            "manager": "ceph-cluster-status",
            "group"  : "ceph"
          },
          "settings": {}
        }]
      }],
      "settings": {
        "activeBoard": 0,
        "locked"     : false
      }
    },
    "quickLogin"      : {
      "username": "",
      "password": ""
    }
  }
};