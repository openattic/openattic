var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
    "defaultToastTimes": {
      "success": 3000,
      "warning": 6000,
      "error": 9000
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