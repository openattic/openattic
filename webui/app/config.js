globalConfig = {
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
        "id"     : 0,
        "name"   : "Default",
        "widgets": []
      }],
      "settings": {
        "activeBoard": 0,
        "locked"     : false,
        "orderBy"    : "name"
      }
    }
  }
};