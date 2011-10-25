Ext.namespace("Ext.oa");

Ext.oa.Auth__User_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var authUserGrid = this;
    var renderBoolean = function( val, x, store ){
      if( val )
        return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
      return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
    };
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "auth__user_panel_inst",
      title: "Users",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "Add User",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "Add User",
            layout: "fit",
            height: 300,
            width: 500,
            items: [{
              xtype: "form",
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [{
                fieldLabel: "User Name",
                name: "username",
                ref: 'usernamefield'
              }, {
                fieldLabel: "Password",
                inputType: 'password',
                name: "password",
                ref: 'passwordfield'
              }, {
                fieldLabel: "First Name",
                name: "firstname",
                ref: 'firstnamefield'
              }, {
                fieldLabel: "last Name",
                name: "lastname",
                ref: 'lastnamefield'
              }, {
                fieldLabel: "E-Mail",
                name: "email",
                ref: 'emailfield'
              }, {
                xtype: 'checkbox',
                fieldLabel: "Active",
                name: "active",
                ref: 'activefield'
              }, {
                xtype: 'checkbox',
                fieldLabel: "SuperUser",
                name: "su",
                ref: 'sufield'
              }, {
                xtype: 'checkbox',
                fieldLabel: "Staff",
                name: "staff",
                ref: 'stafffield'
              }],
              buttons: [{
                text: 'Create User',
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  auth__User.create({
                    'username':    self.ownerCt.ownerCt.usernamefield.getValue(),
                    'password':    self.ownerCt.ownerCt.passwordfield.getValue(),
                    'first_name':  self.ownerCt.ownerCt.firstnamefield.getValue(),
                    'last_name':   self.ownerCt.ownerCt.lastnamefield.getValue(),
                    'email':       self.ownerCt.ownerCt.emailfield.getValue(),
                    'is_active':   self.ownerCt.ownerCt.activefield.getValue(),
                    'is_superuser':self.ownerCt.ownerCt.sufield.getValue(),
                    'is_staff':    self.ownerCt.ownerCt.stafffield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      authUserGrid.store.reload();
                      addwin.hide();
                    }
                  });
                }
              },{
                text: 'Cancel',
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(self){
                  addwin.hide();
                }
              }]
            }]
          });
          addwin.show();
        }
      }, {
        text: "Delete User",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = authUserGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            auth__User.remove( sel.data.id, function(provider, response){
              authUserGrid.store.reload();
            } );
          }
        }
      },{
        text: 'Edit',
        handler: function(self){
          var sm = authUserGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            var addwin = new Ext.Window({
              title: "Edit User",
              layout: "fit",
              height: 300,
              width: 500,
              items: [{
                xtype: "form",
                defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                  fieldLabel: "User Name",
                  name: "username",
                  ref: 'usernamefield',
                  value: sel.data.username
                },{
                  fieldLabel: "First Name",
                  inputType: 'first_name',
                  name: "first_name",
                  ref: 'firstnamefield',
                  value: sel.data.first_name
                },{
                  fieldLabel: "Last Name",
                  inputType: 'last_name',
                  name: "last_name",
                  ref: 'lastnamefield',
                  value: sel.data.last_name
                },{
                  fieldLabel: "Email",
                  inputType: 'email',
                  name: "email",
                  ref: 'emailfield',
                  value: sel.data.email
                },{
                  xtype: 'checkbox',
                  fieldLabel: "Active",
                  name: "active",
                  ref: 'activefield',
                  checked: sel.data.is_active
                },{
                  xtype: 'checkbox',
                  fieldLabel: "Staff",
                  name: "staff",
                  ref: 'stafffield',
                  checked: sel.data.is_staff
                },{
                  xtype: 'checkbox',
                  fieldLabel: "SU",
                  name: "su",
                  ref: 'sufield',
                  checked: sel.data.is_superuser
                }],
                buttons: [{
                  text: 'Save',
                  handler: function(self){
                    var sm = authUserGrid.getSelectionModel();
                    if( sm.hasSelection() ){
                      var sel = sm.selections.items[0];
                      auth__User.set(sel.data.id, {
                        'username':    self.ownerCt.ownerCt.usernamefield.getValue(),
                        'first_name':  self.ownerCt.ownerCt.firstnamefield.getValue(),
                        'last_name':   self.ownerCt.ownerCt.lastnamefield.getValue(),
                        'email':       self.ownerCt.ownerCt.emailfield.getValue(),
                        'is_active':   self.ownerCt.ownerCt.activefield.getValue(),
                        'is_superuser':self.ownerCt.ownerCt.sufield.getValue(),
                        'is_staff':    self.ownerCt.ownerCt.stafffield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          authUserGrid.store.reload();
                          addwin.hide();
                        }
                      });
                    }
                  }
                }]
              }]
            });
            addwin.show();
          }
        }
      },{
        text: 'Change Password',
        handler: function(self){
          var sm = authUserGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            var addwin = new Ext.Window({
            title: "Change Password",
              layout: "fit",
              height: 150,
              width: 300,
              items: [{
                xtype: "form",
                  defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                  fieldLabel: "User Name",
                  disabled: true,
                  name: "username",
                  ref: 'usernamefield',
                  value: sel.data.username
                },{
                  fieldLabel: "Password",
                  inputType: 'password',
                  name: "password",
                  ref: 'passwordfield'
                }],
                buttons: [{
                  text: 'Save',
                  handler: function(self){
                    auth__User.set_password(sel.data.id, self.ownerCt.ownerCt.passwordfield.getValue(),
                      function(provider, response){
                        addwin.hide();
                      });
                  }
                }]
              }]
            });
            addwin.show();
          }
        }
      }],
      store: {
        xtype: "directstore",
        fields: ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff', 'is_superuser', 'last_login'],
        directFn: auth__User.all
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "User Name",
          width: 200,
          dataIndex: "username"
        }, {
          header: "First Name",
          width: 200,
          dataIndex: "first_name"
        }, {
          header: "Last Name",
          width: 200,
          dataIndex: "last_name"
        }, {
          header: "E-Mail Address",
          width: 200,
          dataIndex: "email"
        }, {
          header: "Active",
          width: 50,
          dataIndex: "is_active",
          renderer: renderBoolean
        }, {
          header: "Staff",
          width: 50,
          dataIndex: "is_staff",
          renderer: renderBoolean
        }, {
          header: "SU",
          width: 50,
          dataIndex: "is_superuser",
          renderer: renderBoolean
        }, {
          header: "Last Login",
          width: 200,
          dataIndex: "last_login"
        }]
      })
    }));
    Ext.oa.Auth__User_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Auth__User_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("auth__user_panel", Ext.oa.Auth__User_Panel);

Ext.oa.Auth__User_Module = Ext.extend(Object, {
  panel: "auth__user_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: 'User Management',
      icon: MEDIA_URL + '/icons2/22x22/apps/config-users.png',
      leaf: true,
      panel: 'auth__user_panel_inst',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Auth__User_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
