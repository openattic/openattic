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
            console.log("CreateNode!");
            console.log(record);
            var store = Ext.create("Ext.oa.SwitchingTreeStore", {
              model: "twraid__raid_model",
              root: record,
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
                    records[i].set("id",   "twraid__raid." + records[i].get("id"));
                    records[i].set("leaf", true);
                    records[i].commit();
                  }
                }
              }
            });
            window.teststore = store;
            return store.getRootNode();
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
            expanded: true,
          },
          listeners: {
            load: function(self, node, records, success, evOpts){
              console.log("LVM store loaded!");
              var i, vgid;
              var handleResponse = function(i){
                return function(provider, response){
                  if( response.type === "exception" ){
                    records[i].set("percent", '?');
                    records[i].set("size", '?');
                    records[i].set("free", '?');
                    records[i].set("attr", '?');
                    return;
                  }
                  records[i].set( "percent",
                    ((response.result.LVM2_VG_SIZE - response.result.LVM2_VG_FREE) /
                      response.result.LVM2_VG_SIZE * 100.0).toFixed(2)
                  );
                  if( response.result.LVM2_VG_SIZE >= 1000 ){
                    records[i].set("size", Ext.String.format("{0} GB",
                      (response.result.LVM2_VG_SIZE / 1000).toFixed(2)));
                  }
                  else
                  {
                    records[i].set("size", Ext.String.format("{0} MB", response.result.LVM2_VG_SIZE));
                  }
                  if( response.result.LVM2_VG_FREE >= 1000 ){
                    records[i].set("free", Ext.String.format("{0} GB",
                      (response.result.LVM2_VG_FREE / 1000).toFixed(2)));
                  }
                  else
                  {
                    records[i].set("free", Ext.String.format("{0} MB", response.result.LVM2_VG_FREE));
                  }
                  records[i].set("type", "LVM VG");
                  records[i].set("status", "Wird scho");
                  records[i].commit();
                };
              };
              for( i = 0; i < records.length; i++ ){
                vgid = records[i].get("id");
                records[i].set("id", "lvm__VolumeGroup." + records[i].get("id"));
                records[i].commit();
                lvm__VolumeGroup.lvm_info(vgid, handleResponse(i));
              }
            }
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
        renderer: renderLoading
      },{
        header: gettext('Used%'),
        dataIndex: "percent",
        renderer: function( val, x, store ){
          if( !val || val === -1 ){
            return '♻';
          }
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
    this.store.load();
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
