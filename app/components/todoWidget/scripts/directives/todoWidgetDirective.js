'use strict';

angular.module('openattic.todowidget')
  .directive('todowidget', function(){
    return {
        restrict: 'A',
        scope: true,
        replace: true,
        templateUrl:'components/todoWidget/templates/todo.html',
        controller: function($scope){
            $scope.todos = (localStorage.getItem('todos')!== null) ? JSON.parse(localStorage.getItem('todos')):
            [
                { text: "Create Volume", done: false },
                { text: "Task 2", done: false },
                { text: "Task 3", done: false }
            ];
            localStorage.setItem('todos', JSON.stringify($scope.todos));

            $scope.saveCheck = function(){
                localStorage.setItem('todos', JSON.stringify($scope.todos));
            }

            $scope.getTotalTodos = function(){
                return $scope.todos.length;
            };
        }
    }

});
