"use strict";

bmApp.controller('BookListCtrl', function ($scope, BookDataService) {
    $scope.getBookOrder = function(book) {
        return book.title;
    };

    BookDataService.getBooks().then(function(res) {
        $scope.books = res.data;
    }, function(error) {
        console.log('An error occurred!', error);
    });
});
