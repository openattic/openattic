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

var app = angular.module("openattic");
app.controller("HostFormCtrl", function ($scope, $state, $stateParams, HostService, InitiatorService, $q) {

  $scope.changes = [];
  $scope.data = {};
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
        link: "https://en.wikipedia.org/wiki/ISCSI#Addressing'>More information",
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
        link: "https://en.wikipedia.org/wiki/ISCSI#Addressing'>More information",
        notation: "naa.${16 or 32 characters long hexadecimal number}"
      }
    },
    exists: "The WWN already exists, choose another one."
  };

  var goToListView = function () {
    $state.go("hosts");
  };

  InitiatorService.get()
    .$promise
    .then(function (res) {
      $scope.wwns = [];
      res.results.forEach(function (share) {
        $scope.wwns.push(share.wwn);
      });
    }, function (error) {
      console.log("An error occurred", error);
    });

  $scope.loadInitiators = function () {
    $scope.data.iscsi = [];
    $scope.data.qla2xxx = [];
    InitiatorService.get({host: $stateParams.host})
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
        console.log("An error occurred", error);
      });
  };

  if (!$stateParams.host) {
    $scope.host = {};
    $scope.editing = false;

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === true) {
        HostService.save($scope.host)
            .$promise
            .then(function (res) {
              $scope.host = res;
              $scope.saveShares();
            }, function (error) {
              console.log("An error occured", error);
            });
      }
    };
  } else {
    $scope.editing = true;
    $scope.data = {
      peerHostUrl: "",
      iscsiIqn: "",
      fcWwn: ""
    };

    HostService.get({id: $stateParams.host})
        .$promise
        .then(function (res) {
          $scope.host = res;
        }, function (error) {
          console.log("An error occurred", error);
        });

    $scope.loadInitiators();

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === false) {
        return;
      }
      var requests = [];
      if ($scope.iscsi && $scope.iscsi.check === false) {
        $scope.data.iscsi.forEach(function (wwn) {
          $scope.rmIni(wwn);
        });
      }
      if ($scope.fc && $scope.fc.check === false) {
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
              $scope.saveShares();
            }, function (error) {
              console.log("An error occured", error);
            });
      }, function (error) {
        $scope.loadInitiators();
        console.log("An error occured", error);
      });
    };
  }

  Object.keys($scope.wwn).forEach(function(type){
    $scope.$watchCollection("wwn." + type + ".text", function (text) {
      if (text.length === 0) {
        $scope.wwn[type].valid = true;
      }
    });
  });

  $scope.saveShares = function () {
    var requests = [];
    var creates = $scope.changes.filter(function (change) {
      return change.type !== "delete";
    });
    creates.forEach(function (change) {
      var deferred = $q.defer();
      InitiatorService.save({
        "wwn": change.tag.text,
        "type": change.type,
        "host": {"id": $scope.host.id}
      }, deferred.resolve, deferred.reject);
      requests.push(deferred.promise);
    });
    $q.all(requests).then(function () {
      goToListView();
    }, function (error) {
      $scope.loadInitiators();
      console.log("An error occured", error);
    });
  };

  $scope.cancelAction = function () {
    goToListView();
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
    if (wwn.match(/^[a-fA-F0-9:]*$/)) {
      wwn = wwn.replace(/:/g, "");
      if (wwn.length === 16) {
        tag.text = wwn.match(/.{2}/g).join(":");
        return tag;
      }
      return "mac";
    } else if (wwn.indexOf("iqn") === 0 && type === "iscsi") {
      if (wwn.match(/^iqn\.\d{4}-\d{2}\.\D{2,3}(\.\w+)+(:[A-Za-z0-9-_\.]+)*$/)) {
        return tag;
      }
      return "iqn";
    } else if (wwn.indexOf("eui") === 0) {
      if (wwn.match(/^eui\.[0-9A-Fa-f]{16}$/)) {
        return tag;
      }
      return "eui";
    } else if (wwn.indexOf("naa.") === 0) {
      var ident = wwn.substr(4);
      if (ident.match(/^[0-9A-Fa-f]+$/) && (ident.length === 32 || ident.length === 16)) {
        return tag;
      }
      return "naa";
    }
    return "all";
  };

  $scope.addIni = function (tag, type) {
    tag = $scope.wwn[type].current ;
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

});
