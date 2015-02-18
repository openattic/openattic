angular.module('openattic')
  .controller('VolumeSnapshotsCtrl', function ($scope, $state, VolumeService) {
    'use strict';

    $scope.snapshotsData = {};

    $scope.snapshotsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.snapshotsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.snapshotsFilter.volume = selitem;
    });

    $scope.$watch('snapshotsFilter', function(){
      if(!$scope.snapshotsFilter.volume){
        return;
      }
      new VolumeService($scope.snapshotsFilter.volume).$snapshots({
        page:      $scope.snapshotsFilter.page + 1,
        page_size: $scope.snapshotsFilter.entries,
        search:    $scope.snapshotsFilter.search,
        ordering:  ($scope.snapshotsFilter.sortorder === 'ASC' ? '' : '-') + $scope.snapshotsFilter.sortfield
      })
      .then(function (res) {
        $scope.snapshotsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addAction = function(){
      $state.go('volumes.detail.snapshots-add');
    }

//     $scope.deleteAction = function(){
//       $.SmartMessageBox({
//         title: 'Delete snapshot',
//         content: 'Do you really want to delete snapshot  "' + $scope.snapshotsSelection.item.snapshot.title + '"?',
//         buttons: '[No][Yes]'
//       }, function (ButtonPressed) {
//         if (ButtonPressed === 'Yes') {
//           .delete({id: $scope.snapshotsSelection.item.snapshot.id})
//             .$promise
//             .then(function() {
//               $scope.snapshotsFilter.refresh = new Date();
//             }, function(error){
//               console.log('An error occured', error);
//             });
//         }
//         if (ButtonPressed === 'No') {
//           $.smallBox({
//             title: 'Delete snapshot',
//             content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
//             color: '#C46A69',
//             iconSmall: 'fa fa-times fa-2x fadeInRight animated',
//             timeout: 4000
//           });
//         }
//       });
//     }
   });

// kate: space-indent on; indent-width 2; replace-tabs on;
