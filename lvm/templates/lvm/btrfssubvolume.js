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

Ext.define('Ext.oa.Lvm__BtrfsSubvolume_Panel', {
  alias: 'widget.lvm__btrfssubvolume_panel',
  extend: 'Ext.oa.ShareGridPanel',
  api: lvm__BtrfsSubvolume,
  id: "lvm_btrfssubvolume_panel_inst",
  title: "BTRFS",
  allowEdit: false,
  texts: {
    add:     gettext('Add Subvolume'),
    edit:    gettext('Edit Subvolume'),
    remove:  gettext('Delete Subvolume')
  },
  columns: [{
    header: gettext('Name'),
    width: 100,
    dataIndex: "name"
  }, {
    header: gettext('Volume'),
    width: 200,
    dataIndex: "volumename"
  }, {
    header: gettext('Snapshot of volume'),
    width: 200,
    dataIndex: "origname"
  }, {
    header: gettext('Read only'),
    width: 200,
    dataIndex: "readonly",
    renderer: function(val, x, record){
      if( record.raw.snapshot === null ) return '';
      return Ext.oa.renderBoolean(val, x, record);
    }
  }],
  store:{
    fields: [{
      name: 'volumename',
      mapping: 'volume',
      convert: toUnicode
    }, {
      name: 'origname',
      mapping: 'snapshot',
      convert: toUnicode
    }]
  },
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'BTRFS Subvolume',
      layout: 'form',
      items: [ {
          xtype: 'textfield',
          fieldLabel: gettext('Name'),
          name: "name"
        },
        tipify({
          xtype: 'volumefield',
          extraParams: {
            kwds: {
              filesystem: "btrfs"
            }
          },
          listeners: {
            select: function(self, record, index){
              var origfield = Ext.ComponentQuery.query("[name=snapshot]", self.ownerCt)[0];
              origfield.store.proxy.extraParams.volume__id = record[0].data.id;
              origfield.store.load();
              origfield.enable();
            }
          }
        }, gettext('Please select the base volume.')),
        {
          xtype:      'combo',
          allowBlank: true,
          fieldLabel: gettext('Snapshot of...'),
          name: 'snapshot',
          store: (function(){
            Ext.define('btrfssubvolume_filter_store_model', {
              extend: 'Ext.data.Model',
              fields: [
                {name: 'id'},
                {name: 'name'}
              ]
            });
            return Ext.create('Ext.data.Store', {
              model: "btrfssubvolume_filter_store_model",
              proxy: {
                type: 'direct',
                directFn: lvm__BtrfsSubvolume.filter_combo,
                paramOrder: ["field", "query", "kwds"],
                extraParams: {
                  field: "name",
                  query: "",
                  kwds: {
                  snapshot__isnull: true
                  }
                }
              },
              autoLoad: true
            });
          }()),
          typeAhead:     true,
          disabled:      true,
          triggerAction: 'all',
          deferEmptyText: false,
          emptyText:     gettext('Select...'),
          selectOnFocus: true,
          displayField:  'name',
          valueField:    'id'
        }, {
          xtype: 'checkbox',
          fieldLabel: gettext('Read Only'),
          name: "readonly"
        }
      ]
    }]
  }
});


Ext.oa.Lvm__BtrfsSubvolume_Module =  {
  panel: "lvm__btrfssubvolume_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('BTRFS'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/ascii.png',
      panel: 'lvm_btrfssubvolume_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Lvm__BtrfsSubvolume_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
