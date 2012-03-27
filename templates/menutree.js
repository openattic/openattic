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

Ext.oa.MenuTree = Ext.extend(Ext.tree.TreePanel, {
  title: "{% trans 'Menu' %}",
  rootVisible: false,
  useArrows: true,
  autoScroll: true,
  animate: true,
  enableDD: false,
  containerScroll: true,
  root: {
    text: 'root',
    children: [
      {
        id: 'menu_status',
        text: "{% trans 'Status' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/emblems/emblem-web.png',
        children: []
      }, {
        id: 'menu_storage',
        text: "{% trans 'Storage' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/devices/gnome-dev-harddisk.png',
        children: []
      }, {
        id: 'menu_luns',
        text: "{% trans 'LUNs' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/places/network-server.png',
        children: []
      }, {
        id: 'menu_shares',
        text: "{% trans 'Shares' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-share.png',
        children: []
      }, {
        id: 'menu_services',
        text: "{% trans 'Services' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/gnome-mime-application-x-killustrator.png',
        children: []
      }, {
        id: 'menu_system',
        text: "{% trans 'System' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/application-x-executable.png',
        children: []
      }, {
        id: 'menu_usersettings',
        text: "{% trans 'Personal Settings' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/actions/stock_about.png',
        panel: "settings_panel_inst",
        leaf: true,
        href: '#'
      }, {
        id: 'menu_shutdown',
        text: "{% trans 'Shutdown' %}",
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/oxygen/22x22/actions/system-shutdown.png',
        children: []
      }
    ]
  },
  appendToRootNodeById: function(rootid, subnode){
    "use strict";
    var i;
    if( !this.root.loaded ){
      for( i = 0; i < this.root.attributes.children.length; i++ ){
        if( this.root.attributes.children[i].id === rootid ){
          this.root.attributes.children[i].children.push(subnode);
        }
      }
    }
    else{
      for( i = 0; i < this.root.childNodes.length; i++ ){
        if( this.root.childNodes[i].id === rootid )
          this.root.childNodes[i].append(subnode);
      }
    }
  },
  markAsActive: function(panel, parent){
    "use strict";
    var i;
    if( parent ){
      for( i = 0; i < parent.childNodes.length; i++ ){
        var nodepanel = parent.childNodes[i].attributes.panel;
        if( typeof nodepanel !== "undefined" && typeof nodepanel !== "string" )
          nodepanel = nodepanel.id;
        if( nodepanel === panel ){
          parent.childNodes[i].select();
          return true;
        }
        else if( !parent.childNodes[i].leaf && this.markAsActive( panel, parent.childNodes[i] ) )
          return true;
      }
    }
    else{
      return this.markAsActive(panel, this.root);
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
