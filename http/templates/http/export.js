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

Ext.define('Ext.oa.Http__Export_Panel', {
  alias: 'widget.http__export_panel',
  extend: 'Ext.oa.ShareGridPanel',
  api: http__Export,
  id: "http__export_panel_inst",
  title: gettext("HTTP"),
  allowEdit: false,
  window: {
    height: 200
  },
  columns: [{
    header: gettext('Path'),
    width: 350,
    dataIndex: "path"
  },{
    header: gettext('Browse'),
    width: 100,
    dataIndex: "url",
    renderer: function(val, x, store){
      return Ext.String.format(
        '<a href="{0}" target="_blank" title="{1}">' +
          '<img alt="Browser" src="{{ MEDIA_URL }}/oxygen/16x16/places/folder-remote.png">' +
        '</a>',
        val,
        gettext("Browse in new window") );
    }
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'HTTP',
      layout: 'form',
      items: [{
        xtype: 'filesystemvolumefield',
        listeners: {
          select: function(self, record, index){
            var dirfield = Ext.ComponentQuery.query("[name=path]", self.ownerCt)[0];
            volumes__FileSystemVolume.get( record[0].data.id, function( result, response ){
              dirfield.setValue( result.path );
              dirfield.enable();
            } );
          }
        }
      }, {
        xtype: 'textfield',
        fieldLabel: gettext('Directory'),
        name: "path",
        disabled: true
      }]
    }]
  }
});

Ext.oa.Http__Export_Module = {
  panel: "http__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_nas", {
      text: gettext('Web (HTTP)'),
      leaf: true,
      panel: "http__export_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png'
    });
  }
};

window.MainViewModules.push( Ext.oa.Http__Export_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
