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

import UsersService from "./shared/users.service";
import usersAuthTokenModalComponent from "./users-auth-token-modal/users-auth-token-modal.component";
import usersDeleteModalComponent from "./users-delete-modal/users-delete-modal.component";
import usersFormComponent from "./users-form/users-form.component";
import usersListComponent from "./users-list/users-list.component";
import usersRoutes from "./users.routes";

angular.module("openattic.users", [])
  .component("usersAuthTokenModalComponent", usersAuthTokenModalComponent)
  .component("usersDeleteModalComponent", usersDeleteModalComponent)
  .component("usersFormComponent", usersFormComponent)
  .component("usersListComponent", usersListComponent)
  .service("usersService", UsersService)
  .config(usersRoutes);
