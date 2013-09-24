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

Ext.define('Ext.oa.Auth__UserField', {
  alias: 'widget.auth__userfield',
  extend :'Ext.form.ComboBox',
  initComponent: function(){
    var extraParams = {
      "field": "username",
      "kwds": {},
      "query": ""
    };

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: gettext('Owner'),
      store: (function(){
        Ext.define('rpcd_owner_store', {
          extend: 'Ext.data.Model',
          fields: [
            {name: 'username'},
            {name: 'id'}
          ]
        });
        var store = Ext.create('Ext.data.Store', {
          model: "rpcd_owner_store",
          proxy: {
            type: 'direct',
            directFn: auth__User.all_values,
            paramOrder: ["fields"],
            extraParams: { fields: ["username", "id"] },
          },
          autoLoad: true
        });
        store.setDefaultSort("username");
        return store;
      }()),
      typeAhead:     true,
      forceSelection: true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'username',
      valueField:    'id'
    }));
    this.callParent(arguments);
  }
});

// kate: space-indent on; indent-width 2; replace-tabs on;

