angular.module('openattic')
  .controller('VolumeCifsSharesCtrl', function ($scope, $state, CifsSharesService) {
    'use strict';

    $scope.cifsData = {};

    $scope.cifsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.cifsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.cifsFilter.volume = selitem;
    });

    $scope.$watch('cifsFilter', function(){
      if(!$scope.cifsFilter.volume){
        return;
      }
      CifsSharesService.filter({
        page:      $scope.cifsFilter.page + 1,
        page_size: $scope.cifsFilter.entries,
        search:    $scope.cifsFilter.search,
        ordering:  ($scope.cifsFilter.sortorder === 'ASC' ? '' : '-') + $scope.cifsFilter.sortfield,
        volume:    $scope.cifsFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.cifsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addCifsAction = function(){
      $state.go('volumes.detail.cifs-add');
    }

    $scope.editCifsAction = function(){
      $state.go('volumes.detail.cifs-edit', {share: $scope.cifsSelection.item.id});
    }

    $scope.deleteCifsAction = function(){
      $.SmartMessageBox({
        title: 'Delete CIFS share',
        content: 'Do you really want to delete the CIFS share "' + $scope.cifsSelection.item.name + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          CifsSharesService.delete({id: $scope.cifsSelection.item.id})
            .$promise
            .then(function() {
              $scope.cifsFilter.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete CIFS share',
            content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
            color: '#C46A69',
            iconSmall: 'fa fa-times fa-2x fadeInRight animated',
            timeout: 4000
          });
        }
      });
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
