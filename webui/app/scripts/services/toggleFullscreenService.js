var app = angular.module('openattic');

app.factory('toggleFullscreenService', function() {
    return {
        toggle: function() {
            var element = document.body;

            if (element.requestFullScreen) {
                if (!document.fullScreen) {
                    element.requestFullscreen();
                } else {
                    document.exitFullScreen();
                }
            } else if (element.mozRequestFullScreen) {
                if (!document.mozFullScreen) {
                    element.mozRequestFullScreen();
                } else {
                    document.mozCancelFullScreen();
                }
            } else if (element.webkitRequestFullScreen) {
                if (!document.webkitIsFullScreen) {
                    element.webkitRequestFullScreen();
                } else {
                    document.webkitCancelFullScreen();
                }
            }
        }
    }
});