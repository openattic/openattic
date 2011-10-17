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
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: MEDIA_URL + '/icons2/22x22/emblems/emblem-web.png',
        children: []
      }, {
        id: 'menu_storage',
        text: 'Storage',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: MEDIA_URL + '/icons2/22x22/devices/gnome-dev-harddisk.png',
        children: []
      }, {
        id: 'menu_shares',
        text: 'Shares',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-share.png',
        children: [] 
      }, {
        id: 'menu_services',
        text: 'Services',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/gnome-mime-application-x-killustrator.png',
        children: []
      }, {
        id: 'menu_system',
        text: 'System',
        expanded: Ext.state.Manager.get("expand_root_nodes", false),
        icon: MEDIA_URL + '/icons2/22x22/mimetypes/application-x-executable.png',
        children: [ 
          {
            text: 'Network',
            icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-network.png',
            children: [ {
                text: 'General',
                leaf: true,
                icon: MEDIA_URL + '/icons2/22x22/apps/network.png'
              }, {
                text: 'Proxy',            leaf: true,
                icon: MEDIA_URL + '/icons2/22x22/apps/preferences-system-network-proxy.png'
              }, {
                text: 'Domain',
                icon: MEDIA_URL + '/icons2/128x128/apps/domain.png',
                children: [
                  {text: 'Active Directory',  leaf: true},
                  {text: 'LDAP',   leaf: true}
                ]
            } ]
          }, {
            text: 'Online Update',
            leaf: true,
            icon: MEDIA_URL + '/icons2/22x22/apps/update.png'
          }
        ]
      }, {
            id: 'menu_usersettings',
            text: 'Personal Settings',
            expanded: Ext.state.Manager.get("expand_root_nodes", false),
            icon: MEDIA_URL + '/icons2/22x22/actions/stock_about.png',
            children: []
         }
    ]
  },
  fbar: [ 'Auto-expand root nodes', {
    xtype: "checkbox",
    checked: Ext.state.Manager.get("expand_root_nodes", false),
    listeners: {
      check: function( self, checked ){
        Ext.state.Manager.set("expand_root_nodes", checked);
      }
    }
  }]
});


// kate: space-indent on; indent-width 2; replace-tabs on;
