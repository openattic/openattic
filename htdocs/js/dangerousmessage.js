/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.oa.DangerousMessage = function(color){
  // http://www.sencha.com/forum/showthread.php?7613-Ext.MessageBox-extend-class&p=46792&viewfull=1#post46792
  var f = function(){};
  f.prototype = Ext.MessageBox;
  var o = Ext.extend(f, {
    getDialog: function() {
      var d = o.superclass.getDialog.apply(this, arguments);
      d.mask.addClass(color);
      d.on("hide", function(){
        d.mask.removeClass(color);
      });
      return d;
    }
  });
  return new o();
};
Ext.oa.RedDangerousMessage = Ext.oa.DangerousMessage("redmask");

Ext.oa.YellowDangerousMessage = Ext.oa.DangerousMessage("yellowmask");

// kate: space-indent on; indent-width 2; replace-tabs on;
