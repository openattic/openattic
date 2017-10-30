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

class ApiRecorder {
  constructor (ApiRecorderService, Notification, $uibModal) {
    this.ApiRecorderService = ApiRecorderService;
    this.Notification = Notification;
    this.$uibModal = $uibModal;
  }

  handleClick () {
    if (!this.ApiRecorderService.isRecording()) {
      this.ApiRecorderService.startRecording();
    } else {
      let script = [
        "#!/usr/bin/env python",
        "import requests",
        "import json",
        "auth = ('username', 'password') # edit username and password",
        "",
        "headers = {'content-type': 'application/json'}",
        ""
      ];
      let cmds = this.ApiRecorderService.stopRecording();
      if (cmds.length === 0) {
        this.Notification.warning({
          title: "API Recorder",
          msg: "Did not capture any API requests."
        });
        return;
      }
      let i;
      let url;
      let args;
      for (i = 0; i < cmds.length; i++) {
        script.push("### recorded command " + (i + 1));
        url = window.location.origin + cmds[i].url;
        args = ["'" + url + "'", "auth=auth"];
        if (cmds[i].data) {
          script.push("data=json.dumps(" + JSON.stringify(cmds[i].data, null, 4) + ")");
          args.push("data=data");
          args.push("headers=headers");
        }
        script.push("requests." + cmds[i].method.toLowerCase() + "(" + args.join(", ") + ")\n");
      }

      script = script.join("\n");

      this.$uibModal.open({
        windowTemplate: require("../../../templates/messagebox.html"),
        component: "apiRecorderModal",
        resolve: {
          script: () => {
            return script;
          }
        }
      });
    }
  }

  isRecording () {
    return this.ApiRecorderService.isRecording();
  }
}

export default {
  template: require("./api-recorder.component.html"),
  controller: ApiRecorder,
  bindings: {
    resolve: "="
  }
};
