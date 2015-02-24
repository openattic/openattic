angular.module('openattic.graph')
  .directive('graphWidget', function(){
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            'volume':  '=',
            'width':   '@',
            'profile': '@'
        },
        templateUrl: 'components/graph/templates/graphWidget.html',
        controller: function($scope, $http, $interval){
            $scope.params = {
                width: $scope.width
            };

            // Initialize profiles
            $scope.profiles = [
                {title:  '4h', duration:      6*60*60, tiny: true },
                {title: '24h', duration:     24*60*60, tiny: true },
                {title: '48h', duration:     48*60*60, tiny: true },
                {title:  '1w', duration:   7*24*60*60, tiny: true },
                {title:  '2w', duration:  14*24*60*60, tiny: false},
                {title:  '1m', duration:  30*24*60*60, tiny: true },
                {title:  '3m', duration:  90*24*60*60, tiny: false},
                {title:  '6m', duration: 180*24*60*60, tiny: false},
                {title:  '1y', duration: 365*24*60*60, tiny: true },
            ];

            $scope.activeProfile = null;

            $scope.setActiveProfile = function(profile){
                $scope.activeProfile = profile;
            }

            $scope.$watch('activeProfile', function(profile){
                if(profile){
                    if($scope.params.end){
                        delete $scope.params.end;
                    }
                    $scope.params.start = -profile.duration;
                }
            });

            $scope.$watch('volume', function(volume){
                var object_age = -1;
                if( volume && volume.createdate ){
                    object_age = (new Date() - new Date(volume.createdate)) / 1000.;
                }
                for( var i = 0; i < $scope.profiles.length; i++ ){
                    var profile = $scope.profiles[i];
                    if( profile.title == $scope.profile || (object_age != -1 && profile.duration >= object_age) ){
                        $scope.activeProfile = profile;
                        break;
                    }
                }
            }, true);

            $scope.zoomTo = function(start, end){
                $scope.params.start  = start;
                $scope.params.end    = end;
                $scope.activeProfile = null;
            }
        },
        link: function (scope, element, attr, controller, transclude) {
            var subscope = scope.$parent.$new();
            scope.$watch('params', function(params){ subscope.params = scope.params; }, true);
            scope.$watch('volume', function(volume){ subscope.volume = scope.volume; }, true);
            subscope.zoomTo = scope.zoomTo;
            transclude(subscope, function (clone, scope) {
                console.log(scope, element);
                element.find('[role="widget-body"]').append(clone);
            });
        }
    };
});

// kate: space-indent on; indent-width 4; replace-tabs on;
