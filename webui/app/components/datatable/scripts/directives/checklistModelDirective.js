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
/**
 * Checklist-model
 * AngularJS directive for list of checkboxes
 * Downloaded from https://github.com/vitalets/checklist-model
 */

var app = angular.module("openattic.datatable");
app.directive("checklistModel", function ($parse, $compile) {
  // contains
  var contains = function (arr, item) {
    if (angular.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (angular.equals(arr[i], item)) {
          return true;
        }
      }
    }
    return false;
  };

  // add
  var add = function (arr, item) {
    arr = angular.isArray(arr) ? arr : [];
    for (var i = 0; i < arr.length; i++) {
      if (angular.equals(arr[i], item)) {
        return arr;
      }
    }
    arr.push(item);
    return arr;
  };

  // remove
  var remove = function (arr, item) {
    if (angular.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (angular.equals(arr[i], item)) {
          arr.splice(i, 1);
          break;
        }
      }
    }
    return arr;
  };

  // http://stackoverflow.com/a/19228302/1458162
  var postLinkFn = function (scope, elem, attrs) {
    // compile with `ng-model` pointing to `checked`
    $compile(elem)(scope);

    // getter / setter for original model
    var getter = $parse(attrs.checklistModel);
    var setter = getter.assign;

    // value added to list
    var value = $parse(attrs.checklistValue)(scope.$parent);

    // watch UI checked change
    scope.$watch("checked", function (newValue, oldValue) {
      if (newValue === oldValue) {
        return;
      }
      var current = getter(scope.$parent);
      if (newValue === true) {
        setter(scope.$parent, add(current, value));
      } else {
        setter(scope.$parent, remove(current, value));
      }
    });

    // watch original model change
    scope.$parent.$watch(attrs.checklistModel, function (newArr) {
      scope.checked = contains(newArr, value);
    }, true);
  };

  return {
    priority: 1000,
    terminal: true,
    scope: true,
    compile: function (tElement, tAttrs) {
      if (tElement[0].tagName !== "INPUT" || !tElement.attr("type", "checkbox")) {
        throw "checklist-model should be applied to `input[type=\"checkbox\"]`.";
      }

      if (!tAttrs.checklistValue) {
        throw "You should provide `checklist-value`.";
      }

      // exclude recursion
      tElement.removeAttr("checklist-model");

      // local scope var storing individual checkbox model
      tElement.attr("ng-model", "checked");

      return postLinkFn;
    }
  };
});