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
Ext.oa.Settings_Panel = Ext.extend(Ext.Panel,{
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "settings_panel_inst",
      title: 'Personal Settings',
      width:700,
      height:300,
      labelWidth: 250,
      bodyStyle: 'padding:10px;',     // lazy inline style
      layout: 'form',
      reader: new Ext.data.JsonReader({fields: ['LV_test', 'id']}),
      items: [ {
        xtype: "checkbox",
        fieldLabel: "{% trans 'Auto-expand root nodes' %}",
        width: 80,
        checked: Ext.state.Manager.get("expand_root_nodes", true),
        listeners: {
          check: function( self, checked ){
            Ext.state.Manager.set("expand_root_nodes", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: "{% trans 'show hints' %}",
        checked: Ext.state.Manager.get("form_tooltip_show", true),
        listeners: {
          check: function( self, checked){
            Ext.state.Manager.set("form_tooltip_show", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: "{% trans 'Allow installation/deletion' %}",
        checked: Ext.state.Manager.get("pkgapt_distupgrade", true),
        listeners: {
          check: function(self, checked){
            Ext.state.Manager.set("pkgapt_distupgrade", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: "{% trans 'Monitoring graph with radient' %}",
        checked: Ext.state.Manager.get("nagios_graph_grad", false),
        listeners:{
          check: function(self, checked){
            Ext.state.Manager.set("nagios_graph_grad", checked);
          }
        }
      },{
          xtype: "checkbox",
          fieldLabel: "{% trans 'Show graph for storage utilization'%}",
          checked: Ext.state.Manager.get("storage_utilization_graph", false),
          listeners: {
            check: function(self,checked){
              Ext.state.Manager.set("storage_utilization_graph", checked)
            }
         }
      },
      {
        xtype: 'radiogroup',
        value: Ext.state.Manager.get("theme", "default"),
        fieldLabel: 'Theme',
        columns: 1,
        listeners:{
          change: function(self, checked){
            if(checked.inputValue === "default"){
              Ext.state.Manager.clear("theme");
            }
            else{
              Ext.state.Manager.set("theme", checked.inputValue)
            }
            // For some reason, window.location.reload.defer() does not work in chrome.
            setTimeout( function(){window.location.reload()}, 200);
          }
        },
        items: [
          { name: 'theme', boxLabel: 'Access',  inputValue: "access"  },
          { name: 'theme', boxLabel: 'Gray',    inputValue: "gray"    },
          { name: 'theme', boxLabel: 'Default', inputValue: "default" }
        ]
      } ]
    }));
    Ext.oa.Settings_Panel.superclass.initComponent.apply(this, arguments);
  }
});


Ext.reg("settings_panel", Ext.oa.Settings_Panel);

Ext.oa.Settings_Module = Ext.extend(Object, {
  panel: "settings_panel",
  prepareMenuTree: function(tree){
  }
});

window.MainViewModules.push(new Ext.oa.Settings_Module());

// kate: space-indent on; indent-width 2; replace-tabs on;
