angular.module('openattic')
  .controller('VolumeWizardCtrl', function ($scope, $state, VolumeService, PoolService) {
    'use strict';

    $scope.volume  = {};
    $scope.data = {
      sourcePool: null,
      filesystem: ''
    };
    $scope.supported_filesystems = {};
    $scope.state = {
      created:   false,
      mirrored:  false,
      formatted: false
    };

    PoolService.query()
      .$promise
      .then(function(res){
        $scope.pools = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    $scope.$watch("data.sourcePool", function(sourcePool) {
      if(sourcePool){
        $scope.volume.source_pool = { id: sourcePool.id };
        new PoolService(sourcePool).$filesystems()
          .then(function(res) {
            $scope.supported_filesystems = res;
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    });

    $scope.submitAction = function() {
      if ($state.is('volumes-add.create') && !$scope.state.created) {
        VolumeService.save($scope.volume)
          .$promise
          .then(function(res) {
            $scope.volume = res;
            $scope.state.created = true;
            $state.go('volumes-add.filesystem'); // TODO: goto mirror here once that's implemented
          }, function(error){
            console.log('An error occured', error);
          });
      }
      else if($state.is('volumes-add.mirror') && !$scope.state.mirrored) {
        $.smallBox({
          title: 'Mirror Volume',
          content: '<i class="fa fa-clock-o"></i> <i>Sorry, we haven\'t implemented that yet.</i>',
          color: '#C46A69',
          iconSmall: 'fa fa-times fa-2x fadeInRight animated',
          timeout: 4000
        });
      }
      else if($state.is('volumes-add.filesystem') && !$scope.state.formatted) {
        $scope.volume.$update({filesystem: $scope.data.filesystem})
          .then(function(res) {
            $scope.volume = res;
            $scope.state.formatted = true;
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
      goToListView();
    }

    var goToListView = function() {
      $state.go('volumes');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
