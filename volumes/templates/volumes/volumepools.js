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

function renderLoading(val){
  if( val ){
    return val;
  }
  return '♻';
}

Ext.define('volumes__volumes_VolumePool_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'size', 'percent', 'status'
  ],
  createNode: function(record){
    var rootNode;
    if( record.raw.member_set.length > 0 ){
      var store = Ext.create("Ext.oa.SwitchingTreeStore", {
        model: Ext.String.format('volumes__{0}_{1}_model', record.raw.member_set[0].app, record.raw.member_set[0].obj),
        root:  record.data,
        proxy: {
          type: "direct",
          directFn: volumes__BlockVolume.filter,
          extraParams: {
            kwds: {
              upper: record.raw.volumepool
            }
          },
          paramOrder: ["kwds"]
        }
      });
      rootNode = store.getRootNode();
    }
    else{
      record.set("leaf", true);
      rootNode = this.callParent(arguments);
    }
    lvm__VolumeGroup.lvm_info(record.raw.id, function(provider, response){
      if( response.type === "exception" ){
        rootNode.set("percent", '?');
        rootNode.set("size", '?');
        rootNode.set("free", '?');
        rootNode.set("attr", '?');
        return;
      }
      rootNode.set( "percent",
        ((response.result.LVM2_VG_SIZE - response.result.LVM2_VG_FREE) /
          response.result.LVM2_VG_SIZE * 100.0).toFixed(2)
      );
      rootNode.set("size", response.result.LVM2_VG_SIZE);
      rootNode.set("type", "LVM VG");
      rootNode.set("status", " ");
      rootNode.commit();
    });
    return rootNode;
  }
});


Ext.define('volumes__volumes_GenericDisk_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'size', 'percent', 'status', 'rpm'
  ],
  createNode: function(record){
    record.set("leaf", true);
    var rootNode = this.callParent(arguments);
    if(rootNode.get("rpm") / 1000 == parseInt(rootNode.get("rpm") / 1000)){
      krpm = parseInt(rootNode.get("rpm") / 1000);
    }
    else{
      krpm = (rootNode.get("rpm") / 1000).toFixed(1);
    }
    rootNode.set("percent", null);
    rootNode.set("size", rootNode.get("megs"));
    rootNode.set("status", "OK");
    rootNode.set("type", Ext.String.format("{0} {1}k", rootNode.get("type").toUpperCase(), krpm));
    rootNode.commit();
    return rootNode;
  }
});




Ext.define('Ext.oa.volumes__VolumePool_Panel', {
  extend: 'Ext.tree.TreePanel',
  alias: 'widget.volumes__volumepool_panel',
  initComponent: function(){
    var volumeGroupPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumes__volumepool_panel",
      title: gettext('Volume Groups'),
      border: false,
      rootVisible: false,
      buttons: [{
        text: "",
        icon: MEDIA_URL + '/icons2/16x16/actions/reload.png',
        tooltip: gettext('Reload'),
        handler: function(self){
          volumeGroupPanel.store.load();
        }
      }],
      forceFit: true,
      store: (function(){
        return Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumes__volumes_VolumePool_model',
          proxy: {
            type:     'direct',
            directFn: volumes__VolumePool.all
          },
          root: {
            name: "stuff",
            id:   "lvm__diskmgmt_root_node",
          }
        });
      }()),
      defaults: {
        sortable: true
      },
      columns: [{
        xtype: 'treecolumn',
        header: gettext('Name'),
        dataIndex: "name"
      },{
        header: gettext('Type'),
        dataIndex: "type",
        renderer: renderLoading
      },{
        header: gettext('Size'),
        dataIndex: "size",
        renderer: function(val){
          if( val === null ){
            return '';
          }
          if( !val || val === -1 ){
            return '♻';
          }
          if( val >= 1000 ){
            return Ext.String.format("{0} GB", (val / 1000).toFixed(2));
          }
          else{
            return Ext.String.format("{0} MB", val);
          }
        }
      },{
        header: gettext('Used%'),
        dataIndex: "percent",
        renderer: function( val, x, store ){
          if( val === null ){
            return '';
          }
          if( !val || val === -1 ){
            return '♻';
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
        }
      },{
        header: gettext('Status'),
        dataIndex: "status",
        renderer: function( val, x, store ){
          if( val === null ){
            return '';
          }
          if( !val || val === -1 ){
            return '♻';
          }
          if( !val.contains(":") ){
            return val;
          }
          var id = Ext.id();
          var desc = val.split(":")[0];
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
        }
      }]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
  },
  refresh: function(){
    this.store.load();
  }
});


Ext.oa.volumeGroup_Module = {
  panel: "volumes__volumepool_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Disk Management (new)'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumes__volumepool_panel"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
