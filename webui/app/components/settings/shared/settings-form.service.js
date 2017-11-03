/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

import globalConfig from "globalConfig";

export default class SettingsFormService {
  constructor ($resource) {
    let res = $resource(globalConfig.API.URL + "settings",
      {},
      {
        checkDeepSeaConnection: {
          method: "GET",
          url: globalConfig.API.URL + "settings/check_deepsea_connection"
        },
        checkRgwConnection: {
          method: "GET",
          url: globalConfig.API.URL + "settings/check_rgw_connection"
        },
        checkGrafanaConnection: {
          method: "GET",
          url: globalConfig.API.URL + "settings/check_grafana_connection"
        },
        getRgwConfiguration: {
          method: "GET",
          url: globalConfig.API.URL + "settings/get_rgw_configuration"
        },
        checkCephConnection: {
          method: "GET",
          url: globalConfig.API.URL + "settings/check_ceph_configuration"
        }
      });

    Object.assign(this, res);
  }
}

