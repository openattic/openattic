/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.define('Ext.oa.Lio__Portal_Panel', {
  alias:  "widget.lio__portal_panel",
  extend: 'Ext.oa.ShareGridPanel',
  api: lio__Portal,
  id: "lio__portal_panel_inst",
  title: "LIO: Network Portals",
  texts: {
    add:     gettext('Add Portal'),
    remove:  gettext('Delete Portal'),
    confirm: gettext('Do you really want to delete Portal %s?')
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
      name: 'ipaddress',
      store: (function(){
        Ext.define('Ext.oa.Lio__Portal_IP_Model', {
            extend: 'Ext.data.Model',
            fields: ["app", "obj", "id", "__unicode__"]
        });
        return {
          model: "Ext.oa.Lio__Portal_IP_Model",
          proxy: {
            type: "direct",
            directFn: ifconfig__IPAddress.ids
          }
        };
      }()),
      forceSelection: true,
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
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



Ext.oa.Lio__Portal_Module = {
  panel: "lio__portal_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_san", {
      text: gettext('Network Portals'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'lio__portal_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Lio__Portal_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
