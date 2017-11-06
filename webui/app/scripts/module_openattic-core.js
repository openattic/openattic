/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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

import "../components/api-decorator/api-decorator.module";
import "../components/api-recorder/api-recorder.module";
import "../components/auth/auth.module";
import "../components/dashboard/dashboard.module";
import "../components/grafana/grafana.module";
import "../components/navigation/navigation.module";
import "../components/notification/notification.module";
import "../components/settings/settings.module";
import "../components/shared/shared.module";
import "../components/userinfo/userinfo.module";
import "../components/task-queue/task-queue.module";
import "../components/users/users.module";
import "../components/feedback/feedback.module";
import RegistryService from "./shared/registry.service";

angular.module("openattic.core", [
  "openattic.apidecorator",
  "openattic.apirecorder",
  "openattic.auth",
  "openattic.dashboard",
  "openattic.feedback",
  "openattic.grafana",
  "openattic.navigation",
  "openattic.notification",
  "openattic.settings",
  "openattic.shared",
  "openattic.userinfo",
  "openattic.taskQueue",
  "openattic.users"
])
  .service("registryService", RegistryService);
