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
Ext.define('Ext.oa.Settings_Panel',{

  alias: 'widget.settings_panel',
  extend: 'Ext.Panel',
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "settings_panel_inst",
      title: gettext('Personal Settings'),
      width:700,
      height:300,
      bodyStyle: 'padding:10px;',     // lazy inline style
      layout: 'anchor',
      defaults: {
        labelWidth: 300
      },
      reader: new Ext.data.JsonReader({fields: ['LV_test', 'id']}),
      items: [ {
        xtype: "checkbox",
        fieldLabel: gettext('Auto-expand root nodes'),
        width: 80,
        checked: Ext.state.Manager.get("expand_root_nodes", true),
        listeners: {
          check: function( self, checked ){
            Ext.state.Manager.set("expand_root_nodes", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: gettext('Show hints'),
        checked: Ext.state.Manager.get("form_tooltip_show", true),
        listeners: {
          check: function( self, checked){
            Ext.state.Manager.set("form_tooltip_show", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: gettext('Allow installation/deletion'),
        checked: Ext.state.Manager.get("pkgapt_distupgrade", true),
        listeners: {
          check: function(self, checked){
            Ext.state.Manager.set("pkgapt_distupgrade", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: gettext('Enable gradients in graphs'),
        checked: Ext.state.Manager.get("nagios_graph_grad", false),
        listeners:{
          check: function(self, checked){
            Ext.state.Manager.set("nagios_graph_grad", checked);
          }
        }
      },{
        xtype: "checkbox",
        fieldLabel: gettext('Catch F5 and reload the current panel only'),
        checked: Ext.state.Manager.get("catch_f5", false),
        listeners:{
          check: function(self, checked){
            Ext.state.Manager.set("catch_f5", checked);
          }
        }
      },{
        xtype: 'radiogroup',
        fieldLabel: 'Theme',
        id: 'theme',
        columns: 1,
        listeners:{
          change: function(self, checked){
            if(checked.inputValue === "default"){
              Ext.state.Manager.clear("theme");
            }
            else{
              Ext.state.Manager.set("theme", checked.theme);
            }
            // For some reason, window.location.reload.defer() does not work in chrome.
            setTimeout( function(){ window.location.reload(); }, 200);
          }
        },
        items: [
          { name: 'theme', boxLabel: 'Access',  inputValue: "access",  checked: (Ext.state.Manager.get("theme", "default") == "access" ) },
          { name: 'theme', boxLabel: 'Gray',    inputValue: "gray",    checked: (Ext.state.Manager.get("theme", "default") == "gray"   ) },
          { name: 'theme', boxLabel: 'Default', inputValue: "default", checked: (Ext.state.Manager.get("theme", "default") == "default") }
        ]
      } ]
    }));
    this.callParent(arguments);
  }
});


Ext.oa.Settings_Module = {
  panel: "settings_panel"
};

window.MainViewModules.push( Ext.oa.Settings_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
