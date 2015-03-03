angular.module('openattic.graph')
  .directive('graph', function(){
    return {
        restrict: 'E',
        scope: {
            volume:  '=',
            width:   '@',
            profile: '@',
            title:   '@',
            globalParams: '='
        },
        template: [
            '<div class="graphcontainer" style="position: relative; display: inline-block" >',
                '<div class="graphselector" ',
                    'style="background-color: rgba(30, 30, 220, 0.4); ',
                        'position: absolute; height: 153px; width: 1px; ',
                        'z-index: 100; visibility: hidden;">&nbsp;</div>',
                '<img ng-src="/openattic/nagios/v/{{ volume.id }}/{{ title }}.png?{{ urlparams }}" />',
            '</div>'].join(''),
        controller: function($scope, GraphProfileService){
            $scope.params = {
                width: $scope.width
            };

            $scope.$watch('params', function(params){
                if(params){
                    $scope.urlparams = $.param(angular.extend({
                        ts: new Date().getTime()
                    }, params));
                }
            }, true);

            $scope.$watch('globalParams', function(globalParams){
                var activeProfile;
                if(!globalParams){
                    return;
                }
                if(angular.isNumber(globalParams.start) && angular.isNumber(globalParams.end)){
                    $scope.params.start = globalParams.start;
                    $scope.params.end   = globalParams.end;
                }
                else{
                    activeProfile = globalParams.profile || GraphProfileService.getProfile($scope.profile);
                    delete $scope.params['end'];
                    $scope.params.start = -activeProfile.duration;
                }
            }, true);

            $scope.zoomTo = function(start, end){
                $scope.globalParams.start   = start;
                $scope.globalParams.end     = end;
                $scope.globalParams.profile = null;
            };
        },
        link: function(scope, element, attr){
            var imgel    = element.find('img'),
                selector = element.find('.graphselector'),
                in_drag  = false,
                minX     = 0,  // How far to the left we may go
                maxX     = 0,  // How far to the right we may go
                startX   = 0,  // Where the user actually started dragging
                endX     = 0;  // Where the user actually stopped dragging

            imgel.load(function(){
                maxX = imgel.width() - 30;
                minX = maxX - parseInt(scope.width);
            });

            // Drag start
            imgel.mousedown(function(ev){
                if( ev.button != 0 )
                    return;
                ev.preventDefault();

                var ctpos = imgel.offset();
                // If the user clicked farther to the right than our
                // graph is wide, cancel
                if(ev.pageX >= ctpos.left + maxX)
                    return true;

                in_drag = true;
                // If the user clicked farther to the left than our
                // graph is wide, clamp
                if(ev.pageX < ctpos.left + minX)
                    startX = minX;
                else
                    startX = ev.pageX - ctpos.left;

                selector.css({
                    top:    31,
                    left:   startX,
                    width:  1,
                    height: 153,
                    visibility: 'visible',
                });
            });

            // Dragging
            var mousemove = function(ev){
                if(!in_drag)
                    return true;
                var ctpos = imgel.offset();
                // If the user clicked farther to the right than our
                // graph is wide, clamp
                if(ev.pageX >= ctpos.left + maxX)
                    endX = maxX;
                else
                    endX = ev.pageX - ctpos.left;
                selector.css({
                    width:  endX - startX,
                });
            };
            imgel.mousemove(mousemove);
            selector.mousemove(mousemove);

            // Drag end
            var mouseup = function(ev){
                if(!in_drag || (
                    // If we move to the left, FireFox fires mouseout on the img element. We
                    // generally do want to react on the img's mouseout in general, just not
                    // in this particular case which is handled by mousemove.
                    ev.type === 'mouseout' && ev.relatedTarget.classList.contains('graphselector')
                    )) return true;
                selector.css({
                    visibility: 'hidden',
                    left:   startX - 2,
                    width:  1,
                });
                in_drag = false;
                var start = parseInt(scope.params.start);
                var end   = parseInt(scope.params.end) || 0;
                // Calc new start/end and call our callback
                scope.zoomTo(
                    parseInt(start + (end - start) * (startX - minX) / (maxX - minX)),
                    parseInt(start + (end - start) * (endX   - minX) / (maxX - minX))
                );
                scope.$apply();
            };
            imgel.mouseup(mouseup);
            imgel.mouseout(mouseup);
        }
    };
});

// kate: space-indent on; indent-width 4; replace-tabs on;
