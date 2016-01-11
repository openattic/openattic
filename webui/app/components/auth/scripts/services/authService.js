"use strict";

var app = angular.module("openattic.auth");
app.factory("authService", function ($resource) {
  return $resource("/openattic/api/auth", {}, {
    login: {method: "POST"},
    logout: {method: "DELETE"},
    kerberos: {
      method: "GET",
      url: "/openattic/accounts/kerblogin.js"
    }
  });
});