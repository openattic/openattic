'use strict';

angular.module('openattic.clusterstatuswidget')
  .directive('clusterstatuswidget', function(){
    return {
      restrict: 'A',
      scope: true,
      replace: true,
      templateUrl: 'components/clusterStatusWidget/templates/clusterstatus.html',
      controller: function(){}
    };
  });