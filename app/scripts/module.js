'use strict';
angular.module('openattic', [
  'ngResource',
  'ui.router',
  'ui.bootstrap',
  'ngTagsInput',
  'ncy-angular-breadcrumb',
  'openattic.auth',
  'openattic.apirecorder',
  'openattic.datatable',
  'openattic.graph',
  'openattic.sizeparser',
  'openattic.extensions',
  'smartadmin.smartmenu'
]);

angular.module('openattic').config(function($httpProvider){
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
});

// kate: space-indent on; indent-width 2; replace-tabs on;
