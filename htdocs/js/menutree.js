Ext.namespace("Ext.oa");

Ext.oa.MenuTree = Ext.extend(Ext.tree.TreePanel, {
  title: 'Menu',
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
        text: 'Status',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/emblems/emblem-web.png',
        children: []
      }, {
        id: 'menu_storage',
        text: 'Storage',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/devices/gnome-dev-harddisk.png',
        children: []
      }, {
        id: 'menu_luns',
        text: 'LUNs',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/places/network-server.png',
        children: []
      }, {
        id: 'menu_shares',
        text: 'Shares',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-share.png',
        children: []
      }, {
        id: 'menu_services',
        text: 'Services',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/gnome-mime-application-x-killustrator.png',
        children: []
      }, {
        id: 'menu_system',
        text: 'System',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/application-x-executable.png',
        children: []
      }, {
        id: 'menu_usersettings',
        text: 'Personal Settings',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/icons2/22x22/actions/stock_about.png',
        panel: "settings_panel_inst",
        leaf: true,
        href: '#'
      }, {
        id: 'menu_shutdown',
        text: 'Shutdown',
        expanded: Ext.state.Manager.get("expand_root_nodes", true),
        icon: MEDIA_URL + '/oxygen/22x22/actions/system-shutdown.png',
        children: []
      }
    ]
  },
  fbar: [ 'Auto-expand root nodes', {
    xtype: "checkbox",
    checked: Ext.state.Manager.get("expand_root_nodes", true),
    listeners: {
      check: function( self, checked ){
        Ext.state.Manager.set("expand_root_nodes", checked);
      }
    }
  }],
  appendToRootNodeById: function(rootid, subnode){
    if( !this.root.loaded ){
      for( var i = 0; i < this.root.attributes.children.length; i++ ){
        if( this.root.attributes.children[i].id === rootid ){
          this.root.attributes.children[i].children.push(subnode);
        }
      }
    }
    else{
      for( var i = 0; i < this.root.childNodes.length; i++ ){
        if( this.root.childNodes[i].id === rootid )
          this.root.childNodes[i].append(subnode);
      }
    }
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
