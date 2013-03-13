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
  layout    : 'card',
  border    : false,
  defaults  : {
    bodyStyle : 'padding:5px;',
    border    : false,
    autoScroll: true,
    anchor    : '-20px',
    defaults  : {
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
      nodeType  : 'async',
      objtype   : "root",
      text      : 'root',
      leaf      : false,
      expanded  : true,
      expandable: true,
    });

    Ext.apply(this, Ext.apply(this.initialConfig, {
      useArrows       : true,
      autoScroll      : true,
      animate         : true,
      containerScroll : true,
      rootVisible     : false,
      frame           : true,
      loader: new Ext.oa.TreeLoader({
        clearOnLoad   : true,
        tree          : this
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
      id    : 'lvm__snapcore_panel_inst',
      title : gettext('SnapApps'),
      layout: 'border',
      items: [{
        id      : 'lvm__snapcore_treepanel',
        region  : 'west',
        width   : 280,
        height  : 990,
        xtype   : 'snaptreepanel',
        buttons : [{
          text    : gettext('Add Host'),
          handler : function(){
            var add_host_win = new Ext.Window({
              id    : 'add_host_win',
              title : gettext('Add Host'),
              layout: 'fit',
            });

            var add_host_panel = new Ext.Panel({
              id    : 'add_host_panel',
              border: false,
              layout: {
                type    : 'vbox',
                padding : '10',
                align   : 'center',
                anchor  : '-20px',
              },
              defaults: {
                xtype : 'button',
                width : 300,
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

            var VolumeStore = new Ext.data.DirectStore({
              id: "VolumeStore",
              fields :["id", "name"],
              autoLoad: true,
              directFn: lvm__LogicalVolume.all
            });

            // declare the source Grid
            var firstGrid = new Ext.grid.GridPanel({
              ddGroup          : 'secondGridDDGroup',
              id               : "firstGridId",
              store            : VolumeStore,
              colModel         : new Ext.grid.ColumnModel({
                defaults       : {sortable: true, draggable: true},
                columns: [
                   {
                    header: "Volumes",
                    dataIndex: "name"
                  }
                ],
              }),
              viewConfig       : { forceFit: true },
              height           : 340,
              enableDragDrop   : true,
              stripeRows       : true,
              title            : 'Volumes',
              listeners:{
                cellclick: function (self, rowIndex, colIndex, evt){
                  Ext.getCmp('firstGridId').getSelectionModel().clearSelections();
                },
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
              }
            });

            var secondGridStore = new Ext.data.JsonStore({
              fields : ["id", "name"],
              root   : 'data'
            });

            // create the destination Grid
            var secondGrid = new Ext.grid.GridPanel({
              ddGroup          : 'firstGridDDGroup',
              id               : "secondGridId",
              store            : secondGridStore,
              colModel         : new Ext.grid.ColumnModel({
                defaults       : {sortable: true, draggable: true},
                columns: [
                   {
                    header: "Volumes",
                    dataIndex: "name"
                  }
                ],
              }),
              viewConfig       : { forceFit: true },
              height           : 340,
              enableDragDrop   : true,
              stripeRows       : true,
              title            : 'Drag volumes which should be snapshotted here:',
              listeners: {
                cellclick: function (self, rowIndex, colIndex, evt){
                  Ext.getCmp('secondGridId').getSelectionModel().clearSelections();
                },
                afterrender: function(self){
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
              }
            });

            var config = {
              data: {
                prescript   : null,
                postscript  : null,
                expiry_date : null,
                start_date  : null,
                end_date    : null,
                active      : true,
                h           : null,
                min         : null,
                domonth     : null,
                doweek      : null,
              },
              volumes     : []/*[1, 2, 6, 9]*/,
              plugin_data : {} /*{
                VMware: {
                  openattic01: {
                    data: {
                      consistency: "mit ram",
                    },
                    vms: {
                      vm01: {
                        consistency: "mit ram",
                      },
                      vm02: {
                        consistency: "ohne ram",
                      },
                      vm03: {
                        consistency: "keine konsistenz (aka kein snap)",
                      },
                    }
                  },
                  openattic02: {
                    data: null,
                    vms: {
                      vm02: {
                        consistency: "ohne ram",
                      },
                      vm05: {
                        consistency: "mit ram",
                      },
                    }
                  }
                },
                MSSql: {
                  yadda
                }
              }*/
            };

            var wizform = new Ext.oa.WizPanel({
              activeItem: 'wiz_welc',
              items     : [{
                title     : gettext('Welcome'),
                id        : 'wiz_welc',
                noAutoPrev: true,
              },{
                id        : 'wiz_snapitems',
                layout    : 'border',
                xtype     : 'form',
                frame     : true,
                items     : [{
                  title     : gettext('Available items'),
                  region    : 'center',
                  id        : 'lvm__snapcore_wizard_treepanel',
                  xtype     : "snaptreepanel",
                  checkable : true,
                  listeners : {
                    click   : function(node, e){
                      var plugin = node.attributes.plugin;
                      var config = plugin.getConfig(node);
                      var layout = Ext.getCmp('wiz_snapitem_settings').layout;
                      var form = plugin.getForm(node);
                      layout.setActiveItem(form);
                      form.treeNode = node;
                      if( config === null ){
                        // No config, so create a Record that explicitly sets every field to null.
                        var data = {};
                        form.items.each(function(item){
                          data[item.name] = null;
                        });
                        config = new Ext.data.Record(data);
                      }
                      form.getForm().loadRecord(config);
                    },
                  }
                }, (function(){
                  var items = [];
                  for( var i = 0; i < window.SnapAppPlugins.length; i++ ){
                    window.SnapAppPlugins[i].config = config;
                    if( typeof window.SnapAppPlugins[i].objtypes !== "undefined" ){
                      for( var o = 0; o < window.SnapAppPlugins[i].objtypes.length; o++ ){
                        if( typeof window.SnapAppPlugins[i].objtypes[o].configForm !== "undefined" ){
                          items.push(window.SnapAppPlugins[i].objtypes[o].configForm);
                        }
                      }
                    }
                  }
                  return {
                    title     : gettext('Item settings'),
                    id        : 'wiz_snapitem_settings',
                    region    : 'east',
                    split     : true,
                    xtype     : 'form',
                    width     : 300,
                    bodyStyle : 'padding:5px 5px;',
                    border    : true,
                    layout    : 'card',
                    items     : items,
                    activeItem: 0,
                  };
                }())],
              },{
                title   : gettext('Additional Drives'),
                id      : 'wiz_addvol',
                defaults: { flex : 1 },
                layout  : "hbox",
                items   : [firstGrid, secondGrid],
                bbar    : [
                  '->',
                  {
                    text    : 'Reset both grids',
                    handler : function() {
                      //refresh source grid
                      VolumeStore.reload();
                      //purge destination grid
                      secondGridStore.removeAll();
                    }
                  }
                ]
              },{
                title : gettext('Pre-/Post-Script - Conditions'),
                id    : 'wiz_prepost',
                labelWidth: 150,
                xtype : 'form',
                items : [{
                  xtype     : 'textfield',
                  name      : 'prescript',
                  fieldLabel: gettext('Prescript conditions'),
                },{
                  xtype     : 'textfield',
                  name      : 'postscript',
                  fieldLabel: gettext('Postscript conditions'),
                }]
              },{
                title : gettext('Scheduling Part 1 / Expiry Date'),
                id    : 'wiz_sched1',
                layout: {
                  type  : 'vbox',
                  align : 'stretch',
                },
                xtype : 'form',
                items : [{
                  boxLabel  : gettext('No expiry date'),
                  id        : 'no_expiry',
                  name      : 'scheduling_1',
                  inputValue: 'no_expiry',
                  xtype     : 'radio',
                  checked   : true,
                },{
                  boxLabel  : gettext('Expiry date'),
                  id        : 'expiry_date',
                  name      : 'scheduling_1',
                  inputValue: 'expiry_date',
                  xtype     : 'radio',
                  listeners : {
                    check: function(radio, checkvalue){
                      if(checkvalue)
                      {
                        Ext.getCmp('sched1_date_select').enable();
                        Ext.getCmp('sched1_time_select').enable();
                      }
                      else
                      {
                        Ext.getCmp('sched1_date_select').disable();
                        Ext.getCmp('sched1_time_select').disable();
                      }
                    }
                  }
                },{
                  xtype     : 'datefield',
                  id        : 'sched1_date_select',
                  disabled  : true,
                },{
                  xtype     : 'timefield',
                  id        : 'sched1_time_select',
                  disabled  : true,
                }]
              },{
                title : gettext('Scheduling Part 2 / Options'),
                id    : 'wiz_sched2',
                layout: {
                  type  : 'vbox',
                  align : 'stretch',
                },
                noAutoNext: true,
                xtype     : 'form',
                items     : [{
                  boxLabel  : gettext('Execute now'),
                  id        : 'execute_now',
                  name      : 'scheduling_2',
                  inputValue: 'execute_now',
                  xtype     : 'radio',
                  checked   : true,
                },{
                  boxLabel  : gettext('Execute later'),
                  id        : 'execute_later',
                  name      : 'scheduling_2',
                  inputValue: 'execute_later',
                  xtype     : 'radio',
                  listeners : {
                    check: function(radio, checkvalue){
                      if(checkvalue)
                      {
                        Ext.getCmp('date_select').enable();
                        Ext.getCmp('time_select').enable();
                      }
                      else
                      {
                        Ext.getCmp('date_select').disable();
                        Ext.getCmp('time_select').disable();
                      }
                    }
                  }
                },{
                  xtype   : 'datefield',
                  id      : 'date_select',
                  disabled: true,
                },{
                  xtype   : 'timefield',
                  id      : 'time_select',
                  disabled: true,
                },{
                  boxLabel  : gettext('Create scheduling'),
                  id        : 'scheduling',
                  name      : 'scheduling_2',
                  inputValue: 'scheduling',
                  xtype     : 'radio',
                  listeners : {
                    check:  function(radio, checkvalue){
                      if(checkvalue)
                      {
                        Ext.getCmp('startdate_select').enable();
                        Ext.getCmp('starttime_select').enable();
                        Ext.getCmp('enddate_select').enable();
                        Ext.getCmp('endtime_select').enable();
                      }
                      else
                      {
                        Ext.getCmp('startdate_select').disable();
                        Ext.getCmp('starttime_select').disable();
                        Ext.getCmp('enddate_select').disable();
                        Ext.getCmp('endtime_select').disable();
                      }
                    }
                  }
                },{
                  xtype   : 'datefield',
                  id      : 'startdate_select',
                  disabled: true,
                },{
                  xtype   : 'timefield',
                  id      : 'starttime_select',
                  disabled: true,
                },{
                  xtype   : 'datefield',
                  id      : 'enddate_select',
                  disabled: true,
                },{
                  xtype   : 'timefield',
                  id      : 'endtime_select',
                  disabled: true,
                }],
                buttons: [{
                  text    : gettext('Next'),
                  handler : function(){
                    var checked = Ext.getCmp('wiz_sched2').getForm().getValues()['scheduling_2'];
                    var nextpnl = '';
                    switch(checked){
                      case 'execute_now':
                        nextpnl = 'wiz_close';
                        break;
                      case 'execute_later':
                        var date = Ext.getCmp('date_select').getValue();
                        var time = (Ext.getCmp('time_select').getValue()).split(':');
                        if(date && time)
                        {
                          date = date.add(Date.HOUR, time[0]).add(Date.MINUTE, time[1]).add(Date.MINUTE, +1);
                          var now = new Date();
                          if(now < date)
                          {
                            nextpnl = 'wiz_close';
                          }
                        }
                        break;
                      case 'scheduling':
                        var startdate = Ext.getCmp('startdate_select').getValue();
                        var starttime = (Ext.getCmp('starttime_select').getValue()).split(':');
                        var enddate = Ext.getCmp('enddate_select').getValue();
                        var endtime = (Ext.getCmp('endtime_select').getValue()).split(':');
                        if (startdate && starttime && enddate && endtime)
                        {
                          startdate = startdate.add(Date.HOUR, starttime[0]).add(Date.MINUTE, starttime[1]).add(Date.MINUTE, +1);
                          enddate = enddate.add(Date.HOUR, endtime[0]).add(Date.MINUTE, endtime[1]);
                          var now = new Date();
                          if(now < startdate && startdate < enddate)
                          {
                            nextpnl = 'wiz_sched31';
                          }
                        }
                        break;
                    }

                    if(nextpnl)
                    {
                      wizform.pnl_hist.push(nextpnl);
                      wizform.layout.setActiveItem(nextpnl);
                    }
                  }
                }]
              },{
                title : gettext('Scheduling Part 3 / Timemanagement Part 1'),
                id    : 'wiz_sched31',
                xtype : 'form',
                items : [{
                  xtype     : 'textfield',
                  name      : 'task_subject',
                  fieldLabel: gettext('Task subject'),
                },{
                  xtype     : 'textfield',
                  name      : 'target_path',
                  fieldLabel: gettext('Target path'),
                },{
                  xtype     : 'checkbox',
                  name      : 'is_active',
                  fieldLabel: gettext('Is active'),
                }]
              },{
                title : gettext('Scheduling Part 3 / Timemanagement Part 2'),
                id    : 'wiz_sched32',
                xtype : 'form',
                items : [{
                  xtype         : 'combo',
                  name          : 'minute',
                  fieldLabel    : gettext('Minute'),
                  store         : (function(){
                    var derp = ['*'];
                    for(var i = 0; i < 60; i += 5)
                      derp.push(i);
                    return derp;
                  }()),
                  value         : '0',
                  typeAhead     : true,
                  triggerAction : 'all',
                  emptyText     : gettext('Select...'),
                  selectOnFocus : true,
                },{
                  xtype   : 'fieldset',
                  title   : gettext('Hour'),
                  ref     : '../h_fieldset',
                  border  : true,
                  defaults: {
                    border      : false,
                    columnWidth : .5,
                    layout      : 'form',
                    defaults    : {
                      xtype: 'checkbox',
                    }
                  },
                  layout: 'column',
                  items : [{
                    items: (function(){
                      var it = [];
                      for(var i = 0; i < 12; i++)
                        it.push({id: 'h_' + i, fieldLabel: i, checked: (i%3 == 0) });
                      return it;
                    }()),
                  },{
                    items: (function(){
                      var it = [];
                      for(var i = 12; i < 24; i++)
                        it.push({id: 'h_' + i, fieldLabel: i, checked: (i%3 == 0) });
                      return it;
                    }()),
                  }]
                }],
              },{
                title : gettext('Scheduling Part 3 / Timemanagement Part 3'),
                id    : 'wiz_sched33',
                xtype : 'form',
                items : [{
                  xtype     : 'combo',
                  name      : 'day_of_month',
                  fieldLabel: gettext('Day'),
                  store     : (function(){
                    var derp = ['*'];
                    for(var i = 1; i <= 31; i++)
                      derp.push(i);
                    return derp;
                  }()),
                  value         : '*',
                  typeAhead     : true,
                  triggerAction : 'all',
                  emptyText     : gettext('Select...'),
                  selectOnFocus : true,
                },{
                  xtype   : 'fieldset',
                  title   : gettext('Day of week'),
                  ref     : '../dow_fieldset',
                  border  : true,
                  defaults: {
                    border      : false,
                    columnWidth : .5,
                    layout      : 'form',
                    defaults    : {
                      xtype   : 'checkbox',
                      checked : true,
                    }
                  },
                  layout  : 'column',
                  items   : [{
                    items: [{
                      id: 'dow_1', fieldLabel: gettext('Monday')
                    },{
                      id: 'dow_2', fieldLabel: gettext('Tuesday')
                    },{
                      id: 'dow_3', fieldLabel: gettext('Wednesday')
                    },{
                      id: 'dow_4', fieldLabel: gettext('Thursday')
                    },{
                      id: 'dow_5', fieldLabel: gettext('Friday')
                    }],
                  },{
                    items: [{
                      id: 'dow_6', fieldLabel: gettext('Saturday')
                    },{
                      id: 'dow_7', fieldLabel: gettext('Sunday')
                    }]
                  }],
                },{
                  xtype   : 'fieldset',
                  ref     : '../moy_fieldset',
                  border  : true,
                  defaults: {
                    border      : false,
                    columnWidth : .5,
                    layout      : 'form',
                    defaults    : {
                      xtype   : 'checkbox',
                      checked : true,
                    }
                  },
                  title : gettext('Month'),
                  layout: 'column',
                  items : [{
                    items: [{
                      id: 'moy_1', fieldLabel: gettext('January')
                    },{
                      id: 'moy_2', fieldLabel: gettext('Feburary')
                    },{
                      id: 'moy_3', fieldLabel: gettext('March')
                    },{
                      id: 'moy_4', fieldLabel: gettext('April')
                    },{
                      id: 'moy_5', fieldLabel: gettext('May')
                    },{
                      id: 'moy_6', fieldLabel: gettext('June')
                    }]
                  },{
                    items: [{
                      id: 'moy_7', fieldLabel: gettext('July')
                    },{
                      id: 'moy_8', fieldLabel: gettext('August')
                    },{
                      id: 'moy_9', fieldLabel: gettext('September')
                    },{
                      id: 'moy_10', fieldLabel: gettext('October')
                    },{
                      id: 'moy_11', fieldLabel: gettext('November')
                    },{
                      id: 'moy_12', fieldLabel: gettext('December')
                    }]
                  }],
                }],
              },{
                title       : gettext('Finish'),
                id          : 'wiz_close',
                noAutoNext  : true,
              }],
            });
            var wiz = new Ext.Window({
              title : gettext('Configuration Assistant'),
              layout: 'fit',
              items : wizform,
              width : 800,
              height: 500,
              anchor: '-20px',
            });
            wiz.show();
          },
        },{
          text    : gettext('Collapse all'),
          handler : function(){
            var tree = Ext.getCmp('lvm__snapcore_treepanel');
            tree.collapseAll();
          }
        }]
      },{
        region    : 'center',
        xtype     : 'panel',
        id        : 'snapcore_center_panel',
        layout    : 'border',
        viewConfig: {forceFit: true},
        items     : [{
          region    : 'center',
          xtype     : 'grid',
          width     : 160,
          id        : "snapcore_east_panel",
          viewConfig: {forceFit: true},
          colModel  : new Ext.grid.ColumnModel({
            columns: [{
              header: gettext("Configuration name")
            },{
              header: gettext("Details")
            }],
          }),
          store: new Ext.data.Store({
          }),
        },{
          region    : 'south',
          id        : 'snapcore_south_panel',
          split     : true,
          height    : 160,
          width     : 160,
          xtype     : 'grid',
          viewConfig: {forceFit: true},
          colModel  : new Ext.grid.ColumnModel({
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
