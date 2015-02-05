"use strict";

bmApp.directive('tags', function() {
    return {
        restrict: 'E',
        scope: {
            tagData: '='
        },
        templateUrl: 'component_templates/directives/tags.html'
    }
});
