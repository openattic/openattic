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

Ext.oa.Lvm__BtrfsSubvolume_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
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
      if( record.json.snapshot === null ) return '';
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
          baseParams: {
            kwds: {
              filesystem: "btrfs"
            }
          },
          listeners: {
            select: function(self, record, index){
              "use strict";
              self.ownerCt.origfield.store.baseParams.volume__id = record.data.id;
              self.ownerCt.origfield.store.reload();
              self.ownerCt.origfield.enable();
            }
          }
        }, gettext('Please select the base volume.')),
        {
          xtype:      'combo',
          allowBlank: true,
          fieldLabel: gettext('Snapshot of...'),
          hiddenName: 'snapshot',
          store: {
            xtype: "directstore",
            fields: ["id", "name"],
            directFn: lvm__BtrfsSubvolume.filter_combo,
            paramOrder: ["field", "query", "kwds"],
            baseParams: {
              field: "name",
              query: "",
              kwds: {
                snapshot__isnull: true
              }
            }
          },
          typeAhead:     true,
          disabled:      true,
          triggerAction: 'all',
          emptyText:     gettext('Select...'),
          selectOnFocus: true,
          displayField:  'name',
          valueField:    'id',
          ref:           'origfield'
        },
        {
          xtype: 'checkbox',
          fieldLabel: gettext('Read Only'),
          name: "readonly"
        }
      ]
    }]
  }
});


Ext.reg("lvm_btrfssubvolume_panel", Ext.oa.Lvm__BtrfsSubvolume_Panel);

Ext.oa.Lvm__BtrfsSubvolume_Module = Ext.extend(Object, {
  panel: "lvm_btrfssubvolume_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('BTRFS'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'lvm_btrfssubvolume_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__BtrfsSubvolume_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
