angular.module('openattic.datatable')
    .service('FilterService', function ($http) {
      var self = this;
      self._api_action = "";
      self._search = "";
      self._sortfield = "";
      self._sortorder = "ASC";
      self._frompage = 0;
      self._pagelen = 10;
      self._firstfn = function () {
      };
      self._successfn = function () {
      };
      self._errorfn = function () {
      };
      self._finallyfn = function () {
      };

      self.api_action = function (api_action) {
        self._api_action = api_action;
        return self;
      }

      self.filter = function (search) {
        self._search = search;
        return self;
      }

      self.paginate = function (frompage, pagelen) {
        self._frompage = frompage;
        self._pagelen = pagelen;
        return self;
      }

      self.sortByField = function (field, direction) {
        self._sortfield = field;
        self._sortorder = direction || "ASC";
        return self;
      }

      self.first = function (firstfn) {
        self._firstfn = firstfn;
        return self;
      }

      self.then = function (successfn, errorfn) {
        self._successfn = successfn;
        return self;
      }

      self.else_ = function (errorfn) {
        self._errorfn = errorfn;
        return self;
      }

      self.finally_ = function (finallyfn) {
        self._finallyfn = finallyfn;
        return self;
      }

      self.go = function () {
        var _firstfn = self._firstfn;
        var _call_firstfn = function () {
          return _firstfn();
        }

        var _finallyfn = self._finallyfn;
        var _call_finallyfn = function () {
          return _finallyfn();
        }

        var _successfn = self._successfn;
        var _call_successfn = function () {
          var ret = _successfn.apply(this, arguments);
          _call_finallyfn();
          return ret;
        }

        var _errorfn = self._errorfn;
        var _call_errorfn = function () {
          var ret = _errorfn.apply(this, arguments);
          _call_finallyfn();
          return ret;
        }

        if (!self._sortfield) {
          _call_errorfn("define the sort order first by calling .sortByField");
          return;
        }
        _call_firstfn();
        return $http({
          "url": self._api_action,
          "method": "GET",
          "params": {
            page: self._frompage + 1,
            page_size: self._pagelen,
            search: self._search,
            ordering: (self._sortorder == "ASC" ? "" : "-") + self._sortfield
          }
        }).then(_call_successfn, _call_errorfn);
      }

    });

