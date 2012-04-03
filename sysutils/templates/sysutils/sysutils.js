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

Ext.oa.SysUtils__Service_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    "use strict";
    var sysUtilsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "sysutils__service_panel_inst",
      title: gettext('Service State'),
      store: (function(){
        var st = new Ext.data.DirectStore({
          fields: ['id', 'name', 'status'],
          directFn: sysutils__InitScript.all_with_status
        });
        st.setDefaultSort("name");
        return st;
      }()),
      viewConfig: { forceFit: true },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
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
        }]
      }),
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          sysUtilsGrid.store.reload();
        }
      }, {
        text: 'Start',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selections.items[0];
          sysutils__InitScript.start(sel.data.id, function(provider, response){
            sysUtilsGrid.store.reload();
          });
        }
        }
      },{
        text: 'Stop',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selections.items[0];
          sysutils__InitScript.stop(sel.data.id, function(provider, response){
            sysUtilsGrid.store.reload();
          });
        }
        }
      }]
    }));
    Ext.oa.SysUtils__Service_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.SysUtils__Service_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("sysutils__service_panel", Ext.oa.SysUtils__Service_Panel);

Ext.oa.SysUtils__Service_Module = Ext.extend(Object, {
  panel: "sysutils__service_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_status", {
      text: gettext('Service State'),
      leaf: true,
      icon: '{{ MEDIA_URL }}/icons2/22x22/status/network-receive.png',
      panel: "sysutils__service_panel_inst",
      href: '#'
    });
    tree.appendToRootNodeById("menu_shutdown", {
      text: gettext('Reboot'),
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
});


window.MainViewModules.push( new Ext.oa.SysUtils__Service_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
