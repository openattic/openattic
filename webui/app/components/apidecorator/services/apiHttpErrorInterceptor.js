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

var app = angular.module("openattic.apidecorator");

app.factory("ApiErrorDecoratorService", function ($q, Notification) {
  return {
    decorate: function (error) {
      var preventDefault = error.preventDefault || function() {},
        notification;
      
      if (error) {
        notification = new Notification({
            title: 'OpenAttic API Error',
            msg: ['Failed with ', error.status, ' status.', error.data && error.data.detail].join('')
          })
          .toCancelable()
          .show();

        /**
         * Decorated preventDefault method (in case error previously had preventDefault method defined).
         * If called, it will additionally to executing decorated method prevent default API error handling execution.
         * @return {void|any}
         */
        error.preventDefault = function() {
          notification.cancel.call(notification);
          return preventDefault.apply(error, arguments);
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
