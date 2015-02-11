'use strict';

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
          if( config.method != 'GET'){
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
              'auth = ("username", "password")',
              ''
            ]
            var cmds = ApiRecorderService.stopRecording();
            if(cmds.length === 0){
              $.smallBox({
                title: 'API Recorder',
                content: '<i class="fa fa-clock-o"></i> <i>Did not capture any API requests.</i>',
                color: '#C46A69',
                iconSmall: 'fa fa-times fa-2x fadeInRight animated',
                timeout: 4000
              });
              return;
            }
            var i, url, args, datajson;
            for(i = 0; i < cmds.length; i++){
              url = window.location.origin + cmds[i].url;
              args = ['"' + url + '"', 'auth=auth'];
              if(cmds[i].data){
                args.push('data=' + angular.toJson(cmds[i].data, 4));
              }
              script.push('requests.' + cmds[i].method.toLowerCase() + '(' + args.join(', ') + ')\n');
            }
            $('#apirecord-script').val(script.join('\n'));
            $('#apirecord-modal').modal();
          }
        };
      }
    };
  });




// kate: space-indent on; indent-width 2; replace-tabs on;
