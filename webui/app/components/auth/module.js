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
