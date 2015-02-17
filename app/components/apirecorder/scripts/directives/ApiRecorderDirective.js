'use strict';

angular.module('openattic.apirecorder')
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
            $.SmartMessageBox({
              title: 'API Recorder',
              content: [
                'Replay the actions you recorded by running this Python script:<br />',
                '<textarea rows="14" cols="80" style="color: black">',
                  script.join('\n'),
                '</textarea>'
              ].join(''),
              buttons: '[OK]'
            });
          }
        };
      }
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
