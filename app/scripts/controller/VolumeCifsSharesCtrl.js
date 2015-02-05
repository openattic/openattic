angular.module('openattic')
  .controller('VolumeCifsSharesCtrl', function ($scope, $stateParams, CifsSharesService) {
    $scope.cifsData = {};

    $scope.cifsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: 'name',
      sortorder: 'ASC',
      volume: null
    };

    $scope.cifsSelection = {
    };

    $scope.$watch("selection.item", function(selitem){
      $scope.cifsFilter.volume = selitem;
    });

    $scope.$watch("cifsFilter", function(){
      if(!$scope.cifsFilter.volume) return;
      CifsSharesService.filter({
        page:      $scope.cifsFilter.page + 1,
        page_size: $scope.cifsFilter.entries,
        search:    $scope.cifsFilter.search,
        ordering:  ($scope.cifsFilter.sortorder == "ASC" ? "" : "-") + $scope.cifsFilter.sortfield,
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
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
