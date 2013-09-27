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

Ext.define('Ext.oa.Zfs__Snapshot_Panel', {

  alias: 'widget.zfs__snapshot__panel',
  extend: 'Ext.Panel',
  initComponent: function(){
    var zfsSnapPanel = this;

    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: gettext('Zfs Snapshots'),
      id: "zfs__snapshot_panel_inst",
      layout: "border",
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0];
          Ext.StoreMgr.get('zfs_volumestore').load();
          Ext.StoreMgr.get('zfs_subvolumestore').load();
        }
      }, {
        text: gettext('Create Snapshot'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: gettext('Add Snapshot'),
            layout: "fit",
            height: 110,
            width: 450,
            frame: true,
            items: [{
              xtype: "form",
              bodyStyle: 'padding:5px 5px;',
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [{
                fieldLabel: "Snapshotname",
                width: 300,
                id: 'snapshotnamefield',
                name: 'snapshotnamefield'
              }],
              buttons: [{
                text: gettext('Create Snapshot'),
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  var sm = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab().getSelectionModel();
                  if( sm.hasSelection() ){
                    var sel = sm.selected.items[0];
                    var tab = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab();
                    if (tab.id === "volumepanel"){
                      lvm__ZfsSnapshot.create({
                        "volume": {
                          "app": "lvm",
                          "obj": "LogicalVolume",
                          "id": sel.data.id
                        },
                        "snapname":  Ext.ComponentQuery.query("[name=snapshotnamefield]", self.ownerCt.ownerCt)[0].getValue()
                      }, function (provider, response){
                        addwin.close();
                        Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: {
                          "volume_id"        : sel.data.id,
                          "subvolume__isnull": true
                        }});
                      });
                    }
                    else {
                      lvm__ZfsSnapshot.create({
                        "volume": sel.raw.volume,
                        "snapname": Ext.ComponentQuery.query("[name=snapshotnamefield]", self.ownerCt.ownerCt)[0].getValue(),
                        "subvolume": {
                          "app": "lvm",
                          "obj": "ZfsSubvolume",
                          "id": sel.data.id
                        }
                      }, function (provider, response){
                        addwin.close();
                        Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: {
                          "subvolume__isnull": false,
                          "subvolume__id"    : sel.data.id
                        }});
                      });
                    }
                  }
                  else {
                    addwin.close();
                    Ext.Msg.alert("Missing Volume","Please select a volume first");
                  }
                }
              }]
            }]
          });
          sysutils__System.get_time(function(provider, response){
            Ext.ComponentQuery.query("[name=snapshotnamefield]", self.ownerCt)[0].setValue(new Date(response.result * 1000).format("d-m-Y_H-i-s"));
          });
          addwin.show();
        }
      }, {
        text: gettext('Rollback Snapshot'),
        icon: MEDIA_URL + "/icons2/16x16/actions/go-last.png",
        handler: function(self){
          var sm = Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selected.items[0];
            Ext.Msg.confirm(
              gettext('Confirm rollback'),
              interpolate(
                gettext('Really rollback snapshot %s ?<br /><b>There is no undo.</b>'),
                [sel.data.snapname] ),
              function(btn, text){
                if( btn === 'yes' ){
                  lvm__ZfsSnapshot.rollback( sel.data.id, function (provider, response){
                    var sm = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab().getSelectionModel();
                    var sel = sm.selected.items[0];
                    var tab = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab();
                    var params_dict = {};

                    if (tab.id === "volumepanel"){
                      params_dict["subvolume__isnull"] = true;
                      if( sm.hasSelection() ){
                        params_dict["volume_id"] = sel.data.id;
                      }
                    }
                    else
                    {
                      params_dict["subvolume__isnull"] = false;
                      if( sm.hasSelection() ){
                        params_dict["subvolume__id"] = sel.data.id;
                      }
                    }
                    Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: params_dict});
                  });
                }
              }
            );
          }
        }
      }, {
        text: gettext('Delete Snapshot'),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selected.items[0];
            Ext.Msg.confirm(
              gettext('Confirm delete'),
              interpolate(
                gettext('Really delete snapshot %s ?<br /><b>There is no undo.</b>'),
                [sel.data.snapname] ),
              function(btn, text){
                if( btn === 'yes' ) {
                  lvm__ZfsSnapshot.remove( sel.data.id, function (provider, response){
                    var sm = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab().getSelectionModel();
                    var sel = sm.selected.items[0];
                    var tab = Ext.ComponentQuery.query("[name=tabpanel]", zfsSnapPanel)[0].getActiveTab();
                    var params_dict = {};

                    if (tab.id === "volumepanel"){
                      params_dict["subvolume__isnull"] = true;
                      if( sm.hasSelection() ){
                        params_dict["volume_id"] = sel.data.id;
                      }
                    }
                    else
                    {
                      params_dict["subvolume__isnull"] = false;
                      if( sm.hasSelection() ){
                        params_dict["subvolume__id"] = sel.data.id;
                      }
                    }
                    Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: params_dict});
                  });
                }
              }
            );
          }
        }
      } ],
      items: [{
        xtype: "tabpanel",
        region: "center",
        id: 'tabpanel',
        name: "tabpanel",
        activeTab: 0,
        border: false,
        items: [{
          xtype: "grid",
          title: gettext("Volumes"),
          id: "volumepanel",
          autoScroll: true,
          forceFit: true,
          store: function(){
            Ext.define('zfs_volumestore', {
              extend: 'Ext.data.Model',
              fields: [
                {name: 'name'}
              ]
            });
            return Ext.create('Ext.data.Store', {
              id: "zfs_volumestore",
              model: "zfs_volumestore",
              proxy: {
                type: 'direct',
                extraParams: { "filesystem": "zfs" },
                startParam: undefined,
                limitParam: undefined,
                pageParam:  undefined,
                directFn: lvm__LogicalVolume.filter
              },
              autoLoad: true
            });
          }(),
          defaults: {
            sortable: true
          },
          columns: [{
            header: gettext('Volume'),
            dataIndex: "name"
          }],
          listeners: {
            cellclick: function( self, td, cellIndex, record, tr, rowIndex, e, eOpts ){
              var record = self.getStore().getAt(rowIndex);
              Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: {
                "volume__name": record.data.name,
                "subvolume__isnull": true
              }});
            }
          }
        }, {
          xtype: "grid",
          title: gettext("Subvolumes"),
          id: "subvolumepanel",
          autoScroll: true,
          forceFit: true,
          store: function(){
            Ext.define('zfs_subvolumestore_model', {
              extend: 'Ext.data.Model',
              fields: [
                {name: 'volname'},
                {name: 'orivolume', mapping: 'volume', convert: function(val, row){
                  if( val === null ){
                    return null;
                  }
                  return val.__unicode__;
                }}
              ]
            });
            return Ext.create('Ext.data.Store', {
              id: 'zfs_subvolumestore',
              model: "zfs_subvolumestore_model",
              proxy: {
                type: 'direct',
                startParam: undefined,
                limitParam: undefined,
                pageParam:  undefined,
                directFn: lvm__ZfsSubvolume.all,
              },
              autoLoad: true
            });
          }(),
          defaults: {
            sortable: true
          },
          columns: [{
            header: gettext('Subvolume'),
            dataIndex: "volname"
          },{
            header: gettext('Volume'),
            dataIndex: "orivolume"
          }],
          listeners: {
            activate: function(self){
              Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.removeAll();
            },
            deactivate : function(self){
              Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.removeAll();
            },
            cellclick: function( self, td, cellIndex, record, tr, rowIndex, e, eOpts){
              var record = self.getStore().getAt(rowIndex);
              Ext.ComponentQuery.query("[region=south]", zfsSnapPanel)[0].store.load({ params: {"subvolume__id": record.data.id}});
            }
          }
        }],
      }, {
        xtype: "grid",
        region: "south",
        autoScroll: true,
        height: 300,
        forceFit: true,
        id: "snapgrid",
        name: "snapgrid",
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Snapshots'),
          dataIndex: "snapname"
        },{
          header: gettext('Created'),
          dataIndex: "created_at"
        }],
        store: function(){
          Ext.define('zfs_snapshot_store', {
            extend: 'Ext.data.Model',
            fields: [
              {name: 'snapname'},
              {name: 'created_at'},
              {name: 'id'}
            ]
          });
          return Ext.create('Ext.data.Store', {
            model: "zfs_snapshot_store",
            proxy: {
              type: 'direct',
              startParam: undefined,
              limitParam: undefined,
              pageParam:  undefined,
              directFn: lvm__ZfsSnapshot.filter
            }
          });
        }()
      }]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
    Ext.StoreMgr.get('zfs_volumestore').load();
    Ext.StoreMgr.get('zfs_subvolumestore').load();
  }
});


Ext.oa.Zfs__Snapshot_Module = {
  panel: ["zfs__snapshot__panel","zfs__subvolume__panel"],

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "ZFS",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/ascii.png',
      panel: "zfs__snapshot_panel_inst",
      children: [{
        text: gettext('Zfs Snapshots'),
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/actions/document-save-as.png',
        panel: "zfs__snapshot_panel_inst"
      },{
        text: gettext('Zfs Subvolume'),
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/places/network.png',
        panel: "zfs__subvolume_panel_inst"
      }]
    });
  }
};


window.MainViewModules.push( Ext.oa.Zfs__Snapshot_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
