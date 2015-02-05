'use strict';

// TODO: Temp Hack, fix grunt
angular.module('openattic.datatree', []);
angular.module('openattic.datatable', []);

angular.module('openattic', ['ngResource', 'ui.router', 'openattic.datatable', 'openattic.datatree']);
