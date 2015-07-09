'use strict';
angular.module('openattic', [
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'ui.sortable',
  'ui.dashboard',
  'ngTagsInput',
  'ncy-angular-breadcrumb',
  'angular-md5',
  'openattic.auth',
  'openattic.apirecorder',
  'openattic.datatable',
  'openattic.graph',
  'openattic.sizeparser',
  'openattic.extensions',
  'openattic.todowidget',
  'openattic.clusterstatuswidget',
  'openattic.oaWizards',
  'openattic.userinfo',
  'openattic.required',
  'smartadmin.smartmenu'
]);

angular.module('openattic').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

angular.module('openattic').run(function($rootScope, $state){
  $rootScope.loginActive = function(){
    return $state.is('login');
  };
  var hostname = window.location.host.split('.')[0];
  // check if the hostname looks like the first octet of an IP address
  // and only change pageTitle if it does not
  if( parseInt(hostname, 10) != hostname ){
    $rootScope.pageTitle = hostname + ' - openATTIC';
  }
  else{
    $rootScope.pageTitle = 'openATTIC';
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;
