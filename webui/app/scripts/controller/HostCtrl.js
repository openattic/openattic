angular.module('openattic')
  .controller('HostCtrl', function ($scope, $state, HostService, $modal) {
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
      HostService.filter({
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

    $scope.$watch('selection.item', function(selitem){
      $scope.hasSelection = !!selitem;
      if (selitem) {
        $state.go('hosts.attributes', {host: selitem.id});
      }
      else {
        $state.go('hosts');
      }
    });

    $scope.addAction = function(){
      $state.go('hosts-add');
    };

    $scope.editAction = function(){
      $state.go('hosts-edit', {host: $scope.selection.item.id});
    };

    $scope.deleteAction = function(){
      if(!$scope.selection.item){
        return null;
      }
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/hosts/delete-host.html',
        controller: 'HostDeleteCtrl',
        resolve: {
          host: function(){
            return $scope.selection.item;
          }
        }
      });
      modalInstance.result.then(function(){
        $scope.filterConfig.refresh = new Date();
      });
    };
  });
