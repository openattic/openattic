/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic.apirecorder");
app.directive("apiRecorder", function () {
  return {
    template: [
      "<a title=\"API Recorder\" ng-click=\"handleClick()\" >",
      "<i class=\"fa\" ng-class=\"{'fa-circle': !isRecording(), 'fa-stop': isRecording() }\"></i> API-Recorder",
      "</a>"
    ].join(""),
    controller: function ($scope, ApiRecorderService, toasty) {
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
            toasty.warning({
              title: "API Recorder",
              msg: "Did not capture any API requests."
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