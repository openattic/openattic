"use strict";

var app = angular.module("openattic.apirecorder");
app.directive("apiRecorder", function () {
  return {
    template: [
      "<a title=\"API Recorder\" ng-click=\"handleClick()\" >",
      "<i class=\"fa\" ng-class=\"{'fa-circle': !isRecording(), 'fa-stop': isRecording() }\"></i>",
      "</a>"
    ].join(""),
    controller: function ($scope, ApiRecorderService) {
      $scope.isRecording = ApiRecorderService.isRecording;
      $scope.handleClick = function () {
        if (!ApiRecorderService.isRecording()) {
          ApiRecorderService.startRecording();
        } else {
          var script = [
            "#!/usr/bin/env python",
            "import requests",
            "import json",
            "auth = ('username', 'password') # edit username and password",
            "",
            "headers = {'content-type': 'application/json'}",
            ""
          ];
          var cmds = ApiRecorderService.stopRecording();
          if (cmds.length === 0) {
            $.smallBox({
              title: "API Recorder",
              content: "<i class=\"fa fa-clock-o\"></i> <i>Did not capture any API requests.</i>",
              color: "#C46A69",
              iconSmall: "fa fa-times fa-2x fadeInRight animated",
              timeout: 4000
            });
            return;
          }
          var i;
          var url;
          var args;
          for (i = 0; i < cmds.length; i++) {
            script.push("### recorded command " + (i + 1));
            url = window.location.origin + cmds[i].url;
            args = ["'" + url + "'", "auth=auth"];
            if (cmds[i].data) {
              script.push("data=json.dumps(" + angular.toJson(cmds[i].data, 4) + ")");
              args.push("data=data");
              args.push("headers=headers");
            }
            script.push("requests." + cmds[i].method.toLowerCase() + "(" + args.join(", ") + ")\n");
          }
          $.SmartMessageBox({
            title: "API Recorder",
            content: [
              "Replay the actions you recorded by running this Python script:<br />",
              "<textarea rows=\"14\" cols=\"80\" style=\"color: black\">",
              script.join("\n"),
              "</textarea>"
            ].join(""),
            buttons: "[OK]"
          });
        }
      };
    }
  };
});