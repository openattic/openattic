angular.module('openattic')
  .controller('VolumeLunCtrl', function ($scope, $state, LunService, HostService) {
    'use strict';

    $scope.lunData = {};

    $scope.lunFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.lunSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.lunFilter.volume = selitem;
    });

    $scope.$watch('lunFilter', function(){
      if(!$scope.lunFilter.volume){
        return;
      }
      LunService.filter({
        page:      $scope.lunFilter.page + 1,
        page_size: $scope.lunFilter.entries,
        search:    $scope.lunFilter.search,
        ordering:  ($scope.lunFilter.sortorder === 'ASC' ? '' : '-') + $scope.lunFilter.sortfield,
        volume:    $scope.lunFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.lunsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);
    $scope.addLunAction = function(){
      $state.go('volumes.detail.luns-add');
    }

    $scope.deleteLunAction = function(){
      $.SmartMessageBox({
        title: 'Delete LUN',
        content: 'Do you really want to delete the LUN share "' + $scope.lunSelection.item.name + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          LunService.delete({id: $scope.lunSelection.item.id})
            .$promise
            .then(function() {
              $scope.lunFilter.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete LUN',
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
