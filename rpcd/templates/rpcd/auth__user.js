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

Ext.define('Ext.oa.Auth__User_Panel', {
  extend: 'Ext.oa.ShareGridPanel',
  alias: "widget.auth__user_panel",
  api: auth__User,
  id: "auth__user_panel_inst",
  title: gettext('Users'),
  window: {
    height: 350
  },
  buttons: [{
    text: gettext('Show Volumes of User'),
    icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-unmounted.png",
    handler: function(btn){
      var sm = this.getSelectionModel();
      var self = this;
      if( sm.hasSelection() ){
        var sel = sm.selected.items[0];
        var volwin = new Ext.Window({
          title: gettext('Volumes of User'),
          layout: "fit",
          height: 300,
          width: 350,
          items: {
            xtype: "grid",
            store: (function(){
              Ext.define('rpcd_volumes_of_user_store', {
                extend: 'Ext.data.Model',
                fields: [
                  {name: 'name'}
                ]
              });
              return Ext.create('Ext.data.Store', {
                model: "rpcd_volumes_of_user_store",
                autoLoad: true,
                proxy: {
                  type: 'direct',
                  directFn: lvm__LogicalVolume.filter,
                  extraParams: { "owner": sel.data.id },
                  startParam: undefined,
                  limitParam: undefined,
                  pageParam:  undefined
                }
              });
            }()),
            defaults: {
              sortable: true
            },
            columns: [{
              header: gettext('Volume Name'),
              width: 250,
              dataIndex: "name"
            }]
          }
        } );
        volwin.show();
      }
    }
  }],
  texts: {
    add:     gettext('Add User'),
    edit:    gettext('Edit User'),
    remove:  gettext('Delete User')
  },
  columns: [{
    header: gettext('User Name'),
    width: 200,
    dataIndex: "username"
  }, {
    header: gettext('First Name'),
    width: 200,
    dataIndex: "first_name"
  }, {
    header: gettext('Last Name'),
    width: 200,
    dataIndex: "last_name"
  }, {
    header: gettext('E-Mail Address'),
    width: 200,
    dataIndex: "email"
  }, {
    header: gettext('Active'),
    width: 50,
    dataIndex: "is_active",
    renderer: Ext.oa.renderBoolean
  }, {
    header: gettext('Staff'),
    width: 50,
    dataIndex: "is_staff",
    renderer: Ext.oa.renderBoolean
  }, {
    header: gettext('SU'),
    width: 50,
    dataIndex: "is_superuser",
    renderer: Ext.oa.renderBoolean
  }, {
    header: gettext('Last Login'),
    width: 200,
    dataIndex: "last_login",
    renderer: function(val){
      if(!val) return gettext("unknown");
      var date = new Date(Date.parse(val));
      return Ext.Date.format(date, get_format_ext("SHORT_DATETIME_FORMAT"));
    }
  }],
  form: {
    items: [{
      fieldLabel: gettext('User Name'),
      name: "username"
    }, {
      fieldLabel: gettext('Password'),
      inputType: 'password',
      name: 'password'
    }, {
      fieldLabel: gettext('First Name'),
      name: "first_name"
    }, {
      fieldLabel: gettext('Last Name'),
      name: "last_name"
    }, {
      fieldLabel: gettext('E-Mail'),
      name: "email"
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('Active'),
      name: "is_active"
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('Staff'),
      name: "is_staff"
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('SuperUser'),
      name: "is_superuser"
    }]
  },
  deleteFunction: function(){
    var sm = this.getSelectionModel();
    var self = this;
    if( sm.hasSelection() ){
      var sel = sm.selected.items[0];
      lvm__LogicalVolume.filter( { 'owner__id': sel.data.id }, function(provider, response){
        if( response.result.length > 0 ){
          Ext.Msg.alert( gettext('Delete User'), interpolate(
            gettext('User %(user)s is the owner of %(volcount)s volumes.'), {
              'user': sel.data.username, 'volcount': response.result.length
            }, true ));
        }
        else{
          Ext.Msg.confirm(
            gettext('Delete User'),
            interpolate(
              gettext('Do you really want to delete user %s?'),
              [sel.data.username]),
            function(btn){
              if(btn === 'yes'){
                self.api.remove( sel.data.id, function(provider, response){
                  self.store.load();
                } );
              }
            }
          );
        }
      } );
    }
  }
});


Ext.oa.Auth__User_Module = {
  panel: "auth__user_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('User Management'),
      icon: MEDIA_URL + '/icons2/22x22/apps/config-users.png',
      leaf: true,
      panel: 'auth__user_panel_inst'
    });
  }
};

window.MainViewModules.push( Ext.oa.Auth__User_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
