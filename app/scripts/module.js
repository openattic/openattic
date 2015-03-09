'use strict';
angular.module('openattic', [
  'ngResource',
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
  'openattic.clock',
  'openattic.todowidget',
  'smartadmin.smartmenu',
  'ui.checkbox'
]);

angular.module('openattic').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

// kate: space-indent on; indent-width 2; replace-tabs on;
