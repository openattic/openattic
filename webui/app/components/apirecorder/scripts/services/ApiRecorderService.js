"use strict";

var app = angular.module("openattic.apirecorder");
app.service("ApiRecorderService", function () {
  var recording = false;
  var recordedCommands = [];
  return {
    startRecording: function () {
      recording = true;
      recordedCommands = [];
    },
    isRecording: function () {
      return recording;
    },
    stopRecording: function () {
      recording = false;
      return recordedCommands;
    },
    recordCommand: function (config) {
      if (recording) {
        recordedCommands.push(config);
      }
    }
  };
});

app.factory("ApiRecordHttpInterceptor", function (ApiRecorderService) {
  return {
    "request": function (config) {
      if (config.method !== "GET") {
        // Create Clone
        var configClone = angular.copy(config);
        ApiRecorderService.recordCommand(configClone);
      }
      return config;
    }
  };
});

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push("ApiRecordHttpInterceptor");
});