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

/**
 *  Model for volumes.VolumePool objects.
 */
Ext.define('volumes__volumes_VolumePool_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'percent', 'status'
  ],
  createNode: function(record){
    var rootNode;
    if( record.raw.member_set.length > 0 ){
      /**
       *  A VolumePool can contain any kind and number of members (none if unknown).
       *  Check if it does, and if so, create a store that can load them and return
       *  its rootNode to be appended to the tree.
       *
       *  Thing is: We don't know the members' type, so how can we choose the correct
       *  model for them?
       *
       *  First of all: If it does contain members, they are always of the same type,
       *  so we never have to load a multitude of different types. One Model fits all.
       *
       *  So we only need to choose the correct model. In the members_set array, We
       *  get a couple of ID objects like this:
       *
       *    { "app": "mdraid", "obj": "Array", "id": 1 }
       *
       *  We can get the app and model name from there, and just hope that someone
       *  defines a volumes__<app>_<object>_model class somewhere that knows how to
       *  handle them.
       */
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
      // Record does not contain any children, so just get a leaf node.
      record.set("leaf", true);
      rootNode = this.callParent(arguments);
    }
    volumes__VolumePool.get_status(record.raw.id, function(provider, response){
      // Now that we have the node, we need to put some actual information into it
      // because the LVM API doesn't contain those (would take too long to load).
      if( response.type === "exception" ){
        rootNode.set("percent", '?');
        rootNode.set("megs", '?');
      }
      else{
        rootNode.set("percent", (response.result.usedmegs / response.result.megs * 100).toFixed(2));
        rootNode.set("megs",    response.result.megs);
        rootNode.set("status",  response.result.status);
        rootNode.set("type",    response.result.type);
      }
      rootNode.commit();
    });
    rootNode.set("type",   gettext(Ext.String.capitalize(toUnicode(record.raw.volumepool_type))));
    rootNode.set("icon",   MEDIA_URL + '/icons2/16x16/apps/database.png');
    return rootNode;
  }
});


/**
 *  Model for volumes.GenericDisk objects.
 */
Ext.define('volumes__volumes_GenericDisk_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'percent', 'status',
    'rpm'
  ],
  createNode: function(record){
    // GenericDisks can't contain any members.
    record.set("leaf", true);
    var rootNode = this.callParent(arguments);
    if(rootNode.get("rpm") / 1000 == parseInt(rootNode.get("rpm") / 1000)){
      krpm = parseInt(rootNode.get("rpm") / 1000);
    }
    else{
      krpm = (rootNode.get("rpm") / 1000).toFixed(1);
    }
    rootNode.set("icon",    MEDIA_URL + '/oxygen/16x16/devices/drive-harddisk.png');
    rootNode.set("percent", null);
    rootNode.set("status", "OK");
    rootNode.set("type", Ext.String.format("{0} {1}k", rootNode.get("type").toUpperCase(), krpm));
    rootNode.commit();
    return rootNode;
  }
});




/**
 *  Disk Management panel.
 *
 *  The store *always* loads volumes.VolumePool objects and uses
 *  volumes__volumes_VolumePool_model to process them, which will then
 *  load the children accordingly.
 */
Ext.define('Ext.oa.volumes__VolumePool_Panel', {
  extend: 'Ext.tree.TreePanel',
  alias: 'widget.volumes__volumepool_panel',
  initComponent: function(){
    var volumeGroupPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumes__volumepool_panel_inst",
      title: gettext('Disk Management'),
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
          },
          sorters: [{property: "name"}]
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
        renderer: function(val){ return (val ? val : '♻'); }
      },{
        header: gettext('Size'),
        dataIndex: "megs",
        align: "right",
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
      text: gettext('Disk Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumes__volumepool_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
