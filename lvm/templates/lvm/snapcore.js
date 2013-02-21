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

Ext.oa.WizPanel = Ext.extend(Ext.form.FormPanel, {
  layout: 'card',
  border: false,
  defaults: {
    bodyStyle: 'padding:5px;',
    border: false,
    autoScroll: true,
    anchor: '-20px',
    defaults: {
      border: false,
      anchor: '-20px',
    }
  },
});

Ext.oa.LVM__Snapcore_TreePanel = Ext.extend(Ext.tree.TreePanel, {
  registerObjType: function(objtype){
    this.objtypes[ objtype.objtype ] = objtype;
  },
  initComponent: function(){
    'use strict';

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
      useArrows:true,
      autoScroll:true,
      animate:true,
      containerScroll: true,
      rootVisible: false,
      frame: true,
      loader: new Ext.oa.TreeLoader({
        clearOnLoad: true,
        tree: this
      }),
      root: rootnode,
    }));

    Ext.oa.LVM__Snapcore_TreePanel.superclass.initComponent.apply(this, arguments);

    console.log("plugin init");
    for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
      var pluginroot = window.SnapAppPlugins[i].initTree(this);
      rootnode.appendChild( pluginroot.createTreeNode(this, {}) );
    }
  }
});

Ext.reg("snaptreepanel", Ext.oa.LVM__Snapcore_TreePanel);


Ext.oa.LVM__Snapcore_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    'use strict';
    //var tree = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'lvm__snapcore_panel_inst',
      title: gettext('SnapApps'),
      layout: 'border',
      items: [{
        id: 'lvm__snapcore_treepanel',
        region: 'west',
        width: 280,
        height: 990,
        xtype: 'snaptreepanel',
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
          handler: function(){
            var wizform = new Ext.oa.WizPanel({
              activeItem: 'wiz_welc',
              items: [{
                title: gettext('Welcome'),
                id: 'wiz_welc',
                buttons: [{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_snapitems');
                  }
                }],
              },{
                title: gettext('Choose Snapshot Items'),
                id: 'wiz_snapitems',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_welc');
                  }
                },{
                  text: gettext('Next'),
                  handler: function(){
                    var nextpanel = 'wiz_addvol';
                    for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
                      nextpanel = window.SnapAppPlugins[i].initWizard(wizform, nextpanel);
                    }
                    wizform.layout.setActiveItem(nextpanel);
                  }
                }],
              },{
                title: gettext('Additional Volumes'),
                id: 'wiz_addvol',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_snapitems');
                  }
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_prepost');
                  }
                }],
              },{
                title: gettext('Pre-/Post-Script - Conditions'),
                id: 'wiz_prepost',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_addvol');
                  }
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched1');
                  },
                }],
              },{
                title: gettext('Scheduling Part 1 / Expiry Date'),
                id: 'wiz_sched1',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_prepost');
                  }
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched2');
                  },
                }],
              },{
                title: gettext('Scheduling Part 2 / Options'),
                id: 'wiz_sched2',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.stActiveItem('wiz_sched1');
                  }
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched31');
                  },
                }],
              },{
                title: gettext('Scheduling Part 3 / Timemanagement Part 1'),
                id: 'wiz_sched31',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched2');
                  },
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched32');
                  },
                }],
              },{
                title: gettext('Scheduling Part 3 / Timemanagement Part 2'),
                id: 'wiz_sched32',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched31');
                  },
                },{
                  text: gettext('Next'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_close');
                  },
                }],
              },{
                title: gettext('Finish'),
                id: 'wiz_close',
                buttons: [{
                  text: gettext('Previous'),
                  handler: function(){
                    wizform.layout.setActiveItem('wiz_sched33');
                  }
                },{
                  text: gettext('Finish'),
                }]
              }],
            });
            var wiz = new Ext.Window({
              title: gettext('Configuration Assistant'),
              layout: 'fit',
              items: wizform,
              width: 800,
              height: 500,
              anchor: '-20px',
            });
            wiz.show();
          },
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
              header: gettext("Configuration name")
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
              header: gettext("VolumeVolume Snapshots"),
              //dataIndex: VolSnapshots
            }],
          }),
        }]
      }]
    }));
    Ext.oa.LVM__Snapcore_Panel.superclass.initComponent.apply(this, arguments);
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
