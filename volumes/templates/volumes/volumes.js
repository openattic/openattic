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

Ext.define('volumes__volumes_BlockVolume_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
    rootNode.set("icon",     MEDIA_URL + '/icons2/16x16/apps/database.png');
    rootNode.set("host",     toUnicode(record.raw.host));
    rootNode.set("poolname", toUnicode(record.raw.pool));
    rootNode.set("percent",  null);
    return rootNode;
  }
});

Ext.define('volumes__volumes_FileSystemVolume_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
    rootNode.set("host",         toUnicode(record.raw.host));
    rootNode.set("poolname",     toUnicode(record.raw.pool));
    rootNode.set("ownername",    toUnicode(record.raw.owner));
    rootNode.set("icon",         MEDIA_URL + '/icons2/16x16/apps/database.png');
    if( record.data.usedmegs !== null )
      rootNode.set("percent",    (record.data.usedmegs / record.data.megs * 100).toFixed(2));
    else
      rootNode.set("percent",    null);
    return rootNode;
  }
});

var required = '<span style="color:red;font-weight:bold" data-qtip="Required">*</span>';
var mirror_win = new Ext.Window({
  title: gettext("Mirror"),
  layout: "fit",
  height: 210,
  width: 500,
  items: [{
    xtype: "form",
    border: false,
    bodyStyle: "padding:5px 5px;",
    items: [{
      xtype: 'combo',
      forceSelection: true,
      fieldLabel: gettext("Choose mirrorhost"),
      typeAhead: true,
      triggerAction: "all",
      deferEmptyText: false,
      emptyText: gettext("Select..."),
      itemId: "volumes_find_mirror_combo",
      selectOnFocus: true,
      displayField: "name",
      valueField: "id",
      allowBlank: false,
      afterLabelTextTpl: required,
      store: (function(){
        Ext.define("volumes__blockvolume_host_store", {
          extend: "Ext.data.Model",
          fields: [
            {name: "id"},
            {name: "name"}
          ]
        });

        return Ext.create("Ext.data.Store", {
          model: "volumes__blockvolume_host_store",
          proxy: {
            type: "direct",
            directFn: ifconfig__Host.filter,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined,
            extraParams: {
              kwds: {
                "__exclude__": {
                  "id": window.HOSTID
                }
              }
            },
            paramOrder: ["kwds"]
          }
        });
      }()),
      listeners: {
        change: function(self, newValue, oldValue, eOpts){
          var pool_combo = self.ownerCt.getComponent('volumes_find_volumepool_combo');
          pool_combo.enable();
          pool_combo.getStore().load({
            params: {
                "host_id": newValue,
                "min_megs": self.ownerCt.ownerCt.volume_megs
            }
          });
        }
      }
    },{
      xtype: 'combo',
      disabled: true,
      forceSelection: true,
      fieldLabel: gettext("Choose volumepool"),
      typeAhead: true,
      deferEmptyText: false,
      emptyText: gettext("Select..."),
      itemId: "volumes_find_volumepool_combo",
      displayField: "name",
      valueField: "id",
      queryMode: "local",
      allowBlank: false,
      afterLabelTextTpl: required,
      store: (function(){
        Ext.define("volumes__blockvolume_volumepool_store", {
          extend: "Ext.data.Model",
          fields: [
            {name: "id"},
            {name: "name"}
          ]
        });

        return Ext.create("Ext.data.Store", {
          autoLoad: false,
          model: "volumes__blockvolume_volumepool_store",
          proxy: {
            type: "direct",
            directFn: volumes__VolumePool.get_sufficient,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined,
            paramOrder: ["host_id", "min_megs"]
          }
        });
      }()),
    },{
      xtype: 'radiogroup',
      fieldLabel: gettext("Protocol"),
      columns: 1,
      itemId: "volumes_protocol_radio",
      afterLabelTextTpl: required,
      items: [
        {name: "protocol", boxLabel: gettext("A: Asynchronous"), inputValue: "A"},
        {name: "protocol", boxLabel: gettext("B: Memory Synchronous (Semi-Synchronous)"), inputValue: "B"},
        {name: "protocol", boxLabel: gettext("C: Synchronous"), checked: true, inputValue: "C"}
      ]
    }],
    buttons: [{
      text: gettext("Choose"),
      icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
      listeners: {
        click: function(self, e, eOpts){
          var peer_host_id = self.ownerCt.ownerCt.getComponent('volumes_find_mirror_combo').getValue();
          var peer_volumepool_id = self.ownerCt.ownerCt.getComponent('volumes_find_volumepool_combo').getValue();
          var protocol = self.ownerCt.ownerCt.getComponent('volumes_protocol_radio').getValue();

          drbd__Connection.create_connection(peer_host_id, peer_volumepool_id, protocol['protocol'], mirror_win.volume_id,
            mirror_win.volume_name, mirror_win.volume_megs, 1, mirror_win.fswarning, mirror_win.fscritical,
            function(result, response){
            if(response.type !== "exception"){
              mirror_win.close();
              mirror_win.volumePanel.refresh();
            }
          });
        }
      }
    },{
      text: gettext("Cancel"),
      icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
      listeners: {
        click: function(self, e, eOpts){
          mirror_win.close();
        }
      }
    }]
  }]
});

Ext.define('Ext.oa.volumes__Volume_Panel', {
  extend: 'Ext.tree.TreePanel',
  alias: 'widget.volumes__volumes_panel',
  initComponent: function(){
    var volumePanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumes__volumes_panel_inst",
      stateId: "volumes__volumes_panel_state",
      stateful: true,
      title: gettext('Volume Management'),
      border: false,
      rootVisible: false,
      buttons: [{
        text: "",
        icon: MEDIA_URL + '/icons2/16x16/actions/reload.png',
        tooltip: gettext('Reload'),
        handler: function(self){
          volumePanel.refresh();
        }
      }, {
        text: gettext("Expand all"),
        handler: function(self){
          volumePanel.store.getRootNode().expand(true);
        }
      }, {
        text: gettext("Collapse all"),
        handler: function(self){
          var i,
              childNodes = store.getRootNode().childNodes;
          for( i = 0; i < childNodes.length; i++ ){
            childNodes[i].collapseChildren(true);
          }
        }
      }, {
        text: gettext("Add Volume"),
        handler: function(self){
          var addwin = new Ext.Window(Ext.apply(config, {
            height: 200,
            width:  500,
            layout: "fit",
            defaults: {
              autoScroll: true
            },
            items: [{
              xtype: "form",
              title: gettext("Volume configuration"),
              bodyStyle: 'padding: 5px 5px;',
              api: {
                load:   volumes.BlockVolume.get_ext,
                submit: volumes.BlockVolume.set_ext
              },
              baseParams: {
                id: (record ? record.id: -1)
              },
              paramOrder: ["id"],
              defaults: {
                xtype: "textfield",
                anchor: '-20px',
                defaults : {
                  anchor: "0px"
                }
              },
              buttons: [{
                text: gettext("Create Volume"),
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(btn){
                  addwin.getEl().mask(gettext("Loading..."));
                  var conf = {
                    success: function(provider, response){
                      if(response.result){
                        if( typeof config.success === "function"){
                          config.success();
                        }
                        addwin.close();
                      }
                    },
                    failure: function(){
                      addwin.getEl().unmask();
                    }
                  };
                  var datform = btn.ownerCt.ownerCt;
                  datform.submit(conf);
                }
              },{
                text: gettext("Cancel"),
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(){
                  addwin.close();
                }
              }],
              items: [{
                fieldLabel: gettext("Name"),
                name: "name"
              }, {
                fieldLabel: gettext("Size in MB"),
                name: "megs"
              }, {
                fieldLabel: gettext("Pool"),
                name: "name"
              }]
            }]
          }));
          addwin.show();
        }
      },{
        text: gettext("Mirror"),
        listeners: {
          click: function(self, e, eOpts){
            if(self.ownerCt.ownerCt.getSelectionModel().getSelection().length === 1){
              var vol_selection = self.ownerCt.ownerCt.getSelectionModel().getSelection()[0];
              if(vol_selection.$className.indexOf("BlockVolume") != -1){
                if(typeof vol_selection.data.megs !== 'undefined' && vol_selection.data.megs > 0 &&
                  typeof vol_selection.data.name !== 'undefined' && vol_selection.data.name.length > 0){
                  mirror_win["volume_id"] = vol_selection.data.id;
                  mirror_win["volume_megs"] = vol_selection.data.megs;
                  mirror_win["volume_name"] = vol_selection.data.name;
                  mirror_win["fswarning"] = vol_selection.data.fswarning || 0;
                  mirror_win["fscritical"] = vol_selection.data.fscritical || 0;
                  mirror_win["volumePanel"] = volumePanel;
                  mirror_win.show();
                }
              }
            }
          }
        }
      }],
      forceFit: true,
      store: (function(){
        var treestore = Ext.create("Ext.oa.SwitchingTreeStore", {
          fields: ['name'],
          proxy: { type: "memory" },
          root: {
            name:     'root',
            expanded: true,
            id: "volumes_root_node"
          }
        });
        var blockvolstore = Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumes__volumes_BlockVolume_model',
          proxy: {
            type:     'direct',
            directFn: volumes__BlockVolume.filter,
            extraParams: {
              kwds: {
                upper_id__isnull: true
              }
            },
            paramOrder: ["kwds"]
          },
          root: {
            name: gettext("Block-based"),
            id:   "volumes__volumes_blockvolumes_rootnode",
            type: ' ',
            megs: null,
            percent: null,
            status: null,
          },
          sorters: [{property: "name"}]
        });
        var fsvolstore = Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumes__volumes_FileSystemVolume_model',
          proxy: {
            type:     'direct',
            directFn: volumes__FileSystemVolume.all
          },
          root: {
            name: gettext("File-based"),
            id:   "volumes__volumes_fsvolumes_rootnode",
            type: ' ',
            megs: null,
            percent: null,
            status: null,
          },
          sorters: [{property: "name"}]
        });
        var rootNode = treestore.getRootNode();
        rootNode.appendChild(blockvolstore.getRootNode());
        rootNode.appendChild(fsvolstore.getRootNode());
        return treestore;
      }()),
      defaults: {
        sortable: true
      },
      columns: [{
        xtype: 'treecolumn',
        header: gettext('Name'),
        dataIndex: "name",
        stateId: "volumes__volumes_panel_state__name",
        flex: 3
      },{
        header: gettext('Type'),
        dataIndex: "type",
        stateId: "volumes__volumes_panel_state__type",
        flex: 1
      },{
        header: gettext('Size'),
        dataIndex: "megs",
        stateId: "volumes__volumes_panel_state__megs",
        align: "right",
        renderer: function(val){
          if( val === null ){
            return '';
          }
          if( val >= 1000 ){
            return Ext.String.format("{0} GB", (val / 1000).toFixed(2));
          }
          else{
            return Ext.String.format("{0} MB", val);
          }
        },
        flex: 1
      },{
        header: gettext('Used%'),
        dataIndex: "percent",
        stateId: "volumes__volumes_panel_state__percent",
        renderer: function( val, x, store ){
          if( val === null ){
            return '';
          }
          var id = Ext.id();
          Ext.defer(function(){
            if( Ext.get(id) === null ){
              return;
            }
            new Ext.ProgressBar({
              renderTo: id,
              value: val/100.0,
              text:  Ext.String.format("{0}%", val),
              cls:   ( val > 85 ? "lv_used_crit" :
                      (val > 70 ? "lv_used_warn" : "lv_used_ok"))
            });
          }, 25);
          return Ext.String.format('<span id="{0}"></span>', id);
        },
        flex: 2
      },{
        header: gettext('Status'),
        dataIndex: "status",
        stateId: "volumes__volumes_panel_state__status",
        renderer: function( val, x, store ){
          if( val === null || typeof val === 'undefined'){
            return '';
          }
          if( !val.contains(":") ){
            return val;
          }
          var id = Ext.id();
          var desc = Ext.String.capitalize(val.split(":")[0].toLowerCase());
          var perc = parseInt(val.split(":")[1]);
          Ext.defer(function(){
            if( Ext.get(id) === null ){
              return;
            }
            new Ext.ProgressBar({
              renderTo: id,
              value: perc/100.0,
              text:  Ext.String.format("{0} ({1}%)", desc, perc)
            });
          }, 25);
          return Ext.String.format('<span id="{0}"></span>', id);
        },
        flex: 1
      },{
        header: gettext('Warning Level'),
        dataIndex: "fswarning",
        stateId: "volumes__volumes_panel_state__fswarning",
        flex: 1
      },{
        header: gettext('Critical Level'),
        dataIndex: "fscritical",
        stateId: "volumes__volumes_panel_state__fscritical",
        flex: 1
      },{
        header: gettext('Path'),
        dataIndex: "path",
        stateId: "volumes__volumes_panel_state__path",
        flex: 1
      },{
        header: gettext('Host'),
        dataIndex: "host",
        stateId: "volumes__volumes_panel_state__host",
        flex: 1
      },{
        header: gettext('Volume Pool'),
        dataIndex: "poolname",
        stateId: "volumes__volumes_panel_state__poolname",
        flex: 1
      },{
        header: gettext('Owner'),
        dataIndex: "ownername",
        stateId: "volumes__volumes_panel_state__ownername",
        flex: 1
      }]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
    var i, nodes = this.getRootNode().childNodes;
    for(var i = 0; i < nodes.length; i++){
      nodes[i].expand();
    }
  },
  refresh: function(){
    var i, nodes = this.getRootNode().childNodes;
    for(var i = 0; i < nodes.length; i++){
      nodes[i].store.load();
    }
  }
});


Ext.oa.volumeGroup_Module = {
  panel: "volumes__volumes_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/volume.png',
      panel: "volumes__volumes_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
