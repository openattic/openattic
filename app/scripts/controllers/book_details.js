"use strict";

bmApp.controller('BookDetailsCtrl',
function ($scope, $location, $routeParams, BookDataService) {
    var isbn = $routeParams.isbn;

    BookDataService.getBookByIsbn(isbn).then(function(res) {
        $scope.book = res.data;
    }, function(error) {
        console.log('An error occurred!', error);
    });

    $scope.goToListView = function() {
        if ($location.path().indexOf('/admin') === 0) {
            $location.path('/admin/books');
        }
        else {
            $location.path('/books');
        }
    };
});
