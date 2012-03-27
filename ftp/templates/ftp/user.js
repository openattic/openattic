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

Ext.oa.Ftp__User_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: ftp__User,
  id: "ftp__user_panel_inst",
  title: "FTP",
  texts: {
    add:     "{% trans 'Add User' %}",
    edit:    "{% trans 'Edit User' %}",
    remove:  "{% trans 'Delete User' %}"
  },
  columns: [{
    header: "{% trans 'Path' %}",
    dataIndex: "homedir"
  }, {
    header: "{% trans 'User name' %}",
    dataIndex: "username"
  }],
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
  form: {
    items:[{
      xtype: 'textfield',
      name: "username",
      fieldLabel: "Username"
    }, {
      xtype: 'textfield',
      fieldLabel: "{% trans 'Password' %}",
      name: "passwd",
      inputType: 'password'
    }, {
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
      fieldLabel: "{% trans 'Directory' %}",
      name: "homedir",
      disabled: true,
      ref: 'dirfield'
    },{
      xtype: 'hidden',
      name:  "shell",
      value: '/bin/true'
    }]
  },
  deleteConfirm: function(sel){
    "use strict";
    return interpolate("{% trans 'Do you really want to delete user %s?' %}", [sel.data.username]);
  }
});


Ext.reg("ftp__user_panel", Ext.oa.Ftp__User_Panel);

Ext.oa.Ftp__User_Module = Ext.extend(Object, {
  panel: "ftp__user_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Web (FTP)' %}",
      leaf: true,
      panel: "ftp__user_panel_inst",
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Ftp__User_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
