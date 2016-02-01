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

angular.module("openattic.auth", ["ngResource"]);

var app = angular.module("openattic.auth");
app.config(function ($httpProvider) {
  $httpProvider.defaults.xsrfCookieName = "csrftoken";
  $httpProvider.defaults.xsrfHeaderName = "X-CSRFToken";
});

app.factory("AuthHttpInterceptor", function ($q, $injector) {
  return {
    request: function (config) {
      // Give the backend a clue that we're using AJAX here...
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      return config;
    },
    responseError: function (rejection) {
      // Just depending on $state would create a circular dependency,
      // so we need to get $state via the $injector.
      var $state = $injector.get("$state");
      if (rejection.status === 401) {
        $state.go("login");
      }
      return $q.reject(rejection);
    }
  };
});

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push("AuthHttpInterceptor");
});
