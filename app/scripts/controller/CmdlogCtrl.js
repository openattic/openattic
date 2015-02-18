angular.module('openattic')
  .controller('CmdlogCtrl', function ($scope, $state, $filter, CmdlogService, $modal) {
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
      if(items !== undefined) {
        $scope.hasSelection = items.length > 0;
      }
    });

    $scope.deleteAction = function(){
      var selection = $scope.selection.items;
      var messageText = '';
      var ids = [];

      for(var i=0; i<selection.length; i++){
        ids.push(selection[i].id);
      }

      if(selection.length > 1){
        messageText = 'Do you really want to delete these ' + selection.length + ' items';
      }
      else {
        var itemText = $filter('shortlog')($scope.selection.item.text);
        messageText = 'Do you really want to delete that log entry: <pre>"' + itemText + '"</pre>'
      }

      $.SmartMessageBox({
        title: 'Delete log entry',
        content: messageText,
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          CmdlogService.delete(ids)
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
    };

    $scope.deleteByDateAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/cmdlogs/delete-by-date-window.html',
        templateUrl: 'templates/cmdlogs/delete-by-date.html',
        controller: 'DeleteByDateCtrl'
      });
    };
  })

  .controller('DeleteByDateCtrl', function ($scope, $modalInstance) {
    $scope.datePicker = {
      opened    : false,
      maxDate   : null,
      dateTime  : null,
      format    : 'dd/MM/yyyy',
      showBtnBar: false
    };

    $scope.open = function($event){
      $event.preventDefault();
      $event.stopPropagation();
      $scope.datePicker.maxDate = new Date();
      $scope.datePicker.opened = true;
    };

    $scope.yes = function(){
    };

    $scope.no = function(){
      $modalInstance.dismiss('cancel');

      $.smallBox({
        title: 'Delete log entry',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });

