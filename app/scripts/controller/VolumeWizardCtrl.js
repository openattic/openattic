angular.module('openattic')
  .controller('VolumeWizardCtrl', function ($scope, $state, VolumeService, PoolService, SizeParserService) {
    'use strict';

    $scope.volume  = {};
    $scope.data = {
      sourcePool: null,
      megs: 0,
      mirrorHost: '',
      mirrorPool: null,
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

    $scope.$watch('data.sourcePool', function(sourcePool) {
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
    $scope.$watch('data.megs', function(megs){
      $scope.volume.megs = SizeParserService.parseInt(megs);
    });

    var goToListView = function() {
      $state.go('volumes');
    }

    var goToNextSensibleState = function(){
      if(!$scope.state.created){
        $state.go('volumes-add.create');
      }
      // TODO: if !mirrored goto mirror once that's implemented
      else if(!$scope.state.formatted){
        $state.go('volumes-add.filesystem');
      }
      else{
        goToListView();
      }
    }

    $scope.submitAction = function() {
      if (!$scope.state.created) {
        if( $scope.data.filesystem !== '' ){
          $scope.volume.filesystem = $scope.data.filesystem;
        }
        VolumeService.save($scope.volume)
          .$promise
          .then(function(res) {
            $scope.volume = res;
            $scope.state.created = true;
            $scope.state.formatted = $scope.volume.is_filesystemvolume;
            goToNextSensibleState();
          }, function(error){
            console.log('An error occured', error);
          });
      }
      else if(!$scope.state.mirrored && $scope.data.mirrorHost !== '') {
        $.smallBox({
          title: 'Mirror Volume',
          content: '<i class="fa fa-clock-o"></i> <i>Sorry, we haven\'t implemented that yet.</i>',
          color: '#C46A69',
          iconSmall: 'fa fa-times fa-2x fadeInRight animated',
          timeout: 4000
        });
      }
      else if(!$scope.state.formatted) {
        $scope.volume.$update({filesystem: $scope.data.filesystem})
          .then(function(res) {
            $scope.volume = res;
            $scope.state.formatted = true;
            goToNextSensibleState();
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
      goToListView();
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
