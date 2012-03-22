{% load i18n %}

{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

Ext.oa.Auth__UserField = Ext.extend(Ext.form.ComboBox, {
  initComponent: function(){
    var baseParams = {
      "field": "username",
      "kwds": {},
      "query": ""
    };

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: "{% trans 'Owner' %}",
      store: (function(){
        var store = new Ext.data.DirectStore({
          fields: ["username", "id"],
          baseParams: { fields: ["username", "id"] },
          directFn: auth__User.all_values
        });
        store.setDefaultSort("username");
        return store;
      }()),
      typeAhead:     true,
      forceSelection: true,
      triggerAction: 'all',
      emptyText:     "{% trans 'Select...' %}",
      selectOnFocus: true,
      displayField:  'username',
      valueField:    'id'
    }));
    Ext.oa.Auth__UserField.superclass.initComponent.apply(this, arguments);
  },

  setValue: function(value){
    // Make sure the store is loaded before trying to display stuff.
    if( !this.store.data.length ){
      var self = this;
      this.store.load({
        callback: function(){
          Ext.oa.Auth__UserField.superclass.setValue.apply(self, [value]);
        }
      });
    }
    else{
      Ext.oa.Auth__UserField.superclass.setValue.apply(this, arguments);
    }
  }
});

Ext.reg("authuserfield", Ext.oa.Auth__UserField);

// kate: space-indent on; indent-width 2; replace-tabs on;

