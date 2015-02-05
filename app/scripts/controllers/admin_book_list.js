"use strict";

bmApp.controller('AdminBookListCtrl', function ($scope, BookDataService) {
    $scope.isAdmin = true;

    $scope.getBookOrder = function(book) {
        return book.title;
    };

    BookDataService.getBooks().then(function(res) {
        $scope.books = res.data;
    }, function(error) {
        console.log('An error occurred!', error);
    });
});
