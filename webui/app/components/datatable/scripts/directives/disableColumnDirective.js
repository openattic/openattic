angular.module('openattic.datatable')
    .directive('disableColumn', function() {
        'use strict';
        return {
            restrict: 'A',
            controller: function($scope, $element, $attrs, ResponsiveSizeKey) {
                var options = $attrs.disableColumn.split(',');
                var sizeKey = ResponsiveSizeKey.getKey();
                
                if($.inArray(sizeKey, options) > -1) {
                    $scope.columns[$element.text()] = false;
                }
            }
        };
    });