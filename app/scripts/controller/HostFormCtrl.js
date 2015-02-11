angular.module('openattic')
  .controller('HostFormCtrl', function ($scope, $state, $stateParams, HostService, PeerHostService, InitiatorService) {
    if(!$stateParams.host){
      $scope.host = {};
      $scope.editing = false;

      $scope.submitAction = function() {
        HostService.save($scope.host)
          .$promise
          .then(function() {
            goToListView();
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    }
    else {
      $scope.editing = true;
      $scope.data = {
        peerHostUrl: '',
        iscsiIqn: '',
        fcWwn: ''
      };

      HostService.get({id: $stateParams.host})
        .$promise
        .then(function(res){
          $scope.host = res;
        }, function(error){
          console.log('An error occurred', error);
        });

      PeerHostService.get({host: $stateParams.host})
        .$promise
        .then(function(res){
          $scope.data.peerHost = res.results[0];
        }, function(error){
          console.log('An error occurred', error);
        });

      InitiatorService.get({host: $stateParams.host})
        .$promise
        .then(function(res){
          for( var i = 0; i < res.results.length; i++ ){
            if( res.results[i].type === 'iscsi' ){
              $scope.data.iscsi = res.results[i];
            }
            else{
              $scope.data.fc = res.results[i];
            }
          }
        }, function(error){
          console.log('An error occurred', error);
        });

      $scope.submitAction = function() {
        HostService.update({id: $scope.host.id}, $scope.host)
          .$promise
          .then(function() {
            goToListView();
          }, function(error){
            console.log('An error occured', error);
          });
      }
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('hosts');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
