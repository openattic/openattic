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

Ext.oa.Zfs__Snapshot_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    "use strict";
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
          zfsSnapPanel.snapGrid.store.reload();
          Ext.StoreMgr.get('zfs_volumestore').reload();
          Ext.StoreMgr.get('zfs_subvolumestore').reload();
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
                ref: 'snapshotnamefield'
              }],
              buttons: [{
                text: gettext('Create Snapshot'),
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  var sm = zfsSnapPanel.tabpanel.getActiveTab().getSelectionModel();
                  if( sm.hasSelection() ){
                    var sel = sm.selections.items[0];
                    var tab = zfsSnapPanel.tabpanel.getActiveTab();
                    if (tab.id === "volumepanel"){
                      lvm__ZfsSnapshot.create({
                        "volume": {
                          "app": "lvm",
                          "obj": "LogicalVolume",
                          "id": sel.id
                        },
                        "snapname":  self.ownerCt.ownerCt.snapshotnamefield.getValue()
                      }, function (provider, response){
                        addwin.hide();
                        zfsSnapPanel.snapGrid.store.reload();
                      });
                    }
                    else {
                      lvm__ZfsSnapshot.create({
                        "snapname": self.ownerCt.ownerCt.snapshotnamefield.getValue(),
                        "subvolume": {
                          "app": "lvm",
                          "obj": "ZfsSubvolume",
                          "id": sel.id
                        }
                      }, function (provider, response){
                        addwin.hide();
                        zfsSnapPanel.snapGrid.store.reload();
                      });
                    }
                  }
                  else {
                    addwin.hide();
                    Ext.Msg.alert("Missing Volume","Please select a volume first");
                  }
                }
              }]
            }]
          });
          sysutils__System.get_time(function(provider, response){
            addwin.items.items[0].snapshotnamefield.setValue(new Date(response.result * 1000).format("d-m-Y_H-i-s"));
          });
          addwin.show();
        }
      }, {
        text: gettext('Rollback Snapshot'),
        icon: MEDIA_URL + "/icons2/16x16/actions/go-last.png",
        handler: function(self){
          var sm = zfsSnapPanel.snapGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              gettext('Confirm rollback'),
              interpolate(
                gettext('Really rollback snapshot %s ?<br /><b>There is no undo.</b>'),
                [sel.data.snapname] ),
              function(btn, text){
                if( btn === 'yes' ){
                  lvm__ZfsSnapshot.rollback( sel.data.id, function (provider, response){
                    zfsSnapPanel.snapGrid.store.reload();
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
          var sm = zfsSnapPanel.snapGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              gettext('Confirm delete'),
              interpolate(
                gettext('Really delete snapshot %s ?<br /><b>There is no undo.</b>'),
                [sel.data.snapname] ),
              function(btn, text){
                if( btn === 'yes' ) {
                  lvm__ZfsSnapshot.remove( sel.data.id, function (provider, response){
                    zfsSnapPanel.snapGrid.store.reload();
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
        ref: "tabpanel",
        activeTab: 0,
        border: false,
        items: [{
          xtype: "grid",
          title: gettext("Volumes"),
          id: "volumepanel",
          autoScroll: true,
          viewConfig: { forceFit: true },
          store: new Ext.data.DirectStore({
            fields: ['name'],
            baseParams: { "filesystem": "zfs" },
            directFn: lvm__LogicalVolume.filter,
            storeId:  'zfs_volumestore'
          }),
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: gettext('Volume'),
              dataIndex: "name"
            }]
          }),
          listeners: {
            cellclick: function( self, rowIndex, colIndex, evt ){
              var record = self.getStore().getAt(rowIndex);
              zfsSnapPanel.snapGrid.store.load({ params: {
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
          viewConfig: { forceFit: true },
          store: new Ext.data.DirectStore({
            fields: ['volname', {
              name: 'orivolume',
              mapping: 'volume',
              convert: function(val, row){
                if( val === null ){
                  return null;
                }
                return val.name;
              }
            }],
            directFn: lvm__ZfsSubvolume.all,
            storeId:  'zfs_subvolumestore'
          }),
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: gettext('Subvolume'),
              dataIndex: "volname"
            },{
              header: gettext('Volume'),
              dataIndex: "orivolume"
            }]
          }),
          listeners: {
            activate: function(self){
              zfsSnapPanel.snapGrid.store.removeAll();
            },
            deactivate : function(self){
              zfsSnapPanel.snapGrid.store.removeAll();
            },
            cellclick: function( self, rowIndex, colIndex, evt ){
              var record = self.getStore().getAt(rowIndex);
              zfsSnapPanel.snapGrid.store.load({ params: {"subvolume__id": record.id}});
            }
          }
        }]
      }, {
        xtype: "grid",
        region: "south",
        autoScroll: true,
        height: 300,
        viewConfig: { forceFit: true },
        id: "snapgrid",
        ref: "snapGrid",
        store: new Ext.data.DirectStore({
          fields: ['snapname', 'created_at','id'],
          directFn: lvm__ZfsSnapshot.filter
        }),
        colModel: new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: gettext('Snapshots'),
            dataIndex: "snapname"
          },{
            header: gettext('Created'),
            dataIndex: "created_at"
          }]
        })
      }]
    }));
    Ext.oa.Zfs__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Zfs__Snapshot_Panel.superclass.onRender.apply(this, arguments);
    Ext.StoreMgr.get('zfs_volumestore').reload();
    Ext.StoreMgr.get('zfs_subvolumestore').reload();
  }
});

Ext.reg("zfs__snapshot_panel", Ext.oa.Zfs__Snapshot_Panel);

Ext.oa.Zfs__Snapshot_Module = Ext.extend(Object, {
  panel: ["zfs__snapshot_panel","zfs__subvolume_panel"],

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: "ZFS",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/ascii.png',
      panel: "zfs__snapshot_panel_inst",
      href: "#",
      children: [{
        text: gettext('Zfs Snapshots'),
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/actions/document-save-as.png',
        panel: "zfs__snapshot_panel_inst",
        href: '#'
      },{
        text: gettext('Zfs Subvolume'),
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/places/network.png',
        panel: "zfs__subvolume_panel_inst",
        href: '#'
      }]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Zfs__Snapshot_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
