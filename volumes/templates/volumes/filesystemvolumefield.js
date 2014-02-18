/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.FileSystemVolumeField', {
  alias: 'widget.filesystemvolumefield',
  extend: 'Ext.form.ComboBox',
  filesystem__isnull: false,
  initComponent: function(){
    var extraParams = {
      "field": "name",
      "query": "",
      "kwds":  {}
    };

    if( typeof this.extraParams !== "undefined" ){
        if( typeof this.extraParams.kwds !== "undefined" ){
            Ext.applyIf(extraParams.kwds, this.extraParams.kwds);
        }
        Ext.applyIf(extraParams, this.extraParams);
    }

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: gettext('Volume'),
      name: "volume",
      store: (function(){
        Ext.define('volumefield_store_model', {
          extend: 'Ext.data.Model',
          fields: [
            {name: 'id'},
            {name: '__unicode__'}
          ]
        });
        return Ext.create('Ext.data.Store', {
          model: "volumefield_store_model",
          proxy: {
            type: 'direct',
            directFn: volumes__FileSystemVolume.filter_combo,
            paramOrder: ["field", "query", "kwds"],
            extraParams: extraParams
          }
        });
      }()),
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
      emptyText:     gettext('Select...'),
      allowBlank:    false,
      selectOnFocus: true,
      forceSelection: true,
      displayField:  '__unicode__',
      valueField:    'id'
    }));
    this.callParent(arguments);
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;

