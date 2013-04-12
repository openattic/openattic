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

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: samba__Share,
  id: "samba__share_panel_inst",
  title: gettext("Samba"),
  window: {
    height: 450
  },
  columns: [{
    header: gettext('Share name'),
    width: 100,
    dataIndex: "name"
  }, {
    header: gettext('Path'),
    width: 200,
    dataIndex: "path"
  }, {
    header: gettext('Available'),
    width: 50,
    dataIndex: "available",
    renderer: Ext.oa.renderBoolean
  }],
  form: {
    items: [{
      xtype: 'fieldset',
      title: 'Samba',
      layout: 'form',
      items: [{
        xtype:'volumefield',
        listeners: {
          select: function(self, record, index){
            "use strict";
            lvm__LogicalVolume.get( record.data.id, function( provider, response ){
              self.ownerCt.namefield.setValue( response.result.name );
              self.ownerCt.namefield.enable();
              self.ownerCt.dirfield.setValue( response.result.fs.mountpoint );
              self.ownerCt.dirfield.enable();
            } );
          }
        }
      },{
        xtype: 'textfield',
        fieldLabel: gettext('Share name'),
        allowBlank: false,
        name: "name",
        ref: 'namefield',
        disabled: true
      },{
        xtype: 'textfield',
        fieldLabel: gettext('Path'),
        allowBlank: false,
        name: "path",
        ref: 'dirfield',
        disabled: true
      }, {
        xtype: 'checkbox',
        fieldLabel: gettext('Browseable'),
        allowBlank: false,
        name: "browseable",
        ref: 'browseablefield'
      }, {
        xtype: 'checkbox',
        fieldLabel: gettext('Available'),
        allowBlank: false,
        name: "available",
        ref: 'availablefield'
      }, {
        xtype: 'checkbox',
        fieldLabel: gettext('Writeable'),
        allowBlank: false,
        name: "writeable",
        ref: 'writeablefield'
      }, {
        xtype: 'checkbox',
        fieldLabel: gettext('Guest OK'),
        allowBlank: false,
        name: "guest_ok",
        ref: 'guestokfield'
      }, tipify({
        xtype: 'textfield',
        fieldLabel: gettext('Dir Mode'),
        allowBlank: false,
        name: "dir_mode",
        ref: 'dirmodefield',
        value:     '0775'
      },gettext('Set rights for the Directory')), {
        xtype: 'textfield',
        fieldLabel: gettext('Comment'),
        allowBlank: true,
        name: "comment",
        ref: 'commentfield'
      }, tipify({
        xtype: 'textfield',
        fieldLabel: gettext('Create Mode'),
        allowBlank: false,
        name: "create_mode",
        ref: 'createmodefield',
        value:     '0664'
      }, gettext('Set rights for owner, group and others') ) ]
    }]
  }
});



Ext.reg("samba__share_panel", Ext.oa.Samba__Share_Panel);

Ext.oa.Samba__Share_Module = Ext.extend(Object, {
  panel: "samba__share_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: gettext('Windows (Samba)'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: "samba__share_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
