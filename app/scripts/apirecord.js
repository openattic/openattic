angular.module('openattic')
  .config(function($provide, $httpProvider){
    window.API_RECORDING = false;
    window.API_RECORDED_COMMANDS = [];
    $provide.factory('apiRecordHttpInterceptor', function() {
      return {
        'request': function(config) {
          if( window.API_RECORDING && config.method != "GET"){
            window.API_RECORDED_COMMANDS.push(config);
          }
          return config;
        },
      };
    });

    $httpProvider.interceptors.push('apiRecordHttpInterceptor');
  })
  .directive('apiRecorder', function(){
    return {
      template: [
        '<a title="API Recorder" >',
          '<i class="fa" ng-class="{\'fa-dot-circle-o\': !recording, \'fa-stop\': recording }"></i>',
        '</a>'
      ].join(''),
      link: function(scope, element, attr){
        element.bind("click", function(){
          if(!window.API_RECORDING){
            scope.recording = true;
            scope.$apply();
            window.API_RECORDING = true;
          }
          else{
            var script = [
              '#!/usr/bin/env python',
              'import requests',
              'host = "' + window.location.protocol + '//' + window.location.hostname + '"',
              'auth = ("username", "password")'
            ]
            var i;
            for(i = 0; i < API_RECORDED_COMMANDS.length; i++){
              script.push('requests.' + API_RECORDED_COMMANDS[i].method.toLowerCase() + '(host + "' + API_RECORDED_COMMANDS[i].url + '", {"auth": auth, "data": ' + angular.toJson(API_RECORDED_COMMANDS[i].data) + '})')
            }
            console.log(script.join('\n'));

            scope.recording = false;
            scope.$apply();
            window.API_RECORDING = false;
            window.API_RECORDED_COMMANDS = [];
          }
        });
      }
    };
  });




// kate: space-indent on; indent-width 2; replace-tabs on;
