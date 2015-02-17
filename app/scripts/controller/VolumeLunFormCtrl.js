angular.module('openattic')
  .controller('VolumeLunFormCtrl', function ($scope, $state, $stateParams, LunService, HostService) {

    $scope.data = {
      targetHost: null
    };
    HostService.query()
      .$promise
      .then(function(res){
        $scope.hosts = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    if(!$stateParams.share){
      $scope.share = {
        'volume': {id: $scope.selection.item.id},
        'host': $scope.selection.item.host,
        'lun_id':  '0'
      };
      $scope.editing = false;

      $scope.submitAction = function() {
        LunService.save($scope.share)
          .$promise
          .then(function() {
            goToListView();
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('volumes.detail.luns');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
