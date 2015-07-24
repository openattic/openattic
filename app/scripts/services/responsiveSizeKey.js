angular.module('openattic')
    .factory('ResponsiveSizeKey', function ($window, RESPONSIVE) {
        'use strict';
        return  {
            getKey: function() {
                var width = $window.innerWidth;
                var key;

                for(var k in RESPONSIVE) {
                    if(width > RESPONSIVE[k]) {
                        key = k;
                    }
                }

                return key;
            }
        }
    });
