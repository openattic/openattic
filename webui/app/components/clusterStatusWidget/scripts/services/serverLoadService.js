"use strict";

var app = angular.module("openattic.clusterstatuswidget");
app.factory("serverLoadService", function ($resource) {
  return $resource("/openattic/api/services/1/fetch?srcname=load1", {}, {});
});