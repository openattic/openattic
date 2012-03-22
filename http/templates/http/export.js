{% load i18n %}

{% comment %}
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
{% endcomment %}

Ext.namespace("Ext.oa");

Ext.oa.Http__Export_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: http__Export,
  id: "http__export_panel_inst",
  title: "HTTP",
  columns: [{
    header: "{% trans 'Path' %}",
    width: 350,
    dataIndex: "path"
  },{
    header: "{% trans 'Browse' %}",
    width: 100,
    dataIndex: "volumename",
    renderer: function(val, x, store){
      return String.format(
        '<a href="/volumes/{0}" target="_blank" title="{% trans "Browse in new window" %}">' +
        '<img alt="Browser" src="{{ MEDIA_URL }}/oxygen/16x16/places/folder-remote.png">' +
        '</a>',
        val );
    }
  }],
  form: {
    items: [{
      xtype: 'volumefield',
      listeners: {
        select: function(self, record, index){
          lvm__LogicalVolume.get( record.data.id, function( provider, response ){
            self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
            self.ownerCt.dirfield.enable();
          } );
        }
      }
    }, {
      xtype: 'textfield',
      fieldLabel: "{% trans 'Directory' %}",
      name: "path",
      disabled: true,
      ref: 'dirfield'
    }]
  }
});

Ext.reg("http__export_panel", Ext.oa.Http__Export_Panel);

Ext.oa.Http__Export_Module = Ext.extend(Object, {
  panel: "http__export_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Web (HTTP)' %}",
      leaf: true,
      panel: "http__export_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Http__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
