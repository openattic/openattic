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

Ext.oa.volumeGroup_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    "use strict";
    var volumeGroupPanel = this;
    var diskexpander = new Ext.ux.grid.RowExpander({
      tpl: '<div style="margin: 10px"></div>',
      listeners: {
        expand: function(self, record, bodyEl, rowIndex){
          bodyEl.grid = new Ext.grid.GridPanel({
            id: Ext.id(),
            renderTo: bodyEl.childNodes[0],
            height: 225,
            viewConfig:{ forceFit: true },
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: gettext('Slot'),
                dataIndex: "enclslot"
              },{
                header: gettext('Status'),
                dataIndex: "status"
              },{
                header: gettext('Size'),
                dataIndex: "size"
              },{
                header: gettext('Model'),
                dataIndex: "model"
              },{
                header: gettext('Serial'),
                dataIndex: "serial"
              },{
                header: gettext('Uptime (h)'),
                dataIndex: "power_on_h"
              },{
                header: gettext('Type'),
                dataIndex: "disktype"
              },{
                header: gettext('Temp. (°C)'),
                dataIndex: "temp_c"
              },{
                header: gettext('RPM'),
                dataIndex: "rpm"
              }]
            }),
            store: new Ext.data.DirectStore({
              directFn: twraid__Disk.filter,
              fields: [
                "enclslot", "status", "unitindex", "serial", "linkspeed", "power_on_h", "disktype",
                "port", "temp_c", "model", "rpm", "size"
              ],
              baseParams: {unit__id: record.data.id},
              autoLoad: true
            })
          });
        },
        collapse: function(self, record, bodyEl, rowIndex){
          bodyEl.grid.destroy();
        }
      }
    });
    var expander = new Ext.ux.grid.RowExpander({
      tpl: '<div style="margin: 10px"></div>',
      listeners: {
        expand: function(self, record, bodyEl, rowIndex){
          bodyEl.grid = new Ext.grid.GridPanel({
            id: Ext.id(),
            renderTo: bodyEl.childNodes[0],
            height: 500,
            viewConfig:{ forceFit: true },
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [diskexpander, {
                header: gettext('Name'),
                dataIndex: "name"
              },{
                header: gettext('Status'),
                dataIndex: "status"
              },{
                header: gettext('Type'),
                dataIndex: "unittype"
              },{
                header: gettext('Serial'),
                dataIndex: "serial"
              }]
            }),
            store: new Ext.data.DirectStore({
              directFn: twraid__Unit.find_by_vg,
              fields: [
                "status", "index", "name", "verify", "rebuild", "rdcache", "wrcache",
                "unittype", "autoverify", "serial", "size", "chunksize", "id"
              ],
              paramOrder: ["id"],
              baseParams: {id: record.data.id},
              autoLoad: true
            }),
            plugins: diskexpander
          });
        },
        collapse: function(self, record, bodyEl, rowIndex){
          bodyEl.grid.destroy();
        }
      }
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumeGroup_panel_inst",
      title: gettext('Volume Groups'),
      layout: 'fit',
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          volumeGroupPanel.store.reload();
        }
      },{
        text: gettext('Create VG or Add Disk'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var initwin = new Ext.Window({
            title: gettext('Initialize'),
            layout: "fit",
            height: 150,
            width: 500,
            items: [{
              xtype: "form",
              autoScroll: true,
              border: false,
              bodyStyle: 'padding:5px 5px;',
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [tipify({ 
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: gettext('Disk'),
                name:       'disk',
                hiddenName: 'disk_id',
                store: new Ext.data.DirectStore({
                  fields: [ "rev", "model", "vendor", "block", "type", {
                    name: 'block_model',
                    mapping: 'block',
                    convert: function(val, row) {
                      if( val === null ){
                        return null;
                      }
                      return val + " - " + row.model;
                    }
                  } ],
                  directFn: lvm__VolumeGroup.get_devices
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                forceSelection: true,
                displayField:  'block_model',
                valueField:    'block',
                ref:           'diskfield',
                listeners: {
                  select: function(self, record, index){
                    var disk = self.getValue();
                    self.ownerCt.usagelabel.setText( gettext('Querying data...') );
                    lvm__VolumeGroup.is_device_in_use( disk, function( provider, response ){
                      if( response.result === false ){
                        self.ownerCt.usagelabel.setText(
                          interpolate(gettext('Disk %s is not currently used.'), [disk])
                          );
                        self.ownerCt.initbutton.enable();
                      }
                      else if( response.result[1] === "pv" ){
                        self.ownerCt.usagelabel.setText(
                          interpolate(
                            gettext('Disk %(disk)s is part of the Volume Group %(vg)s, refusing to touch it.'),
                            { "disk": disk, "vg": response.result[2] }, true )
                        );
                        self.ownerCt.initbutton.disable();
                      }
                      else{
                        self.ownerCt.usagelabel.setText(
                          interpolate( gettext('Disk %(disk)s is mounted as %(mount)s, refusing to touch it.'),
                            { "disk": disk, "mount": response.result[2] }, true )
                        );
                        self.ownerCt.initbutton.disable();
                      }
                    } );
                  }
                }
              }, gettext('Please select the disk you wish to add to the volume group.')), {
                xtype: "label",
                height: 100,
                ref:   "usagelabel",
                text:  gettext('Waiting for disk selection...')
//                 cls:   "form_hint_label"
              }, 
              tipify({
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: gettext('Volume Group'),
                name:       'volume',
                hiddenName: 'volume_id',
                store: new Ext.data.DirectStore({
                  fields: ["app", "obj", "id", "__unicode__"],
                  directFn: lvm__VolumeGroup.ids
                }),
                typeAhead:     false,
                triggerAction: 'all',
                emptyText:     'Select...',
                forceSelection: false,
                selectOnFocus: true,
                displayField:  '__unicode__',
                valueField:    'id',
                ref:           'vgfield',
                listeners: {
                  select: function(self, record, index){
                  }
                }
              }, gettext('Please select the volume group. In order to create a new one, enter its name.'))],
              buttons: [{
                text: gettext('Initialize'),
                ref: "../initbutton",
                disabled: true,
                handler: function(self){
                  var progresswin = new Ext.Window({
                    title: gettext('Initialize'),
                    layout: "fit",
                    height: 250,
                    width: 400,
                    modal: true,
                    html: gettext('Please wait...')
                  });
                  progresswin.show();
                  var vg   = self.ownerCt.ownerCt.vgfield.getValue();
                  var disk = self.ownerCt.ownerCt.diskfield.getValue();
                  var done = function( provider, response ){
                    initwin.hide();
                    progresswin.hide();
                    Ext.Msg.alert(gettext('Success!'),
                      gettext('The Device has been successfully initialized.'));
                    volumeGroupPanel.store.reload();
                  };
                  if( typeof vg === "number" ){
                    lvm__VolumeGroup.join_device( vg, disk, done );
                  }
                  else if( typeof vg === "string" ){
                    lvm__VolumeGroup.create({name: vg}, function( provider, response ){
                      lvm__VolumeGroup.join_device( response.result.id, disk, done );
                    });
                  }
                }
              }]
            }]
          });
          initwin.show();
        }
      },{
        text: gettext('Delete Group'),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = volumeGroupPanel.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            lvm__LogicalVolume.filter({"vg__name":sel.data.name},function(provider, response){
              var vgremove = function(){
                Ext.Msg.confirm(
                  gettext('Confirm delete'),
                  interpolate(
                    gettext('Really delete Group %s?'),
                    [sel.data.name] ),
                  function(btn, text){
                    if( btn === 'yes' ){
                      lvm__VolumeGroup.remove( sel.data.id, function(provider, response){
                        volumeGroupPanel.store.reload();
                      } );
                    }
                  }
                );
              };
              if(response.result.length > 0){
                Ext.Msg.confirm(
                  "Confirm delete",
                  interpolate(gettext('Volumes found in this group. Delete all remaining volumes?')),
                  function(btn, text){
                    if(btn === 'yes'){
                      vgremove();
                    }
                  }
                );
              }
              else{
                vgremove();
              }
            });
          }
        }
      }],
      viewConfig: { forceFit: true },
      store: new Ext.data.DirectStore({
        fields: ['id', 'name',"LVM_VG_FREE","LVM_VG_SIZE","LVM_VG_ATTR", "LVM_VG_PERCENT", {
          name: "hostname",
          mapping: "host",
          convert: toUnicode
        }],
        directFn: lvm__VolumeGroup.all,
        listeners: {
          load: function(self){
            var i;
            var handleResponse = function(i){
              return function(provider, response){
                if( response.type === "exception" ){
                  self.data.items[i].set("LVM_VG_PERCENT", '?');
                  self.data.items[i].set("LVM_VG_SIZE", '?');
                  self.data.items[i].set("LVM_VG_FREE", '?');
                  self.data.items[i].set("LVM_VG_ATTR", '?');
                  return;
                }
                self.data.items[i].set( "LVM_VG_PERCENT",
                  ((response.result.LVM2_VG_SIZE - response.result.LVM2_VG_FREE) /
                    response.result.LVM2_VG_SIZE * 100.0).toFixed(2)
                );
                if( response.result.LVM2_VG_SIZE >= 1000 ){
                  self.data.items[i].set("LVM_VG_SIZE", String.format("{0} GB",
                    (response.result.LVM2_VG_SIZE / 1000).toFixed(2)));
                }
                else
                {
                  self.data.items[i].set("LVM_VG_SIZE", String.format("{0} MB", response.result.LVM2_VG_SIZE));
                }
                if( response.result.LVM2_VG_FREE >= 1000 ){
                  self.data.items[i].set("LVM_VG_FREE", String.format("{0} GB",
                    (response.result.LVM2_VG_FREE / 1000).toFixed(2)));
                }
                else
                {
                  self.data.items[i].set("LVM_VG_FREE", String.format("{0} MB", response.result.LVM2_VG_FREE));
                }
                self.data.items[i].set("LVM_VG_ATTR", response.result.LVM2_VG_ATTR);
                self.commitChanges();
              };
            };
            for( i = 0; i < self.data.length; i++ ){
              lvm__VolumeGroup.lvm_info(self.data.items[i].id, handleResponse(i));
            }
          }
        }
      }),
      ref: 'volumegroupGrid',
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [expander, {
          header: gettext('Name'),
          dataIndex: "name"
        },{
          header: gettext('Host'),
          dataIndex: "hostname"
        },{
          header: gettext('Size'),
          dataIndex: "LVM_VG_SIZE",
          renderer: function(val){ if( val ){ return val; } return '♻'; }
        },{
          header: gettext('Free'),
          dataIndex: "LVM_VG_FREE",
          renderer: function(val){ if( val ){ return val; } return '♻'; }
        },{
          header: gettext('Used%'),
          dataIndex: "LVM_VG_PERCENT",
          renderer: function( val, x, store ){
            if( !val || val === -1 ){
              return '♻';
            }
            var id = Ext.id();
            (function(){
              if( Ext.get(id) === null ){
                return;
              }
              new Ext.ProgressBar({
                renderTo: id,
                value: val/100.0,
                text:  String.format("{0}%", val),
                cls:   ( val > 85 ? "lv_used_crit" :
                        (val > 70 ? "lv_used_warn" : "lv_used_ok"))
              });
            }).defer(25);
            return '<span id="' + id + '"></span>';
          }
        },{
          header: gettext('Attributes'),
          dataIndex: "LVM_VG_ATTR",
          renderer: function(val){ if( val ){ return val; } return '♻'; }
        }]
      }),
      plugins: [expander]
    }));
    Ext.oa.volumeGroup_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.volumeGroup_Panel.superclass.onRender.apply(this, arguments);
    this.store.load();
  }
});

Ext.reg("volumeGroup_Panel", Ext.oa.volumeGroup_Panel);

Ext.oa.volumeGroup_Module = Ext.extend(Object, {
  panel: "volumeGroup_Panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Disk Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumeGroup_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.volumeGroup_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
