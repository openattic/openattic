{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Ftp__User_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var ftpGrid = this;
    var deleteFunction = function(self){
    var sm = ftpGrid.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
          Ext.Msg.confirm(
            "{% trans 'Delete Share' %}",
            interpolate(
              "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
              function(btn){
                if(btn == 'yes'){
                  ftp__User.remove( sel.data.id, function(provider, response){
                  ftpGrid.store.reload();
                  });
                } 
              }
          );
      }
    };
    var addFunction = function(){
    var addwin = new Ext.Window({
      title: "{% trans 'Add FTP User' %}",
      layout: "fit",
      height: 200,
      width: 500,
      items: [{
        xtype: "form",
        bodyStyle: 'padding:5px 5px;',
        defaults: {
          xtype: "textfield",
          anchor: '-20px'
        },
        items: [{
          fieldLabel: "{% trans 'Name' %}",
          name: "username",
          ref: 'namefield'
        }, {
          fieldLabel: "{% trans 'Password' %}",
          name: "passwd",
          inputType: 'password',
          ref: 'passwdfield'
        }, {
          xtype:      'volumefield',
          listeners: {
            select: function(self, record, index){
              lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                self.ownerCt.dirfield.enable();
              } );
            }
          }
        }, {
          fieldLabel: "{% trans 'Directory' %}",
          name: "homedir",
          disabled: true,
          ref: 'dirfield'
        }],
        buttons: [{
          text: "{% trans 'Create User' %}",
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            ftp__User.create({
              'username': self.ownerCt.ownerCt.namefield.getValue(),
              'passwd':   self.ownerCt.ownerCt.passwdfield.getValue(),
              'volume': {
                'app': 'lvm',
                'obj': 'LogicalVolume',
                'id': self.ownerCt.ownerCt.volfield.getValue()
              },
              'homedir':  self.ownerCt.ownerCt.dirfield.getValue()
            }, function(provider, response){
              if( response.result ){
                ftpGrid.store.reload();
                addwin.hide();
              }
            });
          }
        }, {
          text: "{% trans 'Cancel' %}",
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(self){
            addwin.hide();
          }
        }]
      }]
    });
    addwin.show();
  }
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "ftp__user_panel_inst",
      title: "ftp",
      buttons: [{
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            ftpGrid.store.reload();
          }
      }, {
        text: "{% trans 'Add User' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: addFunction
      },{
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = ftpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            var addwin = new Ext.Window({
              title: "Edit",
              layout: "fit",
              height: 200,
              width: 500,
              items: [{
                xtype: "form",
                bodyStyle: 'padding:5px 5px;',
                defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                  fieldLabel: "Name",
                  name: "name",
                  readOnly: true,
                  disabled: true,
                  ref: 'namefield',
                  value: sel.data.username
                },{
                  fieldLabel: "Password",
                  name: "password",
                  inputType: 'password',
                  ref: 'passwdfield'
                },{
                xtype:      'volumefield',
                value: sel.data.volumename,
                listeners: {
                  select: function(self, record, index){
                    lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                      self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                      self.ownerCt.dirfield.enable();
                    } );
                  }
                }
              }, {
                fieldLabel: "{% trans 'Directory' %}",
                name: "homedir",
                ref: 'dirfield',
                value: sel.data.homedir
              }],
                buttons: [{
                  text: 'Save',
                  handler: function(self){
                    var sm = ftpGrid.getSelectionModel();
                    if( sm.hasSelection() ){
                      var sel = sm.selections.items[0];
                      ftp__User.set(sel.data.id,{
                        'username': sel.data.username,
                        'passwd':   self.ownerCt.ownerCt.passwdfield.getValue(),
                        'volume': {
                          'app': 'lvm',
                          'obj': 'LogicalVolume',
                          'id': sel.data.id
                        },
                        'homedir':  sel.data.homedir
                      }, function(provider, response){
                        if( response.result ){
                          ftpGrid.store.reload();
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
        text: "{% trans 'Delete User' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: deleteFunction
      }],
      keys: [{ key: [Ext.EventObject.DELETE], handler: deleteFunction}],
      store: {
        xtype: 'directstore',
        fields: ['id', 'username', 'shell', 'homedir', 'volume', {
          name: 'volumename',
          mapping: 'volume',
          convert: function( val, row ){
            return val.name;
          }
        }],
        directFn: ftp__User.all
      },
      viewConfig: { forceFit: true },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [ {
          header: "{% trans 'Path' %}",
          dataIndex: "homedir"
        }, {
          header: "{% trans 'User name' %}",
          dataIndex: "username"
        } ]
      })
    }));
    Ext.oa.Ftp__User_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Ftp__User_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("ftp__user_panel", Ext.oa.Ftp__User_Panel);

Ext.oa.Ftp__User_Module = Ext.extend(Object, {
  panel: "ftp__user_panel",
  prepareMenuTree: function(tree){
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
