angular.module('openattic.sizeparser', [])
  .factory('SizeParserService', function () {
    var mult = ['M', 'G', 'T', 'P', 'E'];

    var _parseInt = function(value){
      // If it's a plain number, just parseInt() it
      if( /^[\d.]+$/.test(value) ){
        return parseInt(parseFloat(value), 10);
      }

      // If it's a valid size string, calc its int value
      var facs = mult.join('');
      var rgx  = new RegExp( '^([\\d.]+)([' + facs + ']?)(i?)(B?)$' );

      if( rgx.test(value) ){
        var matched = rgx.exec(value);
        return parseInt( parseFloat(matched[1], 10) * Math.pow(1024, mult.indexOf(matched[2])), 10 );
      }

      // It didn't parse...
      return null;
    };

    var _isValid = function(value){
      return _parseInt(value) !== null;
    };

    return {
      parseInt: _parseInt,
      isValid:  _isValid
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
