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

Ext.oa.VolumeField = Ext.extend(Ext.form.ComboBox, {
  filesystem__isnull: false,
  initComponent: function(){
    "use strict";
    var baseParams = {
      "field": "name",
      "query": ""
    };

    if( this.filesystem__isnull === false ){
      baseParams.kwds = {"__exclude__": {"filesystem":""}};
    }

    if( this.filesystem__isnull === true ){
      baseParams.kwds = {"filesystem":""};
    }

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: gettext('Volume'),
      hiddenName: "volume",
      store: new Ext.data.DirectStore({
        fields: ["id", "name"],
        directFn: lvm__LogicalVolume.filter_combo,
        paramOrder: ["field", "query", "kwds"],
        baseParams: baseParams
      }),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      allowBlank:    false,
      selectOnFocus: true,
      forceSelection: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'volfield'
    }));
    Ext.oa.VolumeField.superclass.initComponent.apply(this, arguments);
  },

  setValue: function(value){
    "use strict";
    // Make sure the store is loaded before trying to display stuff.
    if( !this.store.data.length ){
      var self = this;
      this.store.load({
        callback: function(){
          Ext.oa.VolumeField.superclass.setValue.apply(self, [value]);
        }
      });
    }
    else{
      Ext.oa.VolumeField.superclass.setValue.apply(this, arguments);
    }
  }
});

Ext.reg("volumefield", Ext.oa.VolumeField);

// kate: space-indent on; indent-width 2; replace-tabs on;

