angular.module('openattic.datatree')
  .directive('oadatatree', function($compile){
    return {
        restrict: "E",
        transclude: true,
        scope: {
            data: "=",
            childrenAttribute: "@"
        },
        template: [
            '<span ng-transclude></span>',
            '<ul role="tree">',
                '<li ng-repeat="child in children">',
                    '<oadatatree data="child" children-attribute="{{childrenAttribute}}">',
                        '<lol ng-transclude></lol>',
                    '</oadatatree>',
                '</li>',
            '</ul>'
        ].join(''),
        compile: function(tElement, tAttr, transclude) {
            // http://stackoverflow.com/questions/19125551/angularjs-understanding-a-recursive-directive
            //We are removing the contents/innerHTML from the element we are going to be applying the
            //directive to and saving it to adding it below to the $compile call as the template
            var contents = tElement.contents().remove();
            var compiledContents;
            return function(scope, iElement, iAttr) {
                if(!compiledContents) {
                    //Get the link function with the contents frome top level template with
                    //the transclude
                    compiledContents = $compile(contents, transclude);
                }
                //Call the link function to link the given scope and
                //a Clone Attach Function, http://docs.angularjs.org/api/ng.$compile :
                // "Calling the linking function returns the element of the template.
                //    It is either the original element passed in,
                //    or the clone of the element if the cloneAttachFn is provided."
                scope.$watch("data", function(){
                    if( scope.data )
                        scope.children = scope.data[scope.childrenAttribute];
                });
                compiledContents(scope, function(clone, scope) {
                    //Appending the cloned template to the instance element, "iElement",
                    //on which the directive is to used.
                    iElement.append(clone);
                });
            };
        }
    };
  });

// kate: space-indent on; indent-width 4; replace-tabs on;
