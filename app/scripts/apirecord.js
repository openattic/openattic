angular.module('openattic')
  .config(function($provide, $httpProvider){
    $provide.factory('apiRecordHttpInterceptor', function() {
      return {
        // optional method
        'request': function(config) {
          // do something on success
          if(config.method != "GET"){
            console.log(arguments);
          }
          return config;
        },
      };
    });

    $httpProvider.interceptors.push('apiRecordHttpInterceptor');
  });

function recordtest(){
  var dataz = [{
      "transformRequest" : [
         null
      ],
      "headers" : {
         "X-CSRFToken" : "Gz5vEVfTipBI33jXLwIraeSz91EwAjbw",
         "Content-Type" : "application/json;charset=utf-8",
         "Accept" : "application/json, text/plain, */*"
      },
      "url" : "/openattic/api/volumes",
      "data" : {
         "megs" : 1000,
         "name" : "interceptest2",
         "source_pool" : {
            "id" : 1,
         }
      },
      "method" : "POST",
      "transformResponse" : [
         null
      ]
   }]

  var script = [
    '#!/usr/bin/env python',
    'import requests',
    'host = "' + window.location.protocol + '//' + window.location.hostname + '"',
    'auth = ("username", "password")'
  ]
  var i;
  for(i = 0; i < dataz.length; i++){
    script.push('requests.' + dataz[i].method.toLowerCase() + '(host + "' + dataz[i].url + '", {"auth": auth, "data": ' + angular.toJson(dataz[i].data) + '})')
  }
  return script.join('\n');
}


// kate: space-indent on; indent-width 2; replace-tabs on;
