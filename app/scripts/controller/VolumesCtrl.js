angular.module('openattic')
  .controller('VolumeCtrl', function ($scope, $state, VolumeService) {
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
      VolumeService.filter({
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
      if (selitem) {
        $state.go('volumes.detail.status', {volume: selitem.id});
      }
      else {
        $state.go('volumes');
      }
    });

    $scope.$watchCollection("selection.item", function(item){
      $scope.hasSelection = !!item;
      if( !item ){
        return;
      }
      $scope.volumeForShare = item.is_filesystemvolume;
      $scope.volumeForLun   = item.is_blockvolume && !item.is_filesystemvolume;
    });

    $scope.addAction = function(){
      console.log(["addAction", arguments]);
    }

    $scope.resizeAction = function(){
      console.log(["resizeAction", arguments]);
    }

    $scope.deleteAction = function(){
      $.SmartMessageBox({
        title: 'Delete HTTP export',
        content: [
          '<p>You are about to delete the volume ' + $scope.selection.item.name + '.</p>',
          '<p>Be aware that you will <b>lose all data</b> in that volume and that this operation <b>cannot be undone</b>.</p>',
          '<p>To confirm, please enter the volume name and click Accept.</p>'
        ].join(''),
        buttons: '[Cancel][Accept]',
        input: 'text',
        inputValue: '',
        placeholder: $scope.selection.item.name
      }, function (ButtonPressed, Value) {
        if (ButtonPressed === 'Accept') {
          if( Value === $scope.selection.item.name ){
            VolumeService.delete({id: $scope.selection.item.id})
              .$promise
              .then(function() {
                $scope.filterConfig.refresh = new Date();
              }, function(error){
                console.log('An error occured', error);
              });
          }
          else{
            $.smallBox({
              title: 'Delete volume',
              content: '<i class="fa fa-clock-o"></i> <i>Wrong volume name.</i>',
              color: '#C46A69',
              iconSmall: 'fa fa-times fa-2x fadeInRight animated',
              timeout: 4000
            });
          }
        }
        else{
          $.smallBox({
            title: 'Delete volume',
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
