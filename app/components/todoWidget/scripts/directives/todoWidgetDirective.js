'use strict';

angular.module('openattic.todowidget')
  .directive('todowidget', function(){
    return {
        restrict: 'A',
        scope: true,
        replace: true,
        templateUrl:'components/todoWidget/templates/todo.html',
        controller: function($scope){
            $scope.todos = {name: "disks"};
            console.log("hallo");
        }
    }
  });