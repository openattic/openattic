var globalConfig = {
  "API": {
    "URL": "/openattic/api/"
  },
  "GUI": {
    "uiTimeout": 60000,
    "defaultNotificationTimes": {
      "error": 7000,
      "info": 5000,
      "success": 3000,
      "wait": 4000,
      "warning": 6000
    },
    "defaultTaskReloadTime": 5000,
    "defaultDashboard": {
      "boards": [{
        "name": "Ceph",
        "widgets": [{
          "name": "Ceph Health",
          "manager": {
            "name": "Ceph Health",
            "manager": "ceph-health",
            "group": "Ceph"
          },
          "settings": {}
        }]
      }, {
        "name": "Grafana",
        "widgets": []
      }],
      "settings": {
        "activeBoard": 1,
        "locked": false
      }
    },
    "quickLogin": {
      "username": "",
      "password": ""
    }
  }
};

export default globalConfig;
