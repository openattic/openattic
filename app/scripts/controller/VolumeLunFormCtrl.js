angular.module('openattic')
  .controller('VolumeLunFormCtrl', function ($scope, $state, $stateParams, LunService, HostService, InitiatorService) {

    $scope.share = {
        'volume': {id: $scope.selection.item.id},
        'host': null,
        'lun_id':  '0'
      };

    HostService.query()
      .$promise
      .then(function(res){
        $scope.hosts = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    $scope.$watch('share.host', function(host) {
      console.log(arguments);
      if('host'){
        InitiatorService.filter({host: host.id, type: 'qla2xxx'})
          .$promise
          .then(function(res) {
            $scope.haz_initiator = (res.count > 0);
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    });


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


    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('volumes.detail.luns');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
