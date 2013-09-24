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

Ext.define('Ext.oa.SysUtils__Service_Panel', {

  extend: 'Ext.grid.GridPanel',
  alias: "widget.sysutils__service_panel",
  initComponent: function(){
    var sysUtilsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "sysutils__service_panel_inst",
      title: gettext('Service State'),

      store: (function(){
        Ext.define('sysutils_initscript_all_model', {
          extend: 'Ext.data.Model',
          fields: ['id', 'name', 'status']
        });
        return Ext.create('Ext.data.Store', {
          model: "sysutils_initscript_all_model",
          proxy: {
            type: 'direct',
            directFn: sysutils__InitScript.all_with_status
          },
          autoLoad: true
        });
        store.setDefaultSort("name");
      }()),
      forceFit: true,
      columns: [{
        header: gettext('Service Name'),
        dataIndex: "name"
      }, {
        header: gettext('Status'),
        width: 50,
        align: "center",
        dataIndex: "status",
        renderer: function( val, x, store ){
          if( val === 0 ){
            return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-high.png" title="running" />';
          }
          else if( val === 3 ){
            return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-low.png" title="stopped" />';
          }
          else if(val === null ){
            return  '<img src="{{ MEDIA_URL }}/oxygen/16x16/categories/system-help.png" title="not configured" />';
          }
          else{
            return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-medium.png" title="failure" />';
          }
        }
      }],
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          sysUtilsGrid.store.load();
        }
      }, {
        text: 'Start',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
          sysutils__InitScript.start(sel.data.id, function(provider, response){
            sysUtilsGrid.store.load();
          });
        }
        }
      },{
        text: 'Stop',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
          sysutils__InitScript.stop(sel.data.id, function(provider, response){
            sysUtilsGrid.store.load();
          });
        }
        }
      }]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
    this.store.load();
  }
});


Ext.oa.SysUtils__Service_Module = {
  panel: "sysutils__service_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Service State'),
      leaf: true,
      icon: '{{ MEDIA_URL }}/icons2/22x22/status/network-receive.png',
      panel: "sysutils__service_panel_inst",
      href: '#'
    });
    tree.appendToRootNodeById("menu_shutdown", {
      text: gettext('Reboot'),
      id: 'menu_reboot',
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-reboot.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.YellowDangerousMessage.confirm(
            "Reboot",
            gettext('Do you really want to reboot openATTIC?'),
            function(btn, text){
              if( btn === 'yes' ){
                sysutils__System.reboot( function(provider, response){
                  Ext.oa.YellowDangerousMessage.alert("Rebooting", "The system is rebooting.");
                } );
              }
            } );
        }
      },
      href: '#'
    });
    tree.appendToRootNodeById("menu_shutdown", {
      text: gettext('Shutdown'),
      id: 'menu_shutdown',
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-shutdown.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.RedDangerousMessage.confirm(
            "Shutdown",
            gettext('Do you really want to shutdown openATTIC?'),
            function(btn, text){
              if( btn === 'yes' ){
                sysutils__System.shutdown( function(provider, response){
                  Ext.oa.RedDangerousMessage.alert("Shutting down", "The system is shutting down.");
                } );
              }
            });
        }
      },
      href: '#'
    });
  }
};


window.MainViewModules.push( Ext.oa.SysUtils__Service_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
