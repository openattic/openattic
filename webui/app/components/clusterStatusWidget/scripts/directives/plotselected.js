'use strict';

angular.module('openattic.clusterstatuswidget')
    .directive('ngPlotselected', function($parse) {
        return function(scope, element, attrs) {
            var fn = $parse(attrs.ngPlotselected);
            element.bind('plotselected', function(event, ranges) {
                scope.$apply(function() {
                    event.preventDefault();
                    fn(scope, {$event:event, $ranges: ranges});
                });
            });
        };
    });