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

Ext.oa.Lio__Iscsi_Target_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: lio__Target,
  id: "lio__iscsi_target_panel_inst",
  title: "iSCSI Targets",
  filterParams: {
    "type": "iscsi"
  },
  columns: [{
    header: gettext('Name'),
    width: 100,
    dataIndex: "name"
  }, {
    header: gettext('IQN'),
    width: 200,
    dataIndex: "wwn"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'iSCSI Target',
      layout: 'form',
      items: [{
        xtype: 'textfield',
        fieldLabel: gettext('Name'),
        allowBlank: false,
        name: "name"
      }, {
        xtype:      'combo',
        fieldLabel: gettext('Host'),
        allowBlank: true,
        hiddenName: 'host',
        store: {
          xtype: "directstore",
          fields: ["id", "name"],
          directFn: ifconfig__Host.all
        },
        typeAhead:     true,
        triggerAction: 'all',
        emptyText:     gettext('Select...'),
        selectOnFocus: true,
        displayField:  'name',
        valueField:    'id',
        ref:           'hostfield',
        listeners: {
          afterrender: function(self){
            self.store.load();
          }
        }
      }, {
        xtype: 'hidden',
        name:  'type',
        value: 'iscsi'
      }, {
        xtype: 'textfield',
        fieldLabel: gettext('IQN'),
        allowBlank: false,
        name: "wwn"
      }]
    }]
  }
});


Ext.reg("lio__iscsi_target_panel", Ext.oa.Lio__Iscsi_Target_Panel);

Ext.oa.Lio__Iscsi_Target_Module = Ext.extend(Object, {
  panel: "lio__iscsi_target_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_luns", {
      text: gettext('iSCSI Targets'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'lio__iscsi_target_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lio__Iscsi_Target_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
