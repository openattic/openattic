/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

import _ from "lodash";

export default class CephRgwHelpersService {
  /**
   * Check if the given name is a subuser.
   * @param user The user object.
   * @param name The name to check.
   * @returns {Boolean} Returns TRUE if the specified name is a subuser.
   * @private
   */
  isSubuser (user, name) {
    let result = false;
    if (_.isArray(user.subusers)) {
      _.forEach(user.subusers, (subuser) => {
        if (subuser.id === name) {
          result = true;
        }
      });
    }
    return result;
  }

  /**
   * Build the subuser ID, e.g. 'johndoe:swift'.
   * @param uid The user ID to which the subuser is assigned.
   * @param subuser The subuser name.
   * @returns {string} Returns the subuser ID.
   */
  buildSubuserId (uid, subuser) {
    return (uid === subuser) ? uid : uid + ":" + subuser;
  }

  /**
   * Get the subuser name.
   * Examples:
   *   'johndoe' => 'johndoe'
   *   'janedoe:xyz' => 'xyz'
   * @param value The value to process.
   * @returns {string} Returns the user ID.
   */
  getSubuserName (value) {
    const re = /([^:]+)(:(.+))?/;
    let matches = value.match(re);
    return matches[2] ? matches[3] : matches[1];
  }

  /**
   * Enumerate the user candidates to for the specified key type.
   * @param user The user object.
   * @param keyType The key type, e.g. 's3' or 'swift'.
   * @returns {Array} Returns a list of user identifiers.
   */
  enumKeyUserCandidates (user, keyType) {
    let result = [];
    if (!_.isObjectLike(user)) {
      return result;
    }
    // Get possible users.
    let possible = [];
    // Add the user id for s3.
    if (_.isString(user.user_id) && user.user_id.length &&
      (keyType === "s3")) {
      possible.push(user.user_id);
    }
    user.subusers.forEach((subuser) => {
      if (possible.indexOf(subuser.id) < 0) {
        possible.push(subuser.id);
      }
    });
    // Get already configured users.
    let configured = [];
    let keys = user[(keyType === "s3") ? "keys" : "swift_keys"];
    keys.forEach((key) => {
      configured.push(key.user);
    });
    // Finally get the candidates.
    // Note that you may create multiple S3 key pairs for a user, thus we
    // append already configured users, too.
    possible.forEach((uid) => {
      if ((configured.indexOf(uid) < 0) || (keyType === "s3")) {
        result.push(uid);
      }
    });
    return result;
  }
}
