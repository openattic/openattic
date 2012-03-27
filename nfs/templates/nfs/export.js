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

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: nfs__Export,
  id: "nfs__export_panel_inst",
  title: "NFS",
  columns: [{
    header: "{% trans 'Address' %}",
    width: 100,
    dataIndex: "address"
  }, {
    header: "{% trans 'Path' %}",
    width: 200,
    dataIndex: "path"
  }, {
    header: "{% trans 'Options' %}",
    width: 200,
    dataIndex: "options"
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'NFS Export',
      layout: 'form',
      items: [
        tipify({
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
        }, "{% trans 'Please select the volume to share.' %}"),
        tipify({
          xtype: 'textfield',
          fieldLabel: "{% trans 'Directory' %}",
          name: "path",
          ref: 'dirfield',
          disabled: true
        }, "{% trans 'If you wish to share only a subpath of the volume, enter the path here.' %}" ),
        {
          xtype: 'textfield',
          fieldLabel: "{% trans 'Address' %}",
          allowBlank: false,
          name: "address",
          ref: 'addrfield'
        },
        tipify({
          xtype: 'textfield',
          fieldLabel: "{% trans 'Options' %}",
          name: "options",
          ref: 'optfield',
          value: "rw,no_subtree_check,no_root_squash"
        },"{% trans 'this is default. rw: read/write rights are given,<br> no_subtree_check means that every file request is going to be checked to make sure that this file is in an exported subdirectory,<br> no_root_squash means share the folder (public), every IP-Adress has access, root can connect as root' %}")
      ]
    }]
  }
});


Ext.reg("nfs__export_panel", Ext.oa.Nfs__Export_Panel);

Ext.oa.Nfs__Export_Module = Ext.extend(Object, {
  panel: "nfs__export_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Linux (NFS)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: 'nfs__export_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Nfs__Export_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
