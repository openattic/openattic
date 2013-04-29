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

function wrap_auth_User_set(form, options, action){
  "use strict";
  // This is a somewhat questionable method to submit the form, but Django refuses
  // to validate without last_login/date_joined being set, which is not quite what I want either.
  var params = {
    first_name:   form.first_name.value,
    last_name:    form.last_name.value,
    username:     form.username.value,
    email:        form.email.value,
    is_active:    form.is_active.checked,
    is_staff:     form.is_staff.checked,
    is_superuser: form.is_superuser.checked
  };
  if( form.__passwordfield.value !== "" ){
    params.password = form.__passwordfield.value;
  }
  if( options.params.id === -1 ){
    auth__User.create(params, action.options.success);
  }
  else{
    auth__User.set(options.params.id, params, action.options.success);
  }
}

Ext.oa.Auth__User_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
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
      "use strict";
      var sm = this.getSelectionModel();
      var self = this;
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        var volwin = new Ext.Window({
          title: gettext('Volumes of User'),
          layout: "fit",
          height: 300,
          width: 270,
          items: {
            xtype: "grid",
            store: {
              xtype: 'directstore',
              autoLoad: true,
              fields: ['name'],
              directFn: lvm__LogicalVolume.filter,
              baseParams: {owner__id: sel.data.id}
            },
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [{
                header: gettext('Volume Name'),
                width: 250,
                dataIndex: "name"
              }]
            })
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
      return new Date( Date.parse(val) ).format(get_format_ext("SHORT_DATETIME_FORMAT"))
    }
  }],
  form: {
    api: {
      load: auth__User.get_ext,
      submit: wrap_auth_User_set
    },
    items: [{
      fieldLabel: gettext('User Name'),
      name: "username",
      ref: 'usernamefield'
    }, {
      fieldLabel: gettext('Password'),
      inputType: 'password',
      name: '__passwordfield'
    }, {
      fieldLabel: gettext('First Name'),
      name: "first_name",
      ref: 'firstnamefield'
    }, {
      fieldLabel: gettext('Last Name'),
      name: "last_name",
      ref: 'lastnamefield'
    }, {
      fieldLabel: gettext('E-Mail'),
      name: "email",
      ref: 'emailfield'
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('Active'),
      name: "is_active",
      ref: 'activefield'
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('Staff'),
      name: "is_staff",
      ref: 'stafffield'
    }, {
      xtype: 'checkbox',
      fieldLabel: gettext('SuperUser'),
      name: "is_superuser",
      ref: 'sufield'
    }]
  },
  deleteFunction: function(){
    "use strict";
    var sm = this.getSelectionModel();
    var self = this;
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
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
                  self.store.reload();
                } );
              }
            }
          );
        }
      } );
    }
  }
});


Ext.reg("auth__user_panel", Ext.oa.Auth__User_Panel);

Ext.oa.Auth__User_Module = Ext.extend(Object, {
  panel: "auth__user_panel",

  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_system", {
      text: gettext('User Management'),
      icon: MEDIA_URL + '/icons2/22x22/apps/config-users.png',
      leaf: true,
      panel: 'auth__user_panel_inst',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Auth__User_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
