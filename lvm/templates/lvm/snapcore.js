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
  pnl_hist: ['wiz_welc'],
  initComponent: function(){
    var nextpanel = function(nextid){
      this.pnl_hist.push(nextid);
      this.layout.setActiveItem(nextid);
    }
    var prevpanel = function(crrid){
      var prev_pnl = this.pnl_hist[this.pnl_hist.length - 2];
      this.pnl_hist.pop();
      this.layout.setActiveItem(prev_pnl);
    }

    for(var i = this.items.length - 1; i >= 0; i--){
      var item = this.items[i];
      if(typeof item.buttons === "undefined"){
        item.buttons = [];
      }
      if(typeof item.noAutoNext === "undefined"){
        item.buttons.unshift({
          text: gettext('Next'),
          handler: nextpanel.createDelegate(this, [this.items[i+1].id]),
        });
      }
      if(typeof item.noAutoPrev === "undefined"){
        item.buttons.unshift({
          text: gettext('Previous'),
          handler: prevpanel.createDelegate(this, [this.items[i].id]),
        });
      }
    }
    Ext.oa.WizPanel.superclass.initComponent.apply(this, arguments);
  }
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

    for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
      var pluginroot = window.SnapAppPlugins[i].initTree(this);
      rootnode.appendChild( pluginroot.createTreeNode(this, {}) );
    }
  },
  listeners: {
    checkchange: function(node, checked){
      if(node.hasChildNodes)
      {
        if(node.attributes.objtype === 'vmware_datastore' || node.attributes.objtype === 'mssql_drive')
        {
          node.eachChild(function(childNode){
            childNode.ui.checkbox.disabled = checked;
            childNode.ui.checkbox.checked = checked;
          });
        }
        else if(node.attributes.objtype === 'vmware_vm' || node.attributes.objtype === 'mssql_database')
        {
          node.parentNode.ui.checkbox.disabled = checked;
          node.parentNode.ui.checkbox.checked = checked;
        }
      }
    },
    expandnode: function(node){
      if(node.attributes.objtype === 'vmware_datastore' || node.attributes.objtype === 'mssql_drive')
      {
        if(node.hasChildNodes)
        {
          node.eachChild(function(childNode){
            childNode.ui.checkbox.disabled = node.ui.checkbox.checked;
            childNode.ui.checkbox.checked = node.ui.checkbox.checked;
          });
        }
      }
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
            var myData = {
              records : [
                { name : "Drives", column1 : "Drive information", column2 : "0" },
                //{ name : "Rec 1", column1 : "1", column2 : "1" },
              ]
            };
            // Generic fields array to use in both store defs.
//            var fields = [
//              {name: 'name', mapping : 'name'},
//              {name: 'column1', mapping : 'column1'},
//              //{name: 'column2', mapping : 'column2'}
//            ];

            // create the data store
            var firstGridStore = new Ext.data.JsonStore({
              id: "fgs",
              fields : ["drive", "drive info", "id", "__unicode__"],
              listeners: {
                add: function(store){
                  var par = Ext.getCmp('sG').getSelectionModel();
                  var parid = par.selections.items[0];
                  storeUpdate(firstGridStore, parid.data.id, "firstGridStore");
                },
                remove: function(store){
                  var par = Ext.getCmp('sG').getSelectionModel();
                  var parid = par.selections.items[0];
                  storeUpdate(firstGridStore, parid.data.id, "firstGridStore");
                }
              }
            });

            // Column Model shortcut array
            var cols = [
              { id : 'name', header: "Drive", width: 160, sortable: true, dataIndex: 'name'},
              {header: "Details", width: 50, sortable: true, dataIndex: 'column1'}

            ];
            var secondGridStore = new Ext.data.DirectStore({
              id: "sgs",
              fields : ["drive", "drive info", "id", "__unicode__"],
              listeners: {
                add: function(store){
                  var par = Ext.getCmp('fG').getSelectionModel();
                  var parid = par.selections.items[0];
                  storeUpdate(secondGridStore, parid.data.id, "secondGridStore");
                },
                remove: function(store){
                  var par = Ext.getCmp('fG').getSelectionModel();
                  var parid = par.selections.items[0];
                  storeUpdate(secondGridStore, parid.data.id, "secondGridStore");
                }
              }
            });

            // declare the source Grid
            var firstGrid = new Ext.grid.GridPanel({
              ddGroup          : 'secondGridDDGroup',
              store            : firstGridStore,
              id: 'fG',
              columns: cols,
              ref: 'first_grid',
              enableDragDrop   : true,
              stripeRows       : true,
              autoExpandColumn : 'name',
              title            : 'Drives',
              afterrender: function (self){
                var secondGridDropTargetEl = secondGrid.getView().scroller.dom;
                var secondGridDropTarget = new Ext.dd.DropTarget(secondGridDropTargetEl, {
                  ddGroup    : 'secondGridDDGroup',
                  notifyDrop : function(ddSource, e, data){
                    var records =  ddSource.dragData.selections;
                    Ext.each(records, ddSource.grid.store.remove, ddSource.grid.store);
                    secondGrid.store.add(records);
                    secondGrid.store.sort('name', 'ASC');
                    return true
                  }
                });
              }
            });

            // create the destination Grid
            var secondGrid = new Ext.grid.GridPanel({
              ddGroup          : 'firstGridDDGroup',
              id: "sG",
              store            : secondGridStore,
              columns          : cols,
              enableDragDrop   : true,
              stripeRows       : true,
              autoExpandColumn : 'name',
              title            : 'Drag Drives which should be snapshottet here:',
              afterrender: function(self){
                var firstGridDropTargetEl =  firstGrid.getView().scroller.dom;
                var firstGridDropTarget = new Ext.dd.DropTarget(firstGridDropTargetEl, {
                  ddGroup    : 'firstGridDDGroup',
                  notifyDrop : function(ddSource, e, data){
                    var records =  ddSource.dragData.selections;
                    Ext.each(records, ddSource.grid.store.remove, ddSource.grid.store);
                    firstGrid.store.add(records);
                    firstGrid.store.sort('name', 'ASC');
                    return true
                  }
                });
              }
            });

            var wizform = new Ext.oa.WizPanel({
              activeItem: 'wiz_welc',
              items: [{
                title: gettext('Welcome'),
                id: 'wiz_welc',
                noAutoPrev: true,
              },{
                title: gettext('Choose Snapshot Items'),
                id: 'wiz_snapitems',
                layout: "fit",
                noAutoNext: true,
                items: [{
                  id: 'lvm__snapcore_wizard_treepanel',
                  xtype: "snaptreepanel",
                  checkable: true
                }],
                buttons: [{
                  text: gettext('Next'),
                  handler: function(){
                    var nextpanel = 'wiz_addvol';
                    for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
                      nextpanel = window.SnapAppPlugins[i].initWizard(wizform, nextpanel);
                    }
                    wizform.pnl_hist.push(nextpanel);
                    wizform.layout.setActiveItem(nextpanel);
                  }
                }],
              },{
                title: gettext('Additional Drives'),
                id: 'wiz_addvol',
                items:[firstGrid, secondGrid],
                buttons:[{
                  text: gettext('Add')
                },{
                  text: gettext('Remove')
                }],
                bbar    : [
                  '->', // Fill
                  {
                    text    : 'Reset both grids',
                    handler : function() {
                      //refresh source grid
                      firstGridStore.loadData(myData);
                      //purge destination grid
                      secondGridStore.removeAll();
                    }
                  }
                ]
              },{
                title: gettext('Pre-/Post-Script - Conditions'),
                id: 'wiz_prepost',
              },{
                title: gettext('Scheduling Part 1 / Expiry Date'),
                id: 'wiz_sched1',
              },{
                title: gettext('Scheduling Part 2 / Options'),
                id: 'wiz_sched2',
              },{
                title: gettext('Scheduling Part 3 / Timemanagement Part 1'),
                id: 'wiz_sched31',
              },{
                title: gettext('Scheduling Part 3 / Timemanagement Part 2'),
                id: 'wiz_sched32',
              },{
                title: gettext('Finish'),
                id: 'wiz_close',
                noAutoNext: true,
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
          store: new Ext.data.Store({
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
          store: new Ext.data.Store({
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
      text: gettext('SnapApps'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
      panel: "lvm__snapcore_panel_inst",
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.VMSnapApp__Snap_Module() );
