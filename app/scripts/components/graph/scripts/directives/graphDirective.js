angular.module('openattic.datatable')
  .directive('graph', function(){
    return {
        restrict: 'E',
        scope: {
            "volumeServices":  "=",
            "voltype": "@",
            "service": "@",
            "graph":   "@",
            "width":   "@",
            "profile": "@",
            "profileDateHint": "@"
        },
        template: [
            '<div class="imgcontainer" style="position: relative; display: inline-block" ng-show="show" >',
                '<div class="imgselector" ',
                    'style="background-color: rgba(30, 30, 220, 0.4); ',
                        'position: absolute; height: 153px; width: 1px; ',
                        'z-index: 100; visibility: hidden;">&nbsp;</div>',
                '<img ng-src="{{ url }}?start={{ start }}&amp;end={{ end }}&amp;width={{ width }}" />',
            '</div>'].join(''),
        controller: function($scope, $http, $interval){
            $scope.showImage = function(service_info, graph_info){
                $scope.show = true;
                $scope.url  = graph_info.url;
                $scope.set_end(new Date(service_info.last_check).getTime() / 1000);
            }
            $scope.show = false;
            $scope.$watch("volumeServices", function(volumeServices){
                if( !volumeServices ){
                    return;
                }
                volumeServices.then(function(res){
                    $scope.show = false;
                    var services = res[$scope.voltype];
                    for( var s = 0; s < services.length; s++ ){
                        if( $scope.service && services[s].description !== $scope.service ){
                            continue;
                        }
                        for( var g = 0; g < services[s].graph_info.length; g++ ){
                            if( g == parseInt($scope.graph) || $scope.graph == services[s].graph_info[g].title ){
                                $scope.showImage(services[s], services[s].graph_info[g]);
                            }
                        }
                    }
                });
            });
            $scope.zoomTo = function(args){
                // When zooming in, we're called as:
                //   zoomTo({start: <start>, end: <end>})
                // When zooming back out or saved_* values change, we're called as:
                //   zoomTo()

                // Set defaults
                var args    = args || {}
                var start   = args.start   || 0;
                var end     = args.end     || $scope.saved_end;
                var profile = args.profile || $scope.saved_profile;

                // Known start overwrites the profile
                if( start ){
                    profile = null;
                }
                else{
                    start = end - profile.duration;
                    if( end == $scope.saved_end ){
                        $scope.new_data_available = false;
                    }
                }

                $scope.start = start;
                $scope.end   = end;
                $scope.active_profile = profile;
            }

            $scope.prediction = true;
            $scope.new_data_available = false;

            // Initialize end

            $interval(function(){
                var old_saved_end = $scope.saved_end;
                // See if we need to update saved_end...
                while( new Date() > ($scope.saved_end + 300) * 1000 ){
                    $scope.saved_end += 300;
                }
                // ...and if we updated it, call zoomTo() to update the images
                if( old_saved_end != $scope.saved_end ){
                    if( $scope.active_profile ){
                        $scope.zoomTo();
                    }
                    else{
                        $scope.new_data_available = true;
                    }
                }
            }, 1000);

            $scope.set_end = function(end){
                $scope.saved_end = end;
                $scope.zoomTo();
            };

            // Initialize profiles
            $scope.profiles = [
                {title:  "4h", duration:      6*60*60, tiny: true },
                {title: "24h", duration:     24*60*60, tiny: true },
                {title: "48h", duration:     48*60*60, tiny: true },
                {title:  "1w", duration:   7*24*60*60, tiny: true },
                {title:  "2w", duration:  14*24*60*60, tiny: false},
                {title:  "1m", duration:  30*24*60*60, tiny: true },
                {title:  "3m", duration:  90*24*60*60, tiny: false},
                {title:  "6m", duration: 180*24*60*60, tiny: false},
                {title:  "1y", duration: 365*24*60*60, tiny: true },
            ];
            $scope.set_active_profile = function(val){
                $scope.saved_profile = val;
                if( $scope.saved_profile != $scope.active_profile ){
                    $scope.zoomTo();
                }
            }
            $scope.$watch("profileDateHint", function(){
                var object_age = -1;
                if( $scope.profileDateHint ){
                    object_age = (new Date() - new Date($scope.profileDateHint)) / 1000.;
                }
                for( var i = 0; i < $scope.profiles.length; i++ ){
                    var profile = $scope.profiles[i];
                    if( profile.title == $scope.profile || (object_age != -1 && profile.duration >= object_age) ){
                        $scope.set_active_profile(profile);
                        break;
                    }
                }
            });
        },
        link: function(scope, element, attr){
            var imgel    = element.find("img"),
                selector = element.find(".imgselector"),
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
                    visibility: "visible",
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
                    ev.type === "mouseout" && ev.relatedTarget.classList.contains("imgselector")
                    )) return true;
                selector.css({
                    visibility: "hidden",
                    left:   startX - 2,
                    width:  1,
                });
                in_drag = false;
                var start = parseInt(scope.start);
                var end   = parseInt(scope.end);
                // Calc new start/end and call our callback
                scope.zoomTo({
                    "start": parseInt(start + (end - start) * (startX - minX) / (maxX - minX)),
                    "end":   parseInt(start + (end - start) * (endX   - minX) / (maxX - minX))
                });
            };
            imgel.mouseup(mouseup);
            imgel.mouseout(mouseup);
        }
    };
});

// kate: space-indent on; indent-width 4; replace-tabs on;
