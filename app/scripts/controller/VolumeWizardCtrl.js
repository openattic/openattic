angular.module('openattic')
  .controller('VolumeWizardCtrl', function ($scope, $state, VolumeService, PoolService, SizeParserService) {
    'use strict';

    $scope.volume  = {};
    $scope.data = {
      sourcePool: null,
      megs: '',
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
    $scope.accordionOpen = {
      properties: true,
      mirror: false
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
    };

    $scope.submitAction = function(volumeForm) {
      $scope.submitted = true;
      if(volumeForm.$valid === true) {
        if (!$scope.state.created) {
          if ($scope.data.filesystem !== '') {
            $scope.volume.filesystem = $scope.data.filesystem;
          }
          VolumeService.save($scope.volume)
            .$promise
            .then(function (res) {
              $scope.volume = res;
              $scope.state.created = true;
              $scope.state.formatted = $scope.volume.is_filesystemvolume;
              goToListView();
            }, function (error) {
              console.log('An error occured', error);
            });
        }
        else if (!$scope.state.mirrored && $scope.data.mirrorHost !== '') {
          $.smallBox({
            title: 'Mirror Volume',
            content: '<i class="fa fa-clock-o"></i> <i>Sorry, we haven\'t implemented that yet.</i>',
            color: '#C46A69',
            iconSmall: 'fa fa-times fa-2x fadeInRight animated',
            timeout: 4000
          });
        }
        else if (!$scope.state.formatted) {
          new VolumeService({
            id: $scope.volume.id,
            filesystem: $scope.data.filesystem
          }).$update()
            .then(function (res) {
              $scope.volume = res;
              $scope.state.formatted = true;
              goToListView();
            }, function (error) {
              console.log('An error occured', error);
            });
        }
      }
    };

    $scope.cancelAction = function() {
      goToListView();
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
