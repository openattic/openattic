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

var app = angular.module("openattic.apirecorder");
app.controller("ApiRecorderCtrl", function ($scope, $uibModalInstance, $document, $window, toasty) {
  $scope.close = function () {
    $uibModalInstance.dismiss("cancel");
  };

  $scope.copyToClipboard = function () {
    // Create a hidden element.
    var node = $document[0].createElement("textarea");
    node.style.position = "absolute";
    node.textContent = $scope.script;
    node.style.left = "-10000px";
    node.style.top = ($window.pageYOffset || $document[0].documentElement.scrollTop) + 'px';
    // Copy text to clipboard.
    $document[0].body.appendChild(node);
    var selection = $document[0].getSelection();
    selection.removeAllRanges();
    node.select();
    $document[0].execCommand("copy");
    selection.removeAllRanges();
    $document[0].body.removeChild(node);
    // Display success message.
    toasty.success({
      title: "API Recorder",
      msg  : "Script successfully copied to clipboard."
    });
  }
});