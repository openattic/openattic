angular.module('openattic')
  .controller('VolumeStatisticsCtrl', function ($scope, $state) {
    'use strict';
    $scope.$watch(function(){
      return $state.current;
    }, function(current){
      $scope.state = current;
    });
    $scope.utilparams = {
      profile: null
    };
    $scope.perfparams = {
      profile: null
    };
  });

// kate: space-indent on; indent-width 4; replace-tabs on;
