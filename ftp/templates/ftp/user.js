{% load i18n %}
Ext.namespace("Ext.oa");

Ext.oa.Ftp__User_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    var ftpGrid = this;
    var addwin = new Ext.Window(Ext.apply(config,{
      layout: "fit",
      defaults: {autoScroll: true},
      height: 230,
      width: 500,
      //title: "{% trans 'Add FTP User' %}",
      items: [{
        xtype: "form",
        bodyStyle: 'padding:5px 5px;',
        api: {
          load: ftp__User.get_ext,
          submit: ftp__User.set_ext
        },
        baseParams: {
          id: (record ? record.id : -1)
        },
        paramOrder: ["id"],
        listeners: {
          afterrender: function(self){
            self.getForm().load();
          }
        },
        defaults: {
          xtype: "textfield",
          anchor: '-20px',
          defaults: {
            anchor: "0px"
          }
        },
        items: [{
          xtype: 'fieldset',
          title: 'User settings',
          layout: 'form',
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
//           fieldLabel: "Volume",
          name: "volume_",
          hiddenName: "volume",
          listeners:{  
          select: function(self, record, index){
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
          disabled: false,
          ref: 'dirfield'
        },{
            xtype: 'hidden',
            name: "shell",
            value: '/bin/true'
        }]
        }],
        buttons: [{
          text: config.submitButtonText,
          icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
          handler: function(self){
            self.ownerCt.ownerCt.getForm().submit({
              params: {id: -1, init_master: true, ordering: 0},
              success: function(provider,response){
                if(response.result){
                  ftpGrid.store.reload();
                  addwin.hide();
                }
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
    }));
    addwin.show();
  },

  initComponent: function(){
    var ftpGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "ftp__user_panel_inst",
      title: "ftp",
      viewConfig: {forceFit: true},
      buttons: [{
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            ftpGrid.store.reload();
          }
      }, {
        text: "{% trans 'Add FTP User' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          ftpGrid.showEditWindow({
            title: "{% trans 'Add User' %}",
            submitButtonText: "{% trans 'Create User' %}"
          });
        }
      }, {
        text: "{%trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = ftpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            ftpGrid.showEditWindow({
            title: "{% trans 'Edit FTP User'%}",
            submitButtonText: "{% trans 'Edit User'%}"
          }, sel.data);
        }
      }
    },{
        text: "{% trans 'Delete User' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: this.deleteFunction,
        scope: ftpGrid
      }],
      keys: [{scope: ftpGrid, key: [Ext.EventObject.DELETE], handler: this.deleteFunction}],
      store: new Ext.data.DirectStore ({
        fields: ['id', 'username', 'passwd','shell', 'homedir', 'volume', {
          name: 'volumename',mapping: 'volume',convert: function( val, row ){ return val.name }
        }],
        directFn: ftp__User.all
      }),
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
        }]
      })
    }));
    Ext.oa.Ftp__User_Panel.superclass.initComponent.apply(this, arguments);
  },
   deleteFunction: function(self){
  var sm = this.getSelectionModel();
    if( sm.hasSelection() ){
      var sel = sm.selections.items[0];
        Ext.Msg.confirm(
          "{% trans 'Delete Share' %}",
          interpolate(
            "{% trans 'Do you really want to delete %s?' %}",[sel.data.homedir]),
            function(btn){
              if(btn == 'yes'){
                ftp__User.remove( sel.data.id, function(provider, response){
                sel.store.reload();
                });
              } 
           });
    }
 },

  onRender: function(){
    Ext.oa.Ftp__User_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
        var self = this;
    var menu = new Ext.menu.Menu({
    items: [{
            id: 'delete',
            text: 'delete',
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png"
        }],
        listeners: {
          itemclick: function(item) {
                    self.deleteFunction()
          }
        }
   });
    this.on({
      'contextmenu': function(event) {
        if( this.getSelectionModel().hasSelection() ){
          event.stopEvent();
          this.getSelectionModel
          menu.showAt(event.xy);
        }
      }
    });
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
