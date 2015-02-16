angular.module('openattic')
  .controller('CmdlogCtrl', function ($scope, $state, $filter, CmdlogService) {
    'use strict';

    $scope.data = {};

    $scope.filterConfig = {
      page      : 0,
      entries   : 10,
      search    : '',
      sortfield : null,
      sortorder : null
    };

    $scope.selection = {};

    $scope.$watch('filterConfig', function(){
      CmdlogService.filter({
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

    $scope.$watchCollection('selection.items', function(items){
      $scope.hasSelection = items.length > 0;
    });

    $scope.deleteAction = function(){
      var itemText = $filter('shortlog')($scope.selection.item.text);

      $.SmartMessageBox({
        title: 'Delete log entry',
        content: 'Do you really want to delete that log entry: <pre>"' + itemText + '"</pre>',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          CmdlogService.delete({id: $scope.selection.item.id})
            .$promise
            .then(function() {
              $scope.filterConfig.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete log entry',
            content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
            color: '#C46A69',
            iconSmall: 'fa fa-times fa-2x fadeInRight animated',
            timeout: 4000
          });
        }
      });
    }
  });