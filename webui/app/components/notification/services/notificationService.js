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

var app = angular.module("openattic.notification");

app.constant('TWDEFAULTS', function() {
    var TOASTY_TYPES = {
        default: 'default',
        info: 'info',
        wait: 'wait',
        success: 'success',
        error: 'error',
        warning: 'warning',
      };

    return {
      options: {
        title: '',
        msg: '',
        type: TOASTY_TYPES.error
      }
    };
  }());

app.factory("Notification", function ($timeout, toasty, TWDEFAULTS) {
  /**
   * Notification class used as UI presentational widget to show api errors.
   * @param {Object} config configuration object with properties
   * @property {Object} toastyOptions toasty compatible options, used when creating a tosty
   * @property {string} type toasty type
   * @property {string} type type of the notification
   * @return {Notification}       current Notification instance
   */
  var Notification = function(config) {
    this.delayPromise = undefined;
    this.delay = 0;
    this.options = angular.extend({}, TWDEFAULTS.options, config);
    return this;
  };

  /**
   * Method used for setting/resetting the delay (check show() method).
   * Allows creation (if called with positive value) of cancelable notifications.
   * @param {number} delay the delay to be used (in milliseconds). Defaults to 0 (non-cancelable notifications)
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.setDelay = function(delay) {
    this.delay = delay || 0;
    return this;
  };

  /**
   * Converts the notification to a cancelable notification.
   * Cancelable notifications are notifications whose displaying gets delayed when their show() method is called.
   * Instant notification (displayed as soon as its show method gets called):
   *   new Notification({...}).show(); // gets displayed instantly
   * Cancelable notification (displayed with provided or default milliseconds delay counting from when its show method gets called):
   *   var notification = new Notification({...}).toCancelable().show();
   *   // gets displayed in <delay> milliseconds from now (unless notification.cancel() is called before <delay> passes)
   * @param  {number|void} delay in number of milliseconds. Defaults to DEFAULT_SHOW_DELAY
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.toCancelable = function(delay) {
    var DEFAULT_SHOW_DELAY = 100;
    return this.setDelay(delay || DEFAULT_SHOW_DELAY);
  };

  Notification.prototype.__show__ = function(opts, cancelableError) {
    toasty[opts.type](opts);
    if (cancelableError && cancelableError.preventDefault) {
      cancelableError.preventDefault();
    }
  }

  /**
   * Metnod showing (displaying) the notification.
   * @return {Notification}       current Notification instance
   */
  /**
   * Metnod showing (displaying) the notification.
   * If second argument is provided, its cancel method will be called.
   * @param {Object} opts configuration object with properties
   *   @property {Object} toastyOptions toasty compatible options, used when creating a tosty
   *   @property {string} type toasty type
   *   @property {string} type type of the notification
   * @param  {Object} cancelableError error object whose default notification we want to cancel
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.show = function(opts, cancelableError) {
    var self = this,
      options = angular.extend({}, TWDEFAULTS.options, this.options || {}, opts || {});
    if (this.delay > 0) {
      this.delayPromise = $timeout(function() {
        self.__show__(options, cancelableError);
      }, this.delay);
    } else {
      self.__show__(options, cancelableError);
    }
    return this;
  };

  /**
   * Method preventing notification from beeing shown (displayed).
   * It makes sence calling it only for cancelable notifications, otherwise its just a void method. 
   * @return {Notification}       current Notification instance
   */
  Notification.prototype.cancel = function() {
    if (this.delayPromise) {
      $timeout.cancel(this.delayPromise);
      this.delay = 0;
    }
    return this;
  };

  Notification.show = function(opts, cancelableError) {
    return Notification.prototype.show.call(Notification.prototype, opts, cancelableError);
  };

  Notification.info = function(opts, cancelableError) {
    var options = angular.extend({}, opts || {}, { type: TWDEFAULTS.info });
    return Notification.prototype.show.call(Notification.prototype, options, cancelableError);
  };

  Notification.wait = function(opts, cancelableError) {
    var options = angular.extend({}, opts || {}, { type: TWDEFAULTS.wait });
    return Notification.prototype.show.call(Notification.prototype, options, cancelableError);
  };

  Notification.success = function(opts, cancelableError) {
    var options = angular.extend({}, opts || {}, { type: TWDEFAULTS.success });
    return Notification.prototype.show.call(Notification.prototype, options, cancelableError);
  };
  
  Notification.error = function(opts, cancelableError) {
    var options = angular.extend({}, opts || {}, { type: TWDEFAULTS.error });
    return Notification.prototype.show.call(Notification.prototype, options, cancelableError);
  };
  
  Notification.warning = function(opts, cancelableError) {
    var options = angular.extend({}, opts || {}, { type: TWDEFAULTS.warning });
    return Notification.prototype.show.call(Notification.prototype, options, cancelableError);
  };

  return Notification;
});