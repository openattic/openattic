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

Ext.define('Ext.oa.Ifconfig__HostGroup_Panel', {

  extend: 'Ext.oa.ShareGridPanel',
  alias: "widget.ifconfig__hostgroup_panel",
  api: ifconfig__HostGroup,
  id: "ifconfig__hostgroup_panel_inst",
  title: gettext("Host Groups"),
  window: {
    height: 200
  },
  columns: [{
    header: gettext('Name'),
    width: 350,
    dataIndex: "name"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: gettext('Host Group'),
      layout: 'form',
      items: [{
        xtype: 'textfield',
        fieldLabel: gettext('Name'),
        name: "name"
      }]
    }]
  }
});

Ext.oa.Ifconfig__HostGroup_Module = {
  panel: "ifconfig__hostgroup_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Host Groups'),
      leaf: true,
      panel: "ifconfig__hostgroup_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png'
    });
  }
};

window.MainViewModules.push( Ext.oa.Ifconfig__HostGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
