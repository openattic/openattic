var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
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