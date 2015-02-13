angular.module('openattic')
  .controller('VolumeLunsCtrl', function ($scope, $state, LunsService, HostService) {
    'use strict';

    $scope.data = {
      targetHost: null
    };

    $scope.lunsData = {};

    $scope.lunsFilter = {
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
      $scope.lunsFilter.volume = selitem;
    });

    $scope.$watch('lunsFilter', function(){
      if(!$scope.lunsFilter.volume){
        return;
      }
      LunsService.filter({
        page:      $scope.lunsFilter.page + 1,
        page_size: $scope.lunsFilter.entries,
        search:    $scope.lunsFilter.search,
        ordering:  ($scope.lunsFilter.sortorder === 'ASC' ? '' : '-') + $scope.lunsFilter.sortfield,
        volume:    $scope.lunsFilter.volume.id
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

    HostService.query()
      .$promise
      .then(function(res){
        $scope.hosts = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    $scope.deleteLunAction = function(){
      $.SmartMessageBox({
        title: 'Delete LUN',
        content: 'Do you really want to delete the LUN share "' + $scope.lunSelection.item.name + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          LunsService.delete({id: $scope.lunSelection.item.id})
            .$promise
            .then(function() {
              $scope.lunsFilter.refresh = new Date();
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
