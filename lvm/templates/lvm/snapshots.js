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

Ext.oa.Lvm__Snapshot_Panel = Ext.extend(Ext.oa.Lvm__LogicalVolume_Panel, {
  id: "lvm__snapshot_panel_inst",
  title: gettext("Logical Volume Snapshots"),
  filterParams: {
    "snapshot__isnull": false
  },
  texts: {
    add:     gettext('Add Snapshot'),
    remove:  gettext('Delete Snapshot')
  },
  form: {
    items: [{
      xtype:      'combo',
      allowBlank: false,
      fieldLabel: gettext('Original Volume'),
      hiddenName: 'snapshot',
      store: new Ext.data.DirectStore({
        fields: ["id", "name", "megs", "vg", "owner", "fswarning", "fscritical"],
        baseParams: {
          kwds: {
            "snapshot__isnull": true,
            "__exclude__": {
              "filesystem": "zfs"
            },
            "__fields__": ["id", "name", "megs", "vg", "owner", "fswarning", "fscritical"]
          }
        },
        paramOrder: ["kwds"],
        directFn: lvm__LogicalVolume.filter
      }),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:      'volfield',
      listeners: {
        select: function(self, record, index){
          "use strict";
          self.ownerCt.vgfield.setValue( record.data.vg );
          self.ownerCt.fswarningfield.setValue( record.data.fswarning );
          self.ownerCt.fscriticalfield.setValue( record.data.fscritical );
          self.ownerCt.ownerfield.setValue( record.data.owner );
          self.ownerCt.namefield.setValue( record.data.name + "_snapshot_" +
            new Date().format("d-m-Y_H-i-s") );
          self.ownerCt.sizelabel.setText( gettext('Querying data...') );
          self.ownerCt.sizefield.disable();
          lvm__VolumeGroup.get_free_megs( record.data.vg, function( provider, response ){
            self.ownerCt.sizefield.maxValue = response.result;
            self.ownerCt.sizelabel.setText( String.format( "Max. {0} MB", response.result ) );
            if( record.data.megs <= response.result ){
              self.ownerCt.sizefield.setValue( record.data.megs );
            }
            else{
              self.ownerCt.sizefield.setValue( response.result );
            }
            self.ownerCt.sizefield.enable();
          } );
        }
      }
    }, {
      xtype: "hidden",
      ref: "vgfield",
      name: "vg",
      value: "0"
    }, {
      xtype: "hidden",
      ref: "ownerfield",
      name: "owner",
      value: "0"
    }, {
      xtype: "hidden",
      ref: "fswarningfield",
      name: "fswarning",
      value: "0"
    }, {
      xtype: "hidden",
      ref: "fscriticalfield",
      name: "fscritical",
      value: "0"
    }, {
      fieldLabel: gettext('Name'),
      name: "name",
      allowBlank: false,
      ref: 'namefield'
    }, tipify({
      xtype: "numberfield",
      minValue: 100,
      fieldLabel: gettext('Size in MB'),
      allowBlank: false,
      name: "megs",
      ref: 'sizefield'
    },gettext('Please consider, that the size of your snapshot depends on the kind and frequency of change.')), {
      xtype: "label",
      ref:   "sizelabel",
      text:  gettext('Waiting for volume selection...'),
      cls:   "form_hint_label"
    }]
  },
  initComponent: function(){
    "use strict";
    var i;
    // Add extra columns (deep-copied)
    var oldcolumns = Ext.oa.Lvm__Snapshot_Panel.superclass.columns;
    var mycolumns = [];
    mycolumns.push(
      Ext.apply({}, oldcolumns[0]),
      Ext.apply({}, oldcolumns[1]));
    mycolumns[0].header = gettext("Snapshot");
    mycolumns.push({
      header: gettext('Snapshot usage (%)'),
      dataIndex: "LVM2_SNAP_PERCENT",
      align: "right",
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
            cls:   ( val > store.data.fscritical ? "lv_used_crit" :
                    (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok"))
          });
        }).defer(25);
        return '<span id="' + id + '"></span>';
      }
    }, {
      header: gettext('Original Volume'),
      dataIndex: "origvolname"
    });
    for( i = 2; i < oldcolumns.length; i++ ){
      mycolumns.push(Ext.apply({}, oldcolumns[i]));
    }
    this.columns = mycolumns;
    // Add extra store fields (deep-copied)
    var myfields = [];
    this.store = Ext.oa.Lvm__Snapshot_Panel.superclass.store;
    var oldfields = this.store.fields;
    for( i = 0; i < oldfields.length; i++ ){
      myfields.push(Ext.apply({}, oldfields[i]));
    }
    this.store.fields = myfields;
    this.store.fields.push({
      name: 'origvolid',
      mapping: 'snapshot',
      convert: function( val, row ){
        if( val === null ){
          return null;
        }
        return val.id;
      }
    }, {
      name: 'origvolname',
      mapping: 'snapshot',
      convert: function( val, row ){
        if( val === null ){
          return null;
        }
        return val.name;
      }
    }, 'LVM2_SNAP_PERCENT');
    // Render the Panel
    Ext.oa.Lvm__Snapshot_Panel.superclass.initComponent.apply(this, arguments);
    // Add a store listener to populate the SNAP_PERCENT column
    this.store.on("load", function(self){
      var j;
      var mkUpdateHandler = function(idx){
        return function(provider, response){
          self.data.items[idx].set("LVM2_SNAP_PERCENT",
            response.result.LVM2_DATA_PERCENT || response.result.LVM2_SNAP_PERCENT);
          self.commitChanges();
        };
      };
      for (j = 0; j < self.data.length; j++){
        lvm__LogicalVolume.lvm_info( self.data.items[j].id, mkUpdateHandler(j) );
      }
    });
  }
});

Ext.reg("lvm__snapshot_panel", Ext.oa.Lvm__Snapshot_Panel);

Ext.oa.Lvm__Snapshot_Module = Ext.extend(Object, {
  panel: "lvm__snapshot_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Snapshots'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/snapshot.png',
      panel: "lvm__snapshot_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Snapshot_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
