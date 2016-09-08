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

var app = angular.module("openattic.hosts");
app.directive("hostForm", function () {
  return {
    restrict: "E",
    scope: {
      hostId: "=?",
      stateGoTo: "@",
      config: "=?",
      submit: "=?"
    },
    templateUrl: "components/hosts/templates/host.form.directive.html",
    controller: function ($scope, $state, HostService, InitiatorService, $q, toasty) {
      if (!$scope.config) {
        $scope.config = {
          header: true,
          class: {
            label: "col-sm-3",
            labelOffset: "col-sm-offset-3",
            field: "col-sm-9"
          }
        };
      }
      $scope.changes = [];
      $scope.data = {};
      $scope.host = {};
      $scope.wwn = {
        iscsi: {
          current: {},
          valid: true,
          label: "iSCSI IQN",
          desc: "Use iSCSI for sharing",
          text: ""
        },
        qla2xxx: {
          current: {},
          valid: true,
          label: "FC WWN",
          desc: "Use Fibre Channel for sharing",
          text: ""
        }
      };
      $scope.validationText = {
        format: {
          iqn: {
            desc: "An IQN has the following notation 'iqn.$year-$month.$reversedAddress:$definedName'",
            example: "iqn.2016-06.org.openattic:storage:disk.sn-a8675309",
            link: "https://en.wikipedia.org/wiki/ISCSI#Addressing",
            notation: "iqn.$year-$month.$reversedAddress:$definedName"
          },
          mac: {
            desc: "A MAC is a 64bit long hexadecimal number this means it is 16 characters long. " +
            "You can just type the number and it will be LIO formatted for you or you can type it LIO formatted.",
            example: "1234567890abcdef equal to 12:34:56:78:90:ab:cd:ef",
            link: "https://en.wikipedia.org/wiki/MAC_address#Notational_conventions",
            notation: "16 characters long hexadecimal number"
          },
          eui: {
            desc: "The Extended Unique Identifier (EUI) looks like this 'eui-${64bit hexadecimal number}'.",
            example: "eui.1234567890abcdef",
            link: "https://en.wikipedia.org/wiki/MAC_address#Notational_conventions",
            notation: "eui.${16 characters long hexadecimal number}"
          },
          naa: {
            desc: "The T11 Network Address Authority (NAA) looks like this 'eui-${64bit or 128bit hexadecimal number}'",
            example: "naa.1234567890abcdef or naa.1234567890abcdef1234567890abcdef",
            link: "https://en.wikipedia.org/wiki/ISCSI#Addressing",
            notation: "naa.${16 or 32 characters long hexadecimal number}"
          }
        },
        exists: "The WWN already exists, choose another one."
      };
      $scope.wwns = [];

      $scope.createNewHost = function (hostForm, host, changes, saveShares, goBack) {
        if (hostForm.$valid === true) {
          HostService.save(host)
            .$promise
            .then(function (res) {
              host = res;
              saveShares(changes, host, goBack);
            }, function (error) {
              $scope.errorOccurred(error, "Couldn't save", "Couldn't create new host.");
            });
        }
      };

      $scope.submitNewHost = function (hostForm) {
        $scope.submitted = true;
        $scope.createNewHost(hostForm, $scope.host, $scope.changes, $scope.saveShares, $scope.goBack);
      };

      $scope.amendHost = function (hostForm) {
        $scope.submitted = true;
        if (hostForm.$valid === false) {
          return;
        }
        var requests = [];
        if ($scope.wwn.iscsi && $scope.wwn.iscsi.check === false) {
          $scope.data.iscsi.forEach(function (wwn) {
            $scope.rmIni(wwn);
          });
        }
        if ($scope.wwn.qla2xxx && $scope.wwn.qla2xxx.check === false) {
          $scope.data.qla2xxx.forEach(function (wwn) {
            $scope.rmIni(wwn);
          });
        }

        var deletes = $scope.changes.filter(function (change) {
          return change.type === "delete";
        });
        deletes.forEach(function (change) {
          var deferred = $q.defer();
          InitiatorService.delete({"id": change.tag.id}, deferred.resolve, deferred.reject);
          requests.push(deferred.promise);
        });
        $q.all(requests).then(function () {
          HostService.update({id: $scope.host.id}, $scope.host)
            .$promise
            .then(function () {
              $scope.saveShares($scope.changes, $scope.host, $scope.goBack);
            }, function (error) {
              $scope.errorOccurred(error, "Couldn't save", "Couldn't update host.");
            });
        }, function (error) {
          $scope.errorOccurred(error, "Couldn't save", "Couldn't update host.");
        });
      };

      $scope.errorOccurred = function (error, title, msg) {
        toasty.error({
          title: title,
          msg: msg
        });
        throw error;
      };

      $scope.init = function () {
        InitiatorService.get()
          .$promise
          .then(function (res) {
            res.results.forEach(function (share) {
              $scope.wwns.push(share.wwn);
            });
          }, function (error) {
            $scope.errorOccurred(error, "Loading failure", "Couldn't load WWNs.");
          });

        if (!$scope.hostId) {
          $scope.host = {};
          $scope.editing = false;

          $scope.submitAction = $scope.submitNewHost;
        } else {
          $scope.editing = true;

          HostService.get({id: $scope.hostId})
            .$promise
            .then(function (res) {
              $scope.host = res;
            }, function (error) {
              $scope.errorOccurred(error, "Loading failure", "Couldn't load host.");
            });

          $scope.loadInitiators();

          $scope.submitAction = $scope.amendHost;
        }
      };

      $scope.loadInitiators = function () {
        $scope.data.iscsi = [];
        $scope.data.qla2xxx = [];
        InitiatorService.get({host: $scope.hostId})
          .$promise
          .then(function (res) {
            for (var i = 0; i < res.results.length; i++) {
              if (res.results[i].type === "iscsi") {
                $scope.data.iscsi.push({
                  "text": res.results[i].wwn,
                  "id": res.results[i].id
                });
              } else {
                $scope.data.qla2xxx.push({
                  "text": res.results[i].wwn,
                  "id": res.results[i].id
                });
              }
            }
            if ($scope.data.qla2xxx.length > 0) {
              $scope.wwn.qla2xxx.check = true;
            }
            if ($scope.data.iscsi.length > 0) {
              $scope.wwn.iscsi.check = true;
            }
          }, function (error) {
            $scope.errorOccurred(error, "Loading failure", "Couldn't load WWNs of host.");
          });
      };

      $scope.saveShares = function (changes, host, callback) {
        var requests = [];
        var creates = changes.filter(function (change) {
          return change.type !== "delete";
        });
        creates.forEach(function (change) {
          var deferred = $q.defer();
          InitiatorService.save({
            "wwn": change.tag.text,
            "type": change.type,
            "host": {"id": host.id}
          }, deferred.resolve, deferred.reject);
          requests.push(deferred.promise);
        });
        $q.all(requests).then(function () {
          callback(host);
        }, function (error) {
          $scope.errorOccurred(error, "Couldn't save", "Couldn't create or delete WWNs.");
        });
      };

      $scope.validShareName = function (tag, type) {
        $scope.wwn[type].current = $scope.validWwn(tag, type);
        $scope.wwn[type].valid = typeof $scope.wwn[type].current !== "string";
        if ($scope.wwn[type].valid && $scope.wwns.indexOf(tag.text) !== -1) {
          $scope.wwn[type].current = "exists";
          $scope.wwn[type].valid = false;
        }
        return $scope.wwn[type].valid;
      };

      $scope.validWwn = function (tag, type) {
        var wwn = tag.text;
        if (wwn.match(/^[a-fA-F0-9:]{3}/)) {
          if (wwn.match(/^[a-fA-F0-9:]*$/)) {
            wwn = wwn.replace(/:/g, "");
            if (wwn.length === 16) {
              tag.text = wwn.match(/.{2}/g).join(":");
              return tag;
            }
          }
          return "mac";
        } else if (wwn.indexOf("iqn") === 0 && type === "iscsi") {
          if (wwn.match(/^iqn\.(19|20)\d\d-(0[1-9]|1[0-2])\.\D{2,3}(\.[A-Za-z0-9-]+)+(:[A-Za-z0-9-_\.]+)*$/)) {
            return tag;
          }
          return "iqn";
        } else if (wwn.indexOf("eui") === 0) {
          if (wwn.match(/^eui\.[0-9A-Fa-f]{16}$/)) {
            return tag;
          }
          return "eui";
        } else if (wwn.indexOf("naa") === 0) {
          var ident = wwn.substr(4);
          if (wwn.match(/^naa\.[0-9A-Fa-f]+$/) && (ident.length === 32 || ident.length === 16)) {
            return tag;
          }
          return "naa";
        }
        return "all";
      };

      $scope.addIni = function (tag, type) {
        tag = $scope.wwn[type].current;
        $scope.wwns.push(tag.text);
        $scope.changes.push({
          tag: tag,
          type: type
        });
      };

      $scope.rmIni = function (tag) {
        $scope.wwns.splice($scope.wwns.indexOf(tag.text), 1);
        if (!tag.id) { // New Tag - Can't be deleted by the backend.
          $scope.changes.some(function (change, index) {
            if (change.tag.text === tag.text) {
              $scope.changes.splice(index, 1);
              return true;
            }
          });
          return;
        }
        $scope.changes.push({
          tag: tag,
          type: "delete"
        });
      };

      $scope.goBack = function () {
        $state.go($scope.stateGoTo);
      };
      $scope.init();

      Object.keys($scope.wwn).forEach(function (type) {
        $scope.$watchCollection("wwn." + type + ".text", function (text) {
          if (text.length === 0) {
            $scope.wwn[type].valid = true;
          }
        });
      });

      if ($scope.submit) {
        /* Use it this way to create a new host on your own:
        var submit = $submit;
        submit.createNewHost(submit.hostForm, submit.host, submit.changes, submit.saveShares, submit.goBack)
         */
        $scope.submit.createNewHost = $scope.createNewHost;
        $scope.submit.saveShares = $scope.saveShares;
        $scope.submit.goBack = $scope.goBack;
        $scope.$watchCollection("hostForm", function (hostForm) {
          $scope.submit.hostForm = hostForm;
        });
        $scope.$watchCollection("changes", function (changes) {
          $scope.submit.changes = changes;
        });
        $scope.$watchCollection("host", function (host) {
          $scope.submit.host = host;
        });
        $scope.saveShares($scope.changes, $scope.host.id, $scope.goBack);
      }
    }
  };
});