"use strict";

bmApp.controller('AdminNewBookCtrl', function ($scope, $location, BookDataService) {
    $scope.book = {};
    $scope.submitBtnLabel = 'Buch anlegen';

    $scope.submitAction = function() {
        BookDataService.storeBook($scope.book).then(function() {
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
