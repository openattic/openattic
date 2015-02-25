angular.module('openattic')
  .controller('VolumeHttpSharesCtrl', function ($scope, $state, HttpSharesService) {
    'use strict';

    $scope.httpData = {};

    $scope.httpFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.httpSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.httpFilter.volume = selitem;
    });

    $scope.$watch('httpFilter', function(){
      if(!$scope.httpFilter.volume){
        return;
      }
      HttpSharesService.filter({
        page:      $scope.httpFilter.page + 1,
        page_size: $scope.httpFilter.entries,
        search:    $scope.httpFilter.search,
        ordering:  ($scope.httpFilter.sortorder === 'ASC' ? '' : '-') + $scope.httpFilter.sortfield,
        volume:    $scope.httpFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.httpData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addHttpAction = function(){
      $state.go('volumes.detail.http-add');
    };

    $scope.deleteHttpAction = function(){
      $.SmartMessageBox({
        title: 'Delete HTTP export',
        content: 'Do you really want to delete the HTTP export for "' + $scope.httpSelection.item.path + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          HttpSharesService.delete({id: $scope.httpSelection.item.id})
            .$promise
            .then(function() {
              $scope.httpFilter.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete HTTP export',
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
