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

Ext.oa.Lio__Portal_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: lio__Portal,
  id: "lio__portal_panel_inst",
  title: "LIO: Network Portals",
  texts: {
    add:     gettext('Add Portal'),
    remove:  gettext('Delete Portal')
  },
  allowEdit: false,
  columns: [{
    header: gettext('Address'),
    width: 100,
    dataIndex: "addrstr"
  }, {
    header: gettext('Port'),
    width: 50,
    dataIndex: "port"
  }],
  store: {
    fields: [{
      name: "addrstr",
      mapping: "ipaddress",
      convert: toUnicode
    }]
  },
  form: {
    items: [{
      xtype:      'combo',
      fieldLabel: gettext('Address'),
      allowBlank: false,
      hiddenName: 'ipaddress',
      store: new Ext.data.DirectStore({
        fields: ["app", "obj", "id", "__unicode__"],
        directFn: ifconfig__IPAddress.ids,
      }),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  '__unicode__',
      valueField:    'id'
    }, {
      xtype: 'numberfield',
      fieldLabel: gettext('Port'),
      allowBlank: false,
      name: "port",
      value: 3260
    }]
  }
});


Ext.reg("lio__portal_panel", Ext.oa.Lio__Portal_Panel);

Ext.oa.Lio__Portal_Module = Ext.extend(Object, {
  panel: "lio__portal_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_luns", {
      text: gettext('Network Portals'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'lio__portal_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lio__Portal_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
