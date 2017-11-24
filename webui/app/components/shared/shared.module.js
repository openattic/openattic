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

import OaModuleLoaderService from "./oa-module-loader/oa-module-loader.service";
import OaTabSetService from "./oa-tab-set/oa-tab-set.service";
import equalValidator from "./validators/equalValidator";
import ngRequired from "./required/ng-required.directive";
import oaCephClusterLoader from "./oa-ceph-cluster-loader/oa-ceph-cluster-loader.component";
import oaDeleteConfirmationModal from "./oa-delete-confirmation-modal/oa-delete-confirmation-modal.component";
import oaErrorPanel from "./oa-error-panel/oa-error-panel.component";
import oaHelper from "./oa-helper/oa-helper.component";
import oaLoadingPanel from "./oa-loading-panel/oa-loading-panel.component";
import oaModuleLoader from "./oa-module-loader/oa-module-loader.component";
import oaPasswordButton from "./oa-password-button/oa-password-button.directive";
import oaSubmitButton from "./oa-submit-button/oa-submit-button.component";
import oaTabSet from "./oa-tab-set/oa-tab-set.component";
import required from "./required/required.directive";
import validIqn from "./validators/iqn.validator";
import serviceState from "./filters/service-state.filter";
import OaApiFilter from "./oa-api-filter/oa-api-filter.service";

angular
  .module("openattic.shared", [])
  .component("oaCephClusterLoader", oaCephClusterLoader)
  .component("oaDeleteConfirmationModal", oaDeleteConfirmationModal)
  .component("oaErrorPanel", oaErrorPanel)
  .component("oaHelper", oaHelper)
  .component("oaLoadingPanel", oaLoadingPanel)
  .component("oaModuleLoader", oaModuleLoader)
  .component("oaSubmitButton", oaSubmitButton)
  .component("oaTabSet", oaTabSet)
  .directive("equalValidator", equalValidator)
  .directive("ngRequired", ngRequired)
  .directive("oaPasswordButton", oaPasswordButton)
  .directive("required", required)
  .directive("validIqn", validIqn)
  .filter("serviceState", serviceState)
  .service("oaApiFilter", OaApiFilter)
  .service("oaModuleLoaderService", OaModuleLoaderService)
  .service("oaTabSetService", OaTabSetService);

require("./oadatatable/actions.directive");
require("./oadatatable/additional-actions.directive");
require("./oadatatable/checklist-model.directive");
require("./oadatatable/oadatatable.directive");
require("./oadatatable/paginator.directive");
require("./oadatatable/showhidecolumns.directive");
require("./oadatatable/sortfield.directive");
require("./oadatatable/sortheaderclass.directive");
