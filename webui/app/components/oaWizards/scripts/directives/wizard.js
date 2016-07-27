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

var app = angular.module("openattic.oaWizards");
app.directive("wizard", function () {
  return {
    restrict: "E",
    transclude: true,
    replace: true,
    templateUrl: "components/oaWizards/templates/wizard.html",
    link: function (scope, elem) {
      var rawTabs = elem.find(".tab-pane");
      var tabs = [];

      for (var i = 0; i < rawTabs.length; i++) {
        tabs.push({
          index: i + 1,
          title: rawTabs[i].title
        });
      }

      scope.tabs = tabs;
    },
    controller: function ($scope, VolumeService, CifsSharesService, NfsSharesService, LunService, SizeParserService) {
      $scope.activeTab = 1;
      $scope.isActiveTab = function (index) {
        return $scope.activeTab === index;
      };
      $scope.isPrevTab = function (index) {
        return index < $scope.activeTab;
      };
      $scope.isNextTab = function (index) {
        return index > $scope.activeTab;
      };
      $scope.nextTab = function () {
        var currentForm = $scope["contentForm" + $scope.activeTab];
        currentForm.submitted = true;
        currentForm.$submitted = true;
        if (currentForm.$valid) {
          if ($scope.activeTab < $scope.tabs.length) {
            $scope.activeTab++;
          } else if ($scope.activeTab === $scope.tabs.length) {
            var volume = $.extend({}, $scope.input.volume);
            volume.megs = SizeParserService.parseInt($scope.input.volume.megs);
            VolumeService.save(volume)
                .$promise
                .then(function (res) {
                  if ("cifs" in $scope.input && "nfs" in $scope.input) {
                    if ($scope.input.cifs.create) {
                      $scope.input.cifs.volume = {"id": res.id};
                      $scope.input.cifs.path = res.path;
                      CifsSharesService.save($scope.input.cifs)
                          .$promise
                          .then(function () {
                          }, function (error) {
                            console.log("An error occured", error);
                          });
                    }

                    if ($scope.input.nfs.create) {
                      $scope.input.nfs.volume = {"id": res.id};
                      $scope.input.nfs.path = res.path;
                      NfsSharesService.save($scope.input.nfs)
                          .$promise
                          .then(function () {
                          }, function (error) {
                            console.log("An error occured", error);
                          });
                    }
                  } else if ("iscsi_fc" in $scope.input) {
                    if ($scope.input.iscsi_fc.create) {
                      $scope.input.iscsi_fc.volume = {id: res.id};
                      LunService.save($scope.input.iscsi_fc)
                          .$promise
                          .then(function () {
                          }, function (error) {
                            console.log("An error occured", error);
                          });
                    }
                  }
                })
                .catch(function (error) {
                  console.log("An error occured", error);
                })
                .then(function () {
                  $scope.selectSelector();
                });
          }
        }
      };
      $scope.previousTab = function () {
        if ($scope.activeTab > 1) {
          $scope.activeTab--;
        }
      };
      $scope.setTab = function (index) {
        if (index <= $scope.activeTab) {
          $scope.activeTab = index;
        }
      };
      $scope.disabledPrev = function () {
        return $scope.activeTab === 1;
      };
      $scope.nextBtnText = function () {
        var btnText = "Next";

        if ($scope.activeTab === $scope.tabs.length) {
          btnText = "Done";
        }

        return btnText;
      };
      $scope.getWizardItemsClass = function () {
        return "wizard-nav-items-" + $scope.tabs.length;
      };
    }
  };
});
