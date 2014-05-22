/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

function renderMegs(val){
  if( val === null ){
    return '';
  }
  if( !Ext.isNumber(val) ){
    return val;
  }
  // To get the unit, divide by 1024 until that is no longer possible
  // (either because val <= 1024 or because we ran out of units) and
  // count how many times we could do so.
  var units = ["MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  for( var i = 0; i < units.length - 1 && val >= 1024; i++, val /= 1024 );
  return Ext.String.format("{0} {1}", val.toFixed(2), units[i]);
}

/**
 *  Model for volumes.VolumePool objects.
 */
Ext.define('volumes__volumes_VolumePool_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'percent', 'status', 'usedmegs', 'freemegs'
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
      var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.member_set[0].app, record.raw.member_set[0].obj);
      if( Ext.ClassManager.get(modelname) === null ){
        modelname = 'volumes__volumes_BlockVolume_model';
      }
      var store = Ext.create("Ext.oa.SwitchingTreeStore", {
        model: modelname,
        root:  record.data,
        proxy: {
          type: "direct",
          directFn: volumes__BlockVolume.filter,
          extraParams: {
            kwds: {
              upper: record.raw.storageobj.id
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
        rootNode.set("usedmegs",'?');
        rootNode.set("freemegs",'?');
      }
      else{
        rootNode.set("percent", (response.result.usedmegs / response.result.megs * 100).toFixed(2));
        rootNode.set("megs",    response.result.megs);
        rootNode.set("usedmegs",response.result.usedmegs);
        rootNode.set("freemegs",response.result.megs - response.result.usedmegs);
        rootNode.set("status",  response.result.status);
        rootNode.set("type",    toUnicode(response.result.type));
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
    'id', '__unicode__', 'name', 'type', 'megs', 'percent', 'status',
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
 *  Volume Pool Management panel.
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
      stateId: "volumes__volumepool_panel_state",
      stateful: true,
      title: gettext('Volume Pool Management'),
      border: false,
      rootVisible: false,
      buttons: [{
        text: "",
        minWidth: 16,
        icon: MEDIA_URL + '/icons2/16x16/actions/reload.png',
        tooltip: gettext('Reload'),
        handler: function(self){
          volumeGroupPanel.store.load();
        }
      }, {
        text: gettext("Expand all"),
        icon: MEDIA_URL + "/extjs/resources/ext-theme-classic/images/tree/elbow-end-plus.gif",
        handler: function(self){
          volumeGroupPanel.store.getRootNode().expand(true);
        }
      }, {
        text: gettext("Collapse all"),
        icon: MEDIA_URL + "/extjs/resources/ext-theme-classic/images/tree/elbow-end-minus.gif",
        handler: function(self){
          volumeGroupPanel.store.getRootNode().collapseChildren(true);
        }
      }],
      forceFit: true,
      store: Ext.create('Ext.oa.SwitchingTreeStore', {
        model: 'volumes__volumes_VolumePool_model',
        proxy: {
          type:     'direct',
          directFn: volumes__VolumePool.all
        },
        root: {
          name: "stuff",
          id:   "lvm__diskmgmt_root_node"
        },
        sorters: [{property: "name"}]
      }),
      defaults: {
        sortable: true
      },
      columns: [{
        xtype: 'treecolumn',
        header: gettext('Name'),
        stateId: "volumes__volumepool_panel_state__name",
        dataIndex: "__unicode__"
      },{
        header: gettext('Type'),
        dataIndex: "type",
        stateId: "volumes__volumepool_panel_state__type",
        renderer: function(val){ return (val ? val : '♻'); }
      },{
        header: gettext('Size'),
        dataIndex: "megs",
        stateId: "volumes__volumepool_panel_state__megs",
        align: "right",
        renderer: renderMegs
      },{
        header: gettext('Free'),
        dataIndex: "freemegs",
        stateId: "volumes__volumepool_panel_state__freemegs",
        align: "right",
        renderer: renderMegs
      },{
        header: gettext('Used'),
        dataIndex: "usedmegs",
        stateId: "volumes__volumepool_panel_state__usedmegs",
        align: "right",
        renderer: renderMegs
      },{
        header: gettext('Used%'),
        dataIndex: "percent",
        stateId: "volumes__volumepool_panel_state__percent",
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
              text:  Ext.String.format("{0}%", val)
            });
          }, 25);
          return Ext.String.format('<span id="{0}"></span>', id);
        }
      },{
        header: gettext('Status'),
        dataIndex: "status",
        stateId: "volumes__volumepool_panel_state__status",
        renderer: function( val, x, store ){
          if( val === null ){
            return '';
          }
          if( !val || val === -1 ){
            return '♻';
          }
          if( !val.contains(":") ){
            return Ext.String.capitalize(val.toLowerCase());
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
        }
      }]
    }));
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
      text: gettext('Volume Pool Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumes__volumepool_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
