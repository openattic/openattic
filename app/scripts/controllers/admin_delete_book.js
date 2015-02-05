"use strict";

bmApp.controller('AdminDeleteBookCtrl', function ($scope, $routeParams, $location, BookDataService) {
    var isbn = $routeParams.isbn;
    BookDataService.getBookByIsbn(isbn).then(function(res) {
        $scope.book = res.data;
    }, function(error) {
        console.log('An error occurred!', error);
    });

    $scope.deleteBook = function(isbn) {
        BookDataService.deleteBookByIsbn(isbn).then(function() {
            goToAdminListView();
        }, function(error) {
            console.log('An error occurred!', error);
        });

    };

    $scope.cancel = function() {
        goToAdminListView();
    };

    var goToAdminListView = function() {
        $location.path('/admin/books');
    };
});
