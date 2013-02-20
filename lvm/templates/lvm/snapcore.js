// vim: noai:ts=2:sw=2
// kate: space-indent on; indent-width 2; replace-tabs on;

Ext.namespace('Ext.oa');

Ext.oa.TreeLoader = Ext.extend(Ext.tree.TreeLoader, {
  directFn: lvm__LogicalVolume.all,
  requestData: function(node, callback, scope){
    this.tree.objtypes[ node.attributes.objtype ].requestTreeData(this.tree, this, node, callback, scope);
  },
  createNode: function(data){
    return this.tree.objtypes[ data.objtype ].createTreeNode(this.tree, data);
  }
});

Ext.oa.LVM__Snapcore_Panel = Ext.extend(Ext.Panel, {
  registerObjType: function(objtype){
    this.objtypes[ objtype.objtype ] = objtype;
  },
  initComponent: function(){
    'use strict';
    //var tree = this;

    this.objtypes = {};

    var rootnode = new Ext.tree.TreeNode({
      nodeType: 'async',
      objtype: "root",
      text: 'root',
      leaf: false,
      expanded: true,
      expandable: true,
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'lvm__snapcore_panel_inst',
      title: gettext('SnapApps'),
      layout: 'border',
      items: [{
        region: 'west',
        width: 280,
        height: 990,
        xtype: 'treepanel',
        useArrows:true,
        autoScroll:true,
        animate:true,
        containerScroll: true,
        rootVisible: false,
        frame: true,
        id: 'lvm__snapcore_treepanel',
        loader: new Ext.oa.TreeLoader({
          clearOnLoad: true,
          tree: this
        }),
        root: rootnode,
        buttons: [{
          text: gettext('Add Host'),
          handler: function(){
            var add_host_win = new Ext.Window({
              id: 'add_host_win',
              title: gettext('Add Host'),
              layout: 'fit',
            });

            var add_host_panel = new Ext.Panel({
              id: 'add_host_panel',
              border: false,
              layout: {
                type: 'vbox',
                padding: '10',
                align: 'center',
                anchor: '-20px',
              },
              defaults: {
                xtype: 'button',
                width: 300,
                height: 50,
              }
            });

            for(var i=0; i<window.SnapAppPlugins.length; i++){
              add_host_panel.add({
                text: window.SnapAppPlugins[i].plugin_name,
                handler: window.SnapAppPlugins[i].add.createDelegate(window.SnapAppPlugins[i],
                  [add_host_win, Ext.getCmp('lvm__snapcore_treepanel')]),
              });
            }

            add_host_panel.add({
              text: gettext('Cancel'),
              icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
              handler: add_host_win.close.createDelegate(add_host_win),
            });

            add_host_win.add(add_host_panel);
            add_host_win.show();
          }
        },{
          text: gettext('New configuration'),
        },{
          text: gettext('Collapse all'),
          handler: function(){
            var tree = Ext.getCmp('lvm__snapcore_treepanel');
            tree.collapseAll();
          }
        }]
      },{
        region: 'center',
        xtype: 'panel',
        id: 'snapcore_center_panel',
        layout: 'border',
        viewConfig: {forceFit: true},
        items: [{
          region: 'center',
          xtype: 'grid',
          width: 160,
          id: "snapcore_east_panel",
          viewConfig: {forceFit: true},
          colModel: new Ext.grid.ColumnModel({
            columns: [{
              header: gettext("Job name")
            },{
              header: gettext("Details")
            }],
          }),
        },{
          region: 'south',
          id: 'snapcore_south_panel',
          split: true,
          height: 160,
          width: 160,
          xtype: 'grid',
          viewConfig: {forceFit: true},
          colModel: new Ext.grid.ColumnModel({
            columns: [{
              header: gettext("Snapshots"),
              //dataIndex: VolSnapshots
            }],
          }),
        }]
      }]
    }));
    Ext.oa.LVM__Snapcore_Panel.superclass.initComponent.apply(this, arguments);

    for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
      var pluginroot = window.SnapAppPlugins[i].initTree(this);
      rootnode.appendChild( pluginroot.createTreeNode(this, {}) );
    }
  },
  refresh: function(){
    var tree = Ext.getCmp('lvm__snapcore_treepanel');
    tree.getLoader().load(tree.root);
  }
});

Ext.reg('lvm__snapcore_panel', Ext.oa.LVM__Snapcore_Panel);

Ext.oa.VMSnapApp__Snap_Module = Ext.extend(Object, {
  panel: 'lvm__snapcore_panel',
  prepareMenuTree: function(tree){
    'use strict';
    tree.appendToRootNodeById('menu_system', {
      text: gettext('Neue mächtige SnapApps'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
      panel: "lvm__snapcore_panel_inst",
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.VMSnapApp__Snap_Module() );
