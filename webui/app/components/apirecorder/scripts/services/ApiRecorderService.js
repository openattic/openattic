'use strict';

angular.module('openattic.apirecorder')
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
  .factory('ApiRecordHttpInterceptor', function(ApiRecorderService) {
    return {
      'request': function(config) {
        if( config.method !== 'GET'){
          ApiRecorderService.recordCommand(config);
        }
        return config;
      },
    };
  })
  .config(function($httpProvider){
    $httpProvider.interceptors.push('ApiRecordHttpInterceptor');
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
