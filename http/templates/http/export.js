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

Ext.oa.Http__Export_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: http__Export,
  id: "http__export_panel_inst",
  title: gettext("HTTP"),
  window: {
    height: 200
  },
  storefields: [{
    name: 'volumename',
    mapping: 'volume',
    convert: function( val, row ){
      "use strict";
      if(val){
        return val.name;
      }
      return "";
    }
  }],
  columns: [{
    header: gettext('Path'),
    width: 350,
    dataIndex: "path"
  },{
    header: gettext('Browse'),
    width: 100,
    dataIndex: "volumename",
    renderer: function(val, x, store){
      "use strict";
      return String.format(
        '<a href="/volumes/{0}" target="_blank" title="{1}">' +
          '<img alt="Browser" src="{{ MEDIA_URL }}/oxygen/16x16/places/folder-remote.png">' +
        '</a>',
        val, gettext("Browse in new window") );
    }
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'HTTP',
      layout: 'form',
      items: [{
        xtype: 'volumefield',
        listeners: {
          select: function(self, record, index){
            "use strict";
            lvm__LogicalVolume.get( record.data.id, function( provider, response ){
              self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
              self.ownerCt.dirfield.enable();
            } );
          }
        }
      }, {
        xtype: 'textfield',
        fieldLabel: gettext('Directory'),
        name: "path",
        disabled: true,
        ref: 'dirfield'
      }]
    }]
  }
});

Ext.reg("http__export_panel", Ext.oa.Http__Export_Panel);

Ext.oa.Http__Export_Module = Ext.extend(Object, {
  panel: "http__export_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Web (HTTP)'),
      leaf: true,
      panel: "http__export_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Http__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
