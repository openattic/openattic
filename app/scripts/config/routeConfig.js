'use strict';

angular.module('openattic').config(function ($stateProvider, $urlRouterProvider) {

  $urlRouterProvider.otherwise('/pools');

  $stateProvider
  .state('pools', {
    url: '/pools',
    controller: 'PoolCtrl',
    views: {
      'main': {templateUrl: 'templates/pools.html'}
    }
  })
  .state('pools.detail', {
    url: '/:pool',
    views: {
      'tab': {templateUrl: 'templates/pools/tab.html'}
    }
  })
  .state('pools.detail.status', {
    url: '/status',
    views: {
      'tab-content': {templateUrl: 'templates/pools/status.html'}
    }
  })
  .state('pools.detail.storage', {
    url: '/storage',
    views: {
      'tab-content': {templateUrl: 'templates/pools/storage.html'}
    }
  })
  .state('disks', {
    url: '/disks',
    views: {
      'main': {
        templateUrl: 'templates/disks.html'
      }
    }
  })
  .state('volumes', {
    url: '/volumes',
    controller: 'VolumeCtrl',
    views: {
      'main': {templateUrl: 'templates/volumes.html'}
    }
  })
  .state('volumes.detail', {
    url: '/:volume',
    views: {
      'tab': {templateUrl: 'templates/volumes/tab.html'}
    }
  })
  .state('volumes.detail.status', {
    url: '/status',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/status.html'}
    }
  })
  .state('volumes.detail.statistics', {
    url: '/statistics',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/statistics.html'}
    }
  })
  .state('volumes.detail.cifs', {
    url: '/cifs',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/cifs.html'}
    }
  })
  .state('volumes.detail.nfs', {
    url: '/nfs',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/nfs.html'}
    }
  })
  .state('volumes.detail.luns', {
    url: '/luns',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/luns.html'}
    }
  })
  .state('volumes.detail.http', {
    url: '/http',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/http.html'}
    }
  })
  .state('volumes.detail.storage', {
    url: '/storage',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/storage.html'}
    }
  })
  .state('volumes.detail.snapshots', {
    url: '/snapshots',
    views: {
      'tab-content': {templateUrl: 'templates/volumes/snapshots.html'}
    }
  })
  .state('hosts', {
    url: '/hosts',
    views: {
      'main': {
        templateUrl: 'templates/hosts.html'
      }
    }
  })
  .state('users', {
    url: '/users',
    views: {
      'main': {
        templateUrl: 'templates/users.html'
      }
    }
  })
  .state('apikeys', {
    url: '/apikeys',
    views: {
      'main': {
        templateUrl: 'templates/apikeys.html'
      }
    }
  });
});

// kate: space-indent on; indent-width 2; replace-tabs on;
