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

var app = angular.module("ui.dashboard");
app.controller("DashboardWidgetCtrl", ["$scope", "$element", "$compile", "$window", "$timeout",
  function ($scope, $element, $compile, $window, $timeout) {
    $scope.status = {
      isopen: false
    };

    // Fills "container" with compiled view
    $scope.makeTemplateString = function () {
      var widget = $scope.widget;

      // First, build template string
      var templateString = "";

      if (widget.templateUrl) {
        // Use ng-include for templateUrl
        console.log(widget.templateUrl);
        templateString = "<div ng-include=\"" + widget.templateUrl + "\"></div>";
      } else if (widget.template) {
        // Direct string template
        templateString = widget.template;
      } else {
        // Assume attribute directive
        templateString = "<div " + widget.directive;

        // Check if data attribute was specified
        if (widget.dataAttrName) {
          widget.attrs = widget.attrs || {};
          widget.attrs[widget.dataAttrName] = "widgetData";
        }

        // Check for specified attributes
        if (widget.attrs) {

          // First check directive name attr
          if (widget.attrs[widget.directive]) {
            templateString += "=\"" + widget.attrs[widget.directive] + "\"";
          }

          // Add attributes
          _.each(widget.attrs, function (value, attr) {

            // make sure we aren't reusing directive attr
            if (attr !== widget.directive) {
              templateString += " " + attr + "=\"" + value + "\"";
            }

          });
        }
        templateString += "></div>";
      }
      return templateString;
    };

    $scope.grabResizer = function (e) {
      var widget = $scope.widget;
      var widgetElm = $element.find(".widget");

      // ignore middle- and right-click
      if (e.which !== 1) {
        return;
      }

      e.stopPropagation();
      e.originalEvent.preventDefault();

      // get the starting horizontal position
      var initX = e.clientX;

      // Get the current width of the widget and dashboard
      var pixelWidth = widgetElm.width();
      var pixelHeight = widgetElm.height();
      var widgetStyleWidth = widget.containerStyle.width;
      var widthUnits = widget.widthUnits;
      var unitWidth = parseFloat(widgetStyleWidth);

      // create marquee element for resize action
      var $marquee = angular.element("<div class=\"widget-resizer-marquee\" style=\"height: " + pixelHeight +
          "px; width: " + pixelWidth + "px;\"></div>");
      widgetElm.append($marquee);

      // determine the unit/pixel ratio
      var transformMultiplier = unitWidth / pixelWidth;

      // updates marquee with preview of new width
      var mousemove = function (e) {
        var curX = e.clientX;
        var pixelChange = curX - initX;
        var newWidth = pixelWidth + pixelChange;
        $marquee.css("width", newWidth + "px");
      };

      // sets new widget width on mouseup
      var mouseup = function (e) {
        // remove listener and marquee
        jQuery($window).off("mousemove", mousemove);
        $marquee.remove();

        // calculate change in units
        var curX = e.clientX;
        var pixelChange = curX - initX;
        var unitChange = Math.round(pixelChange * transformMultiplier * 100) / 100;

        // add to initial unit width
        var newWidth = unitWidth * 1 + unitChange;

        if (typeof widget.containerStyle.minWidth !== "undefined") {
          var dashboardSize = widgetElm.closest(".dashboard-widget-area").width();
          var minWidth = parseFloat(widget.containerStyle.minWidth);
          var units = widget.containerStyle.minWidth.replace(/^[-\.\d]+/, "") || "%";
          var minWidthPx;
          var minWidthPercent;

          switch (units) {
          case "%":
            minWidthPx = minWidth / 100 * dashboardSize;
            minWidthPercent = minWidth;
            break;
          case "px":
            minWidthPx = minWidth;
            minWidthPercent = minWidth / dashboardSize * 100;
            break;
          }

          if ((pixelWidth + pixelChange) < minWidthPx) {
            if (widthUnits === "%") {
              newWidth = minWidthPercent;
            } else {
              newWidth = minWidthPx;
            }
          }
        }

        widget.setWidth(newWidth, widthUnits);
        $scope.$emit("widgetChanged", widget);
        $scope.$apply();
        $scope.$broadcast("widgetResized", {
          width: newWidth,
          widthPx: widgetElm.width()
        });
      };

      jQuery($window).on("mousemove", mousemove).one("mouseup", mouseup);
    };

    //TODO refactor
    $scope.grabSouthResizer = function (e) {
      var widgetElm = $element.find(".widget");

      // ignore middle- and right-click
      if (e.which !== 1) {
        return;
      }

      e.stopPropagation();
      e.originalEvent.preventDefault();

      // get the starting horizontal position
      var initY = e.clientY;

      // Get the current width of the widget and dashboard
      var pixelWidth = widgetElm.width();
      var pixelHeight = widgetElm.height();

      // create marquee element for resize action
      var $marquee = angular.element("<div class=\"widget-resizer-marquee\" style=\"height: " + pixelHeight +
          "px; width: " + pixelWidth + "px;\"></div>");
      widgetElm.append($marquee);

      // updates marquee with preview of new height
      var mousemove = function (e) {
        var curY = e.clientY;
        var pixelChange = curY - initY;
        var newHeight = pixelHeight + pixelChange;
        $marquee.css("height", newHeight + "px");
      };

      // sets new widget width on mouseup
      var mouseup = function (e) {
        // remove listener and marquee
        jQuery($window).off("mousemove", mousemove);
        $marquee.remove();

        // calculate height change
        var curY = e.clientY;
        var pixelChange = curY - initY;

        //var widgetContainer = widgetElm.parent(); // widget container responsible for holding widget width and height
        var widgetContainer = widgetElm.find(".widget-content");

        var diff = pixelChange;
        var height = parseInt(widgetContainer.css("height"), 10);
        var newHeight = (height + diff);

        //$scope.widget.style.height = newHeight + "px";

        $scope.widget.setHeight(newHeight + "px");

        $scope.$emit("widgetChanged", $scope.widget);
        $scope.$apply(); // make AngularJS to apply style changes

        $scope.$broadcast("widgetResized", {
          height: newHeight
        });
      };

      jQuery($window).on("mousemove", mousemove).one("mouseup", mouseup);
    };

    // replaces widget title with input
    $scope.editTitle = function (widget) {
      var widgetElm = $element.find(".widget");
      widget.editingTitle = true;
      // HACK: get the input to focus after being displayed.
      $timeout(function () {
        widgetElm.find("form.widget-title input:eq(0)").focus()[0].setSelectionRange(0, 9999);
      });
    };

    // saves whatever is in the title input as the new title
    $scope.saveTitleEdit = function (widget) {
      widget.editingTitle = false;
      $scope.$emit("widgetChanged", widget);
    };

    $scope.compileTemplate = function () {
      var container = $scope.findWidgetContainer($element);
      var templateString = $scope.makeTemplateString();
      var widgetElement = angular.element(templateString);

      container.empty();
      container.append(widgetElement);
      $compile(widgetElement)($scope);
    };

    $scope.findWidgetContainer = function (element) {
      // widget placeholder is the first (and only) child of .widget-content
      return element.find(".widget-content");
    };

    // add watcher if minWidth is set
    if (typeof $scope.widget.containerStyle.minWidth !== "undefined") {
      $(window).resize(function () {
        $scope.$apply(function () {
          var widget = $scope.widget;
          var widgetElm = $element.find(".widget");
          var units = widget.containerStyle.minWidth.replace(/^[-\.\d]+/, "") || "%";

          if (units !== "%") {
            var dashboardSize = widgetElm.closest(".dashboard-widget-area").width();
            var minWidthPx = parseFloat(widget.containerStyle.minWidth);
            var widthUnits = widget.widthUnits;
            var minWidthPercent = parseFloat(widget.containerStyle.minWidth) / dashboardSize * 100;

            if (widgetElm.width() < minWidthPx) {
              var newWidth;
              if (widthUnits === "%") {
                newWidth = minWidthPercent;
              } else {
                newWidth = minWidthPx;
              }
              widget.setWidth(newWidth, widthUnits);
            }
          }

          $scope.$broadcast("widgetResized", {
            widthPx: widgetElm.width()
          });
        });
      });
    }
  }
]);