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

Ext.define('Ext.oa.VolumeGroup_Panel', {
  extend: 'Ext.tree.TreePanel',
  alias: 'widget.volumegroup_panel',
  initComponent: function(){
    var volumeGroupPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumeGroup_panel_inst",
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
        Ext.define('volumepool_list_model', {
          extend: 'Ext.data.TreeModel',
          requires: [
            'Ext.data.NodeInterface'
          ],
          fields: [
            {name: 'id'},
            {name: 'name'},
            {name: 'type'},
            {name: 'size'},
            {name: 'percent'},
            {name: 'status'}
          ],
          createNode: function(record){
            console.log("volumepool_list_model.createNode!");
            //console.log(record);
            var vgid = parseInt(record.get("id"));
            var store = Ext.create("Ext.oa.SwitchingTreeStore", {
              model: "twraid__raid_model",
              root:  record.data,
              proxy: {
                type: "direct",
                directFn: twraid__Unit.find_by_vg,
                extraParams: {
                  id: record.get("id")
                },
                paramOrder: ["id"]
              },
              listeners: {
                load: function(self, node, records, success, evOpts){
                  console.log("twraid store loaded!");
                  for( var i = 0; i < records.length; i++ ){
                    records[i].set("id",   ["twraid__raid", records[i].get("id"), Ext.id()].join('.'));
                    records[i].set("leaf", false);
                    records[i].set("percent", null);
                    records[i].set("type", records[i].get("unittype"));
                    records[i].commit();
                  }
                }
              }
            });
            var rootNode = store.getRootNode();
            lvm__VolumeGroup.lvm_info(vgid, function(provider, response){
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
        Ext.define('twraid__raid_model', {
          extend: 'Ext.data.TreeModel',
          requires: [
            'Ext.data.NodeInterface'
          ],
          fields: [
            "status", "index", "name", "verify", "rebuild", "rdcache", "wrcache",
            "unittype", "autoverify", "serial", "size", "chunksize", "id"
          ],
          createNode: function(record){
            console.log("twraid__raid_model.createNode!");
            //console.log(record);
            var store = Ext.create("Ext.oa.SwitchingTreeStore", {
              model: "twraid__disk_model",
              root: record,
              proxy: {
                type: "direct",
                directFn: twraid__Disk.filter,
                extraParams: {
                  kwds: {
                    unit__id: record.get("id")
                  }
                },
                paramOrder: ["kwds"]
              },
              listeners: {
                load: function(self, node, records, success, evOpts){
                  console.log("twdisk store loaded!");
                  var krpm;
                  for( var i = 0; i < records.length; i++ ){
                    if(records[i].get("rpm") / 1000 == parseInt(records[i].get("rpm") / 1000)){
                      krpm = parseInt(records[i].get("rpm") / 1000);
                    }
                    else{
                      krpm = (records[i].get("rpm") / 1000).toFixed(1);
                    }
                    records[i].set("id",   ["twraid__disk", records[i].get("id"), Ext.id()].join('.'));
                    records[i].set("leaf", true);
                    records[i].set("percent", null);
                    records[i].set("type", Ext.String.format("{0} {1}k", records[i].get("disktype"), krpm));
                    records[i].set("name", records[i].get("model"));
                    records[i].commit();
                  }
                }
              }
            });
            return store.getRootNode();
          }
        });
        Ext.define('twraid__disk_model', {
          extend: 'Ext.data.TreeModel',
          requires: [
            'Ext.data.NodeInterface'
          ],
          fields: [
            "enclslot", "status", "unitindex", "serial", "linkspeed", "power_on_h", "disktype",
            "port", "temp_c", "model", "rpm", "size"
          ]
        });
        return Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumepool_list_model',
          proxy: {
            type:     'direct',
            directFn: lvm__VolumeGroup.all
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
        renderer: renderLoading
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
  panel: "volumegroup_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Disk Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumeGroup_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
