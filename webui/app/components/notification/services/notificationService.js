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

var app = angular.module("openattic.notification");

app.value("TWDEFAULTS", {
  default: "default",
  info: "info",
  wait: "wait",
  success: "success",
  error: "error",
  warning: "warning",
  options: {
    title: "",
    msg: "",
    type: "error"
  }
});

app.factory("Notification", function ($timeout, toasty, TWDEFAULTS) {
  /**
   * Notification class used as UI presentational widget to show API errors.
   * @param {Object} config configuration object with properties
   * @property {Object} toastyOptions toasty compatible options, used when creating a toasty
   * @property {string} type toasty type
   * @property {string} type type of the notification
   * @return {Notification}       current Notification instance
   */
  var Notification = function (config) {
    this.delayPromise = undefined;
    this.delay = 5;
    this.options = angular.extend({}, TWDEFAULTS.options, config);
    return this;
  };

  /**
   * Method used for setting/resetting the delay (check show() method).
   * @param {number} delay the delay to be used (in milliseconds). Defaults to 0 (non-cancelable notifications)
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.setDelay = function (delay) {
    this.delay = delay;
    return this;
  };

  /**
   * Method showing (displaying) the notification.
   * If second argument is provided, its cancel method will be called.
   * @param {Object} opts configuration object with properties
   *   @property {Object} toastyOptions toasty compatible options, used when creating a toasty
   *   @property {string} type toasty type
   *   @property {string} type type of the notification
   * @param  {Object} error object whose default notification we want to cancel
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.show = function (opts, error) {
    if (error && error.preventDefault) {
      error.preventDefault();
    }
    if (angular.isUndefined(this.delay) || this.delay < 5) {
      this.setDelay(5);
    }
    var options = angular.extend({}, TWDEFAULTS.options, this.options, opts);
    this.delayPromise = $timeout(function () {
      toasty[options.type](options);
      if (angular.isObject(error)) {
        throw error;
      }
    }, this.delay);
    return this;
  };

  /**
   * Method preventing notification from being shown (displayed)
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.cancel = function () {
    if (this.delayPromise) {
      $timeout.cancel(this.delayPromise);
      this.delay = 0;
    }
    return this;
  };

  Notification.show = function (opts, error) {
    return Notification.prototype.show.call(Notification.prototype, opts, error);
  };

  /*
   * Creates the different notification types.
   */
  angular.forEach(TWDEFAULTS, function (key) {
    if (["default", "options"].indexOf(key) > -1) {
      return;
    }
    Notification[key] = function (opts, error) {
      var options = angular.extend({}, opts, {
          type: TWDEFAULTS[key],
          timeout: globalConfig.GUI.defaultNotificationTimes[key]
        });
      return Notification.prototype.show.call(Notification.prototype, options, error);
    };
  });

  return Notification;
});
