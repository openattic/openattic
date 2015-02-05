angular.module('openattic')
  .controller('PoolCtrl', function ($scope, $stateParams, $state, PoolService) {
    $scope.stateParams = $stateParams;

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: 'name',
      sortorder: 'ASC'
    };

    $scope.selection = {
      current: "A"
    };

    $scope.$watch("filterConfig", function(){
      PoolService.filter({
        page:      $scope.filterConfig.page + 1,
        page_size: $scope.filterConfig.entries,
        search:    $scope.filterConfig.search,
        ordering:  $scope.filterConfig.ordering
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    });

    $scope.$watch("selection.item", function(selitem){
      if (selitem) {
        $state.go('pools.detail.status', {pool: selitem.id})
      }
      else {
        $state.go('pools');
      }
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
