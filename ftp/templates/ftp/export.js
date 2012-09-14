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

Ext.oa.Ftp__Export_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: ftp__Export,
  id: "ftp__export_panel_inst",
  title: gettext("FTP"),
  window: {
    height: 200
  },
  allowEdit: false,
  storefields: [{
    name: 'volumename',
    mapping: 'volume',
    convert: toUnicode
  }, {
    name: 'username',
    mapping: 'user',
    convert: toUnicode
  }],
  columns: [{
    header: gettext('Volume'),
    width: 350,
    dataIndex: "volumename"
  },{
    header: gettext('User'),
    width: 100,
    dataIndex: "username",
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'FTP',
      layout: 'form',
      items: [{
        xtype: 'volumefield'
      }, {
        xtype: 'authuserfield',
        hiddenName: "user"
      }, {
        xtype: "hidden",
        name:  "path",
        value: ""
      }]
    }]
  }
});

Ext.reg("ftp__export_panel", Ext.oa.Ftp__Export_Panel);

Ext.oa.Ftp__Export_Module = Ext.extend(Object, {
  panel: "ftp__export_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Web (FTP)'),
      leaf: true,
      panel: "ftp__export_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Ftp__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
