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


Ext.define("Ext.oa.DangerousMessage", {
  extend: "Ext.window.MessageBox",
  maskCssClass: "",
  onShow: function(){
    this.callParent(arguments);
    this.getMaskTarget().unmask();
    var mask = Ext.getBody().mask();
    mask.addClass(this.maskCssClass);
    this.on("hide", function(){
      Ext.getBody().unmask();
    });
  }
});

Ext.oa.RedDangerousMessage = new Ext.oa.DangerousMessage({ maskCssClass: "redmask" });

Ext.oa.YellowDangerousMessage = new Ext.oa.DangerousMessage({ maskCssClass: "yellowmask" });

// kate: space-indent on; indent-width 2; replace-tabs on;
