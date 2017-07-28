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

var app = angular.module("openattic.apidecorator");

app.factory("ApiErrorDecoratorService", function ($q, $log, Notification) {
  return {
    decorate: function (error) {
      var simpleMsg;
      var notification;
      var detailMsg = "";

      if (error) {
        $log.error(error);
        var notificationConfig = {
          title: error.status === -1 ? "No API response" : error.status + " - " + error.statusText
        };
        simpleMsg = error && error.config && error.config.method && error.config.url &&
          "[" + error.config.method + ": " + error.config.url + "] => " + error.status;
        if (error.status === -1) {  // Rejected because of a timeout.
          simpleMsg = [
            "The openATTIC REST API didn't respond in time.",
            "Please see the openattic log file for possible errors."
          ].join("<br>");
          angular.extend(notificationConfig, {
            timeout: false,
            clickToClose: true
          });
        }
        if (angular.isObject(error.data)) {
          angular.forEach(error.data, function (val, key) {
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
        notification = new Notification(notificationConfig, error)
          .show();

        /**
         * Decorated preventDefault method (in case error previously had preventDefault method defined).
         * If called, it will prevent a toasty to pop up.
         */
        error.preventDefault = function () {
          notification.cancel();
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
  };
});

app.factory("ApiHttpErrorInterceptor", function ($q, ApiErrorDecoratorService) {
  return {
    responseError: function (rejection) {
      return $q.reject(ApiErrorDecoratorService.decorate(rejection));
    }
  };
});
