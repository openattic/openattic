'use strict';

angular.module('openattic.todowidget')
  .directive('todowidget', function(){
    return {
        restrict: 'A',
        scope: true,
        replace: true,
        templateUrl:'components/todoWidget/templates/todo.html',
        controller: function($scope){
            $scope.todos = [
//              {text: "Create Disk", open: true },
//              {text: "Create Pool", open: true },
                {text: "Create Volume", open: true }
            ];

            $scope.getTotalTodos = function(){
                return $scope.todos.length;
            };
        }
    }
});