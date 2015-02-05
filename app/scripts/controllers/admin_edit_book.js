"use strict";

bmApp.controller('AdminEditBookCtrl', function ($scope, $routeParams, $location, BookDataService) {
    $scope.isEditMode = true;
    $scope.submitBtnLabel = 'Buch editieren';

    var isbn = $routeParams.isbn;
    BookDataService.getBookByIsbn(isbn).then(function(res) {
        $scope.book = res.data;
    }, function(error) {
        console.log('An error occurred!', error);
    });

    $scope.submitAction = function() {
        BookDataService.updateBook($scope.book).then(function() {
            goToAdminListView();
        }, function(error) {
            console.log('An error occurred!', error);
        });
    };

    $scope.cancelAction = function() {
        goToAdminListView();
    };

    var goToAdminListView = function() {
        $location.path('/admin/books');
    };
});
