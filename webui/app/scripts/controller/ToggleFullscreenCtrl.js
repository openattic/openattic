var app = angular.module('openattic');

app.controller('ToggleFullscreenCtrl', function($scope, toggleFullscreenService) {
    $scope.toggleFullscreen = function() {
        toggleFullscreenService.toggle();
    }
});