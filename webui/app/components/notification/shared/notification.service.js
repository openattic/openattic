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

import globalConfig from "globalConfig";
import _ from "lodash";

/**
 * Notification class used as UI presentational widget to show API errors.
 * @param {Object} config configuration object with properties
 * @property {Object} toastyOptions toasty compatible options, used when creating a toasty
 * @property {string} type toasty type
 * @property {string} type type of the notification
 */
export default class Notification {
  constructor ($rootScope, toasty, TWDEFAULTS, $localStorage) {
    this.$rootScope = $rootScope;
    this.$localStorage = $localStorage;
    this.TWDEFAULTS = TWDEFAULTS;
    this.toasty = toasty;

    /**
     * Array with the last shown notifications
     */
    if (!$localStorage.notifications) {
      $localStorage.notifications = [];
    }
    this.recent = $localStorage.notifications;

    /**
     * Method to be called when there is a new notification
     */
    this.notify = null;

    /*
     * Creates the different notification types.
     */
    _.forIn(TWDEFAULTS, (value, key) => {
      if (["default", "options"].indexOf(key) > -1) {
        return;
      }
      this[key] = (opts, error) => {
        let options = Object.assign({}, opts, {
          type: value,
          timeout: globalConfig.GUI.defaultNotificationTimes[key]
        });
        return this.show(options, error);
      };
    });

  }

  /**
   * Method used for subscribing to notifications
   * @param {method} callback the method to be called
   */
  subscribe (callback) {
    this.notify = callback;
    this.notify(this.recent);
  }

  /**
   * Method used to remove all current saved notifications
   */
  removeAll () {
    this.recent = [];
    this.$localStorage.notifications = [];
    this.notify(this.recent);
  }

  /**
   * Method used for saving a shown notification (check show() method).
   * @param {Object} notification
   */
  save (notification) {
    /* string representation of the Date object so it can be directly compared
    with the timestamps parsed from localStorage */
    notification.timestamp = (new Date()).toJSON();

    this.recent.push(notification);
    while (this.recent.length > 10) {
      this.recent.shift();
    }

    this.$localStorage.notifications = this.recent;

    if (this.notify) {
      this.notify(this.recent);
    }
  }

  /**
   * Method showing (displaying) the notification.
   * If second argument is provided, its cancel method will be called.
   * @param {Object} opts configuration object with properties
   *   @property {Object} toastyOptions toasty compatible options, used when creating a toasty
   *   @property {string} type toasty type
   *   @property {string} type type of the notification
   *   @property {number} delay time in seconds to be applied in the timeout
   * @param  {Object} error object whose default notification we want to cancel
   * @return {number} A number representing the ID value of the timeout that is set
   */
  show (opts, error) {
    if (error && error.preventDefault) {
      error.preventDefault();
    }
    let delay = opts.delay || 5;
    let options = Object.assign({}, this.TWDEFAULTS.options, this.options, opts);
    let timeoutID = setTimeout(() => {
      if (_.isUndefined(options.timeout)) {
        options.timeout = globalConfig.GUI.defaultNotificationTimes[options.type];
      }
      this.save(options);
      this.$rootScope.$apply(() => {
        this.toasty[options.type](options);
      });
    }, delay);
    return timeoutID;
  }

  /**
   * Method preventing notification from being shown (displayed)
   * @param {Number} timeoutID A number representing the ID of the timeout to be canceled
   * @return {Notification} current Notification instance
   */
  cancel (timeoutID) {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    return this;
  }

}
