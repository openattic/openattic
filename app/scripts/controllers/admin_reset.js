"use strict";

bmApp.controller('AdminResetCtrl', function ($scope, $http) {
    $scope.reset = false;

    $http.get('http://localhost:4730/api/reset').then(function () {
        $scope.reset = true;
    }, function (error) {
        console.log('An error occurred!', error);
    });
});
