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

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: samba__Share,
  id: "samba__share_panel_inst",
  title: "Samba",
  columns: [{
    header: "{% trans 'Share name' %}",
    width: 100,
    dataIndex: "name"
  }, {
    header: "{% trans 'Path' %}",
    width: 200,
    dataIndex: "path"
  }, {
    header: "{% trans 'Available' %}",
    width: 50,
    dataIndex: "available",
    renderer: function (val, x, store){
      if (val)
        return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
      return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
    }
  }],
  form: {
    items: [{
      xtype:'volumefield',
      listeners: {
        select: function(self, record, index){
        lvm__LogicalVolume.get( record.data.id, function( provider, response ){
          self.ownerCt.namefield.setValue( response.result.name );
          self.ownerCt.namefield.enable();
          self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
          self.ownerCt.dirfield.enable();
        } );
        }
      }
    },{
      xtype: 'textfield',
      fieldLabel: "{% trans 'Share name' %}",
      allowBlank: false,
      name: "name",
      ref: 'namefield',
      disabled: true
    },{
      xtype: 'textfield',
      fieldLabel: "{% trans 'Path' %}",
      allowBlank: false,
      name: "path",
      ref: 'dirfield',
      disabled: true
    },{
      xtype: 'textfield',
      fieldLabel: "{% trans 'System user' %}",
      allowBlank: true,
      name: "force_user",
      ref: 'userfield'
    }, {
      xtype: 'textfield',
      fieldLabel: "{% trans 'System Group' %}",
      allowBlank: true,
      name: "force_group",
      ref: 'groupfield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Browseable' %}",
      allowBlank: false,
      name: "browseable",
      ref: 'browseablefield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Available' %}",
      allowBlank: false,
      name: "available",
      ref: 'availablefield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Writeable' %}",
      allowBlank: false,
      name: "writeable",
      ref: 'writeablefield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Guest OK' %}",
      allowBlank: false,
      name: "guest_ok",
      ref: 'guestokfield'
    }, tipify({
      xtype: 'textfield',
      fieldLabel: "{% trans 'Dir Mode' %}",
      allowBlank: false,
      name: "dir_mode",
      ref: 'dirmodefield',
      value:     '0775'
    },"{% trans 'Set rights for the Directory' %}"), {
      xtype: 'textfield',
      fieldLabel: "{% trans 'Comment' %}",
      allowBlank: true,
      name: "comment",
      ref: 'commentfield'
    }, tipify({
      xtype: 'textfield',
      fieldLabel: "{% trans 'Create Mode' %}",
      allowBlank: false,
      name: "create_mode",
      ref: 'createmodefield',
      value:     '0664'
    }, "{% trans 'Set rights for owner, group and others' %}" ) ]
  }
});



Ext.reg("samba__share_panel", Ext.oa.Samba__Share_Panel);

Ext.oa.Samba__Share_Module = Ext.extend(Object, {
  panel: "samba__share_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Windows (Samba)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: "samba__share_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
