Ext.namespace("Ext.oa");

Ext.oa.Auth__User_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var authUserGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Users",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "Add User",
        icon: "/filer/static/icons2/16x16/actions/add.png",
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
                icon: "/filer/static/icons/accept.png",
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
              }, {
                text: 'Cancel',
                icon: "/filer/static/icons2/16x16/actions/gtk-cancel.png",
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
        icon: "/filer/static/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = authUserGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            auth__User.remove( sel.data.id, function(provider, response){
              authUserGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'username', 'first_name', 'last_name', 'email', 'is_active', 'is_staff', 'is_superuser', 'last_login'],
        directFn: auth__User.all
      }),
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
          renderer: function( val, x, store ){
            if( val )
              return '<img src="/filer/static/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
            return '<img src="/filer/static/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
          }
        }, {
          header: "Staff",
          width: 50,
          dataIndex: "is_staff",
          renderer: function( val, x, store ){
            if( val )
              return '<img src="/filer/static/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
            return '<img src="/filer/static/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
          }
        }, {
          header: "SU",
          width: 50,
          dataIndex: "is_superuser",
          renderer: function( val, x, store ){
            if( val )
              return '<img src="/filer/static/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
            return '<img src="/filer/static/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
          }
        }, {
          header: "Last Login",
          width: 200,
          dataIndex: "last_login"
        }]
      })
    }));
    Ext.oa.Auth__User_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[5].children.push({
      text: 'User Management',
      icon: '/filer/static/icons2/22x22/apps/config-users.png',
      leaf: true,
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
