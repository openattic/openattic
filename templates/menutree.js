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

Ext.define('Ext.oa.MenuTree', {

  extend: 'Ext.tree.TreePanel',
  title: gettext('Menu'),
  rootVisible: false,
  useArrows: true,
  autoScroll: true,
  animate: true,
  ddConfig: { enableDD: false },
  containerScroll: true,
  store: Ext.create("Ext.data.TreeStore", {
    fields: ['text', 'panel'],
    root: {
      text: 'root',
      expanded: true,
      children: [
        {
          id: 'menu_status',
          text: gettext('Status'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/emblems/emblem-web.png',
          children: []
        }, {
          id: 'menu_storage',
          text: gettext('Storage'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/devices/gnome-dev-harddisk.png',
          children: []
        }, {
          id: 'menu_luns',
          text: gettext('LUNs'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/places/network-server.png',
          children: []
        }, {
          id: 'menu_shares',
          text: gettext('Shares'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-share.png',
          children: []
        }, {
          id: 'menu_services',
          text: gettext('Services'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/mimetypes/gnome-mime-application-x-killustrator.png',
          children: []
        }, {
          id: 'menu_system',
          text: gettext('System'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/mimetypes/application-x-executable.png',
          children: []
        }, {
          id: 'menu_usersettings',
          text: gettext('Personal Settings'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/icons2/22x22/actions/stock_about.png',
          panel: "settings_panel_inst",
          leaf: true,
          href: '#'
        }, {
          id: 'menu_shutdown',
          text: gettext('Shutdown'),
          expanded: Ext.state.Manager.get("expand_root_nodes", true),
          icon: MEDIA_URL + '/oxygen/22x22/actions/system-shutdown.png',
          children: []
        }
      ]
    }
  }),
  appendToRootNodeById: function(rootid, subnode){
    "use strict";
    var i, root = this.store.getRootNode();
    for( i = 0; i < root.childNodes.length; i++ ){
      if( root.childNodes[i].data.id === rootid ){
        root.childNodes[i].appendChild(subnode);
      }
    }
  },
  markAsActive: function(panel, parent){
    "use strict";
    var i;
    if( parent ){
      for( i = 0; i < parent.childNodes.length; i++ ){
        var nodepanel = parent.childNodes[i].data.panel;
        if( typeof nodepanel !== "undefined" && typeof nodepanel !== "string" ){
          nodepanel = nodepanel.id;
        }
        if( nodepanel === panel ){
          this.items.items[0].selModel.select(parent.childNodes[i]);
          return true;
        }
        else if( !parent.childNodes[i].leaf && this.markAsActive( panel, parent.childNodes[i] ) ){
          return true;
        }
      }
    }
    else{
      return this.markAsActive(panel, this.store.tree.root);
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
