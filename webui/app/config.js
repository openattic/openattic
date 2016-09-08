var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
    "activeModules"   : {
      "apt"        : true,
      "btrfs"      : true,
      "ceph"       : false,
      "cron"       : true,
      "drbd"       : true,
      "http"       : true,
      "ipmi"       : true,
      "lvm"        : true,
      "mailaliases": true,
      "mdraid"     : true,
      "nagios"     : true,
      "nfs"        : true,
      "samba"      : true,
      "twraid"     : true,
      "zfs"        : true
    },
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
          "minSizeY": 2
        }, {
          "name"    : "openATTIC wizards",
          "manager" : {
            "name"   : "openATTIC wizards",
            "manager": "openattic-wizards",
            "group"  : "Local storage"
          },
          "settings": {},
          "minSizeX": 2,
          "minSizeY": 2
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