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

Ext.Ajax.on("beforerequest", function(conn, options){
    conn.timeout = 10 * 60 * 1000;
});

Ext.define('Ext.oa.Lvm__Snapshot_Panel', {
  alias: 'widget.lvm__snapshot_panel',
  extend: 'Ext.oa.Lvm__LogicalVolume_BasePanel',
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
      name: 'snapshot',
      store: (function(){
        Ext.define('lvm_snapshot_model', {
          extend: 'Ext.data.Model',
          fields: ["id", "name", "megs", "vg", "owner", "fswarning", "fscritical"]
        });
        return Ext.create('Ext.data.Store', {
          model: "lvm_snapshot_model",
          proxy: {
            type: 'direct',
            directFn: lvm__LogicalVolume.filter,
            startParam: undefined,
            limitParam: undefined,
            pageParam:  undefined,
            extraParams: {
              kwds: {
                "snapshot__isnull": true,
                "__exclude__": {
                  "filesystem": "zfs"
                },
                "__fields__": ["id", "name", "megs", "vg", "owner", "fswarning", "fscritical"]
              }
            }
          }
        });
      }()),
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:      'volfield',
      listeners: {
        select: function(self, record, index){
          self.ownerCt.vgfield.setValue( record.data.vg.id );
          self.ownerCt.fswarningfield.setValue( record.data.fswarning );
          self.ownerCt.fscriticalfield.setValue( record.data.fscritical );
          self.ownerCt.ownerfield.setValue( record.data.owner.id );
          self.ownerCt.namefield.setValue( record.data.name + "_snapshot_" +
            new Date().format("d-m-Y_H-i-s") );
          self.ownerCt.sizelabel.setText( gettext('Querying data...') );
          self.ownerCt.sizefield.disable();
          lvm__VolumeGroup.get_free_megs( record.data.vg, function( provider, response ){
            self.ownerCt.sizefield.maxValue = response.result;
            self.ownerCt.sizelabel.setText( Ext.String.format( "Max. {0} MB", response.result ) );
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
    // Add extra columns
    var mycolumns = this.getColumns();
    mycolumns[0].header = gettext("Snapshot");
    mycolumns.splice(2, 0, {
      header: gettext('Snapshot usage (%)'),
      dataIndex: "LVM2_SNAP_PERCENT",
      align: "right",
      renderer: function( val, x, store ){
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
            cls:   ( val > store.data.fscritical ? "lv_used_crit" :
                    (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok"))
          });
        }, 25);
        return '<span id="' + id + '"></span>';
      }
    }, {
      header: gettext('Original Volume'),
      dataIndex: "origvolname"
    });
    this.columns = mycolumns;
    // Add extra store fields
    var mystore = this.getStore();
    mystore.fields.push({
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
      convert: toUnicode
    }, 'LVM2_SNAP_PERCENT');
    this.store = mystore;
    // Add extra buttons
    var mybuttons = this.getButtons();
//     mybuttons.splice(2, 0, {
//       text: gettext("Rollback"),
//       handler: function(btn){
//         var self = this;
//         var sm = this.getSelectionModel();
//         if( sm.hasSelection() ){
//           var sel = sm.selections.items[0];
//           Ext.Msg.prompt(
//             self.texts.remove,
//             gettext('What was the name of the volume you wish to rollback again?<br /><b>This will delete the snapshot.</b>'),
//             function(btn, text){
//               if( btn === 'ok' ){
//                 if( text == sel.data.name || text == sel.data.origvolname ){
//                   lvm__LogicalVolume.merge(sel.data.id, function(provider, response){
//                     self.store.load();
//                   });
//                 }
//                 else{
//                   Ext.Msg.alert(self.texts.remove, gettext("Hm, that doesn't seem right..."));
//                 }
//               }
//               else{
//                 Ext.Msg.alert(self.texts.remove, gettext("As you wish."));
//               }
//             }
//           );
//         }
//       }
//     });
    this.buttons = mybuttons;
    // Render the Panel
    this.callParent(arguments);
    // Add a store listener to populate the SNAP_PERCENT column
    this.store.on("load", function(self){
      var j;
      var mkUpdateHandler = function(idx){
        return function(provider, response){
          self.data.items[idx].set("LVM2_SNAP_PERCENT",
            response.result.LVM2_DATA_PERCENT || response.result.LVM2_SNAP_PERCENT);
          self.data.each(
            function(record, index, data){
              record.commit();
            }
          );
        };
      };
      for (j = 0; j < self.data.length; j++){
        lvm__LogicalVolume.lvm_info( self.data.items[j].data.id, mkUpdateHandler(j) );
      }
    });
  },
  deleteConfirm: function(sel, handler, scope){
    Ext.Msg.prompt(
      this.texts.remove,
      gettext('What was the name of the volume you wish to delete again?<br /><b>There is no undo and you will lose all data.</b>'),
      function(btn, text){
        if( btn === 'ok' ){
          if( text == sel.data.name || text == sel.data.origvolname ){
            handler.apply(scope, ['yes'] /* teehee */);
          }
          else{
            Ext.Msg.alert(this.texts.remove, gettext("Hm, that doesn't seem right..."));
          }
        }
        else{
          Ext.Msg.alert(this.texts.remove, gettext("As you wish."));
        }
      },
      scope
    );
  }
});


Ext.oa.Lvm__Snapshot_Module = {
  panel: "lvm__snapshot_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Snapshots'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/actions/document-save-as.png',
      panel: "lvm__snapshot_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.Lvm__Snapshot_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
