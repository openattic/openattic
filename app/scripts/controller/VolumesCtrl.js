angular.module('openattic')
  .controller('VolumeCtrl', function ($scope, $state, VolumeService, SizeParserService, $modal) {
    'use strict';

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null
    };

    $scope.selection = {
    };

    $scope.$watch('filterConfig', function(){
      VolumeService.filter({
        page:      $scope.filterConfig.page + 1,
        page_size: $scope.filterConfig.entries,
        search:    $scope.filterConfig.search,
        ordering:  ($scope.filterConfig.sortorder === 'ASC' ? '' : '-') + $scope.filterConfig.sortfield
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.$watch('selection.item', function(item){
      $scope.hasSelection = !!item;
      if( !item ){
        $state.go('volumes');
        return;
      }
      $scope.cloneable = item.type.name !== 'zfs';
      $scope.volumeForShare = item.is_filesystemvolume;
      $scope.volumeForLun   = item.is_blockvolume && !item.is_filesystemvolume;

      if( $state.current.name === 'volumes' ||
         ($state.current.name === 'volumes.detail.cifs' && !$scope.volumeForShare) ||
         ($state.current.name === 'volumes.detail.nfs'  && !$scope.volumeForShare) ||
         ($state.current.name === 'volumes.detail.http' && !$scope.volumeForShare) ||
         ($state.current.name === 'volumes.detail.tftp' && !$scope.volumeForShare) ||
         ($state.current.name === 'volumes.detail.luns' && !$scope.volumeForLun)){
        $state.go('volumes.detail.status', {volume: item.id});
      }
      else{
        $state.go($state.current.name, {volume: item.id});
      }
    });

    $scope.addAction = function(){
      $state.go('volumes-add');
    };

    $scope.resizeAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/volumes/resize.html',
        controller: 'VolumeResizeCtrl',
        resolve: {
          volume: function(){
            return $scope.selection.item;
          }
        }
      });

      modalInstance.result.then(function() {
        $scope.filterConfig.refresh = new Date();
      }, function() {});
    };

    $scope.protectionAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/volumes/protection.html',
        controller: 'VolumeProtectionCtrl',
        resolve: {
          volume: function(){
            return $scope.selection.item;
          }
        }
      });

      modalInstance.result.then(function() {
        $scope.filterConfig.refresh = new Date();
      }, function() {
        $scope.filterConfig.refresh = new Date();
      });
    };

    $scope.moreOptionsAction = function(){
      $('#more').effect('highlight', {}, 3000);
    };

    $scope.deleteAction = function(){
      if($scope.selection.item.is_protected){
        $.smallBox({
          title: 'Volume is not deletable',
          content: '<i class="fa fa-clock-o tc_notDeletable"></i><i> Release the deletion protection in order to be' +
                   'able to delete the volume.</i>',
          color: '#C46A69',
          iconSmall: 'fa fa-times fa-2x fadeInRight animated',
          timeout: 6000
        });
      }
      else {
        var modalInstance = $modal.open({
          windowTemplateUrl: 'templates/messagebox.html',
          templateUrl: 'templates/volumes/delete.html',
          controller: 'VolumeDeleteCtrl',
          resolve: {
            volume: function () {
              return $scope.selection.item;
            }
          }
        });

        modalInstance.result.then(function () {
          $scope.filterConfig.refresh = new Date();
        });
      }
    };

    $scope.cloneAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/volumes/clone.html',
        controller: 'VolumeCloneCtrl',
        resolve: {
          volume: function() {
            return $scope.selection.item;
          }
        }
      });

      modalInstance.result.then(function() {
        $scope.filterConfig.refresh = new Date();
      });
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
