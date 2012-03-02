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

Ext.oa.Portal = Ext.extend(Ext.ux.Portal, {
  initComponent: function(){
    var tools = [{
      id: 'close',
      handler: function(e, target, panel){
        panel.onClose();
      }
    }];
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "dashboard_inst",
      region:'center',
      margins:'35 5 5 0',
      portletTools: tools,
      items: (function(){
        var state = Ext.state.Manager.get("portalstate",
          [["portlet_lvs", "portlet_nfs"], ["portlet_cpu"], ["portlet_ram"]]);

        var all_portlets = Ext.oa.getDefaultPortlets(tools);

        for( var i = 0; i < window.MainViewModules.length; i++ ){
          if( window.MainViewModules[i].getDashboardPortlets ){
            var mod_portlets = window.MainViewModules[i].getDashboardPortlets(tools);
            // Append mod_portlets to all_portlets
            all_portlets.push.apply(all_portlets, mod_portlets);
          }
        }

        var items = [];
        // For each column...
        for( var c = 0; c < state.length; c++ ){
          var colitems = [];
          // for each portlet in this column's state...
          for( var p = 0; p < state[c].length; p++ ){
            // find this portlet in the all_portlets list and add it to this column
            for( var i = 0; i < all_portlets.length; i++ ){
              if( all_portlets[i].id === state[c][p] ){
                colitems.push(all_portlets[i]);
              }
            }
          }
          // now add a column wrapper for this column
          items.push({
            columnWidth:.33,
            style:'padding:10px 0 10px 10px',
            items: colitems
          });
        }
        return items;
      }())
    }));
    Ext.oa.Portal.superclass.initComponent.apply(this, arguments);
    this.on("drop", this.savePortlets, this);
  },

  savePortlets: function(){
    var portal = this;
    var state = [];
    for( var c = 0; c < portal.items.getCount(); c++ ){
      var colIds = [];
      var col = portal.items.get(c);
      for( var p = 0; p < col.items.getCount(); p++ ){
        colIds.push(col.items.get(p).id);
      }
      state.push(colIds);
    }
    Ext.state.Manager.set("portalstate", state);
  },

  makePortlet: function(config){
    var portlet = Ext.applyIf(config, {
      xtype: "portlet",
      tools: this.portletTools
    });
    this.items.items[0].add(portlet);
    this.doLayout();
    this.items.items[0].doLayout();
    this.savePortlets();
  },

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: 'Dashboard',
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-session.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.unshift( new Ext.oa.Portal() );

// kate: space-indent on; indent-width 2; replace-tabs on;
