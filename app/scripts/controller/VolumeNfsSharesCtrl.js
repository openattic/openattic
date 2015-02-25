angular.module('openattic')
  .controller('VolumeNfsSharesCtrl', function ($scope, $state, NfsSharesService) {
    'use strict';

    $scope.nfsData = {};

    $scope.nfsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.nfsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.nfsFilter.volume = selitem;
    });

    $scope.$watch('nfsFilter', function(){
      if(!$scope.nfsFilter.volume){
        return;
      }
      NfsSharesService.filter({
        page:      $scope.nfsFilter.page + 1,
        page_size: $scope.nfsFilter.entries,
        search:    $scope.nfsFilter.search,
        ordering:  ($scope.nfsFilter.sortorder === 'ASC' ? '' : '-') + $scope.nfsFilter.sortfield,
        volume:    $scope.nfsFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.nfsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addNfsAction = function(){
      $state.go('volumes.detail.nfs-add');
    };

    $scope.deleteNfsAction = function(){
      $.SmartMessageBox({
        title: 'Delete NFS export',
        content: 'Do you really want to delete the NFS export to "' + $scope.nfsSelection.item.address + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          NfsSharesService.delete({id: $scope.nfsSelection.item.id})
            .$promise
            .then(function() {
              $scope.nfsFilter.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete NFS export',
            content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
            color: '#C46A69',
            iconSmall: 'fa fa-times fa-2x fadeInRight animated',
            timeout: 4000
          });
        }
      });
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
