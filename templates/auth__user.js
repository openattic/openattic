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

function wrap_auth_User_set(form, options, action){
  // This is a somewhat questionable method to submit the form, but Django refuses
  // to validate without last_login/date_joined being set, which is not quite what I want either.
  var params = {
    first_name:   form.first_name.value,
    last_name:    form.last_name.value,
    username:     form.username.value,
    email:        form.email.value,
    is_active:    form.is_active.checked,
    is_staff:     form.is_staff.checked,
    is_superuser: form.is_superuser.checked,
  };
  if( form.password.value !== "" ){
    params.password = form.password.value;
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
  title: "{% trans 'Users' %}",
  window: {
    height: 350
  },
  texts: {
    add:     "{% trans 'Add User' %}",
    edit:    "{% trans 'Edit User' %}",
    remove:  "{% trans 'Delete User' %}",
  },
  columns: [{
    header: "{% trans 'User Name' %}",
    width: 200,
    dataIndex: "username"
  }, {
    header: "{% trans 'First Name' %}",
    width: 200,
    dataIndex: "first_name"
  }, {
    header: "{% trans 'Last Name' %}",
    width: 200,
    dataIndex: "last_name"
  }, {
    header: "{% trans 'E-Mail Address' %}",
    width: 200,
    dataIndex: "email"
  }, {
    header: "{% trans 'Active' %}",
    width: 50,
    dataIndex: "is_active",
    renderer: Ext.oa.renderBoolean
  }, {
    header: "{% trans 'Staff' %}",
    width: 50,
    dataIndex: "is_staff",
    renderer: Ext.oa.renderBoolean
  }, {
    header: "{% trans 'SU' %}",
    width: 50,
    dataIndex: "is_superuser",
    renderer: Ext.oa.renderBoolean
  }, {
    header: "{%trans 'Last Login' %}",
    width: 200,
    dataIndex: "last_login"
  }],
  form: {
    api: {
      load: auth__User.get_ext,
      submit: wrap_auth_User_set
    },
    items: [{
      fieldLabel: "{% trans 'User Name' %}",
      name: "username",
      ref: 'usernamefield'
    }, {
      fieldLabel: "{% trans 'Password' %}",
      inputType: 'password',
      name: "password",
      ref: 'passwordfield'
    }, {
      fieldLabel: "{% trans 'First Name' %}",
      name: "first_name",
      ref: 'firstnamefield'
    }, {
      fieldLabel: "{% trans 'Last Name' %}",
      name: "last_name",
      ref: 'lastnamefield'
    }, {
      fieldLabel: "{% trans 'E-Mail' %}",
      name: "email",
      ref: 'emailfield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Active' %}",
      name: "is_active",
      ref: 'activefield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'Staff' %}",
      name: "is_staff",
      ref: 'stafffield'
    }, {
      xtype: 'checkbox',
      fieldLabel: "{% trans 'SuperUser' %}",
      name: "is_superuser",
      ref: 'sufield'
    }]
  },
  deleteFunction: function(){
    var sm = this.getSelectionModel();
    var self = this;
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
      lvm__LogicalVolume.filter( { 'owner__id': sel.data.id }, function(provider, response){
        if( response.result.length > 0 ){
          Ext.Msg.alert( "{% trans 'Delete User' %}", interpolate(
            "{% trans 'User %(user)s is the owner of %(volcount)s volumes.' %}", {
              'user': sel.data.username, 'volcount': response.result.length
            }, true ));
        }
        else{
          Ext.Msg.confirm(
            "{% trans 'Unmount' %}",
            interpolate(
              "{% trans 'Do you really want to delete user %s?' %}",
              [sel.data.username]),
            function(btn){
              if(btn == 'yes'){
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
    tree.appendToRootNodeById("menu_system", {
      text: "{% trans 'User Management' %}",
      icon: MEDIA_URL + '/icons2/22x22/apps/config-users.png',
      leaf: true,
      panel: 'auth__user_panel_inst',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Auth__User_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
