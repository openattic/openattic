var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
    "uiTimeout": 30000,
    "defaultNotificationTimes": {
      "error": 7000,
      "info": 5000,
      "success": 3000,
      "wait": 4000,
      "warning": 6000
    },
    "defaultTaskReloadTime": 5000,
    "defaultDashboard": {
      "boards"  : [{
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
