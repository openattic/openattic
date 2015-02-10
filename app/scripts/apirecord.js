angular.module('openattic')
  .service('ApiRecorderService', function(){
    var recording = false;
    var recorded_commands = [];
    return {
      startRecording: function(){
        recording = true;
        recorded_commands = [];
      },
      isRecording: function(){
        return recording;
      },
      stopRecording: function(){
        recording = false;
        return recorded_commands;
      },
      recordCommand: function(config){
        if(recording){
          recorded_commands.push(config);
        }
      }
    };
  })
  .config(function($provide, $httpProvider){
    $provide.factory('apiRecordHttpInterceptor', function(ApiRecorderService) {
      return {
        'request': function(config) {
          if( config.method != "GET"){
            ApiRecorderService.recordCommand(config);
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
        '<a title="API Recorder" ng-click="handleClick()" >',
          '<i class="fa" ng-class="{\'fa-dot-circle-o\': !isRecording(), \'fa-stop\': isRecording() }"></i>',
        '</a>'
      ].join(''),
      controller: function($scope, ApiRecorderService){
        $scope.isRecording = ApiRecorderService.isRecording;
        $scope.handleClick = function(){
          if(!ApiRecorderService.isRecording()){
            ApiRecorderService.startRecording()
          }
          else{
            var script = [
              '#!/usr/bin/env python',
              'import requests',
              'host = "' + window.location.protocol + '//' + window.location.hostname + '"',
              'auth = ("username", "password")'
            ]
            var i, cmds = ApiRecorderService.stopRecording();
            for(i = 0; i < cmds.length; i++){
              script.push('requests.' + cmds[i].method.toLowerCase() + '(host + "' + cmds[i].url + '", {"auth": auth, "data": ' + angular.toJson(cmds[i].data) + '})')
            }
            console.log(script.join('\n'));
          }
        };
      }
    };
  });




// kate: space-indent on; indent-width 2; replace-tabs on;
