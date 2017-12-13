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

import _isObject from "lodash/isObject";
import _forIn from "lodash/forIn";

export default class ApiErrorDecoratorService {
  constructor ($log, Notification) {
    this.$log = $log;
    this.Notification = Notification;
  }

  decorate (error) {
    var simpleMsg;
    var detailMsg = "";

    if (error) {
      this.$log.error(error);
      var notificationConfig = {
        title: error.status === -1 ? "No API response" : error.status + " - " + error.statusText
      };
      simpleMsg = error && error.config && error.config.method && error.config.url &&
        "[" + error.config.method + ": " + error.config.url + "] => " + error.status;
      if (error.status === -1) { // Rejected because of a timeout.
        simpleMsg = [
          "The openATTIC REST API didn't respond in time.",
          "Please see the openattic log file for possible errors."
        ].join("<br>");
        Object.assign(notificationConfig, {
          timeout: false,
          clickToClose: true
        });
      }
      if (_isObject(error.data)) {
        _forIn(error.data, (val, key) => {
          if (key === "detail") {
            detailMsg = val + detailMsg;
          } else {
            if (detailMsg !== "") {
              detailMsg += "<br>";
            }
            detailMsg += key + ": " + val;
          }
        });
      }
      notificationConfig.msg = detailMsg || simpleMsg;
      error.message = notificationConfig.msg;
      let timeoutID = this.Notification.show(notificationConfig, error);

      /**
       * Decorated preventDefault method (in case error previously had preventDefault method defined).
       * If called, it will prevent a toasty to pop up.
       */
      error.preventDefault = () => {
        this.Notification.cancel(timeoutID);
      };

      /**
       * If called, it will prevent a toasty to pop up on a specific status code.
       * @param {int} statusCode
       */
      error.ignoreStatusCode = function (statusCode) {
        if (this.status === statusCode) {
          this.preventDefault();
        }
      };
    }

    return error;
  }
}

