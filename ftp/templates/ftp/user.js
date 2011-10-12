{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Ftp__User_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var ftpGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
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
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add FTP User' %}",
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
                  fieldLabel: "{% trans 'Name' %}",
                  name: "username",
                  ref: 'namefield'
                }, {
                  fieldLabel: "{% trans 'Password' %}",
                  name: "passwd",
                  inputType: 'password',
                  ref: 'passwdfield'
                }, {
                  xtype:      'combo',
                  fieldLabel: "{% trans 'Volume' %}",
                  name:       'volume',
                  hiddenName: 'volume_id',
                  store: new Ext.data.DirectStore({
                    fields: ["id", "name"],
                    directFn: lvm__LogicalVolume.filter_values,
                    paramOrder: ["kwds", "fields"],
                    baseParams: {"kwds": {"filesystem__isnull": false}, "fields": ["name"]}
                  }),
                  typeAhead:     true,
                  triggerAction: 'all',
                  emptyText:     "{% trans 'Select...' %}",
                  selectOnFocus: true,
                  displayField:  'name',
                  valueField:    'id',
                  ref: 'volfield',
                  listeners: {
                    select: function(self, record, index){
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
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
                icon: MEDIA_URL + "/icons/accept.png",
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
      }, {
        text: "{% trans 'Delete User' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = ftpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            ftp__User.remove( sel.data.id, function(provider, response){
              ftpGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'username', 'shell', 'homedir', 'volume', {
          name: 'volumename',
          mapping: 'volume',
          convert: function( val, row ){
            return val.name;
          }
        }],
        directFn: ftp__User.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [ {
          header: "{% trans 'Path' %}",
          width: 350,
          dataIndex: "homedir"
        }, {
          header: "{% trans 'User name' %}",
          width: 100,
          dataIndex: "username"
        } ]
      })
    }));
    Ext.oa.Ftp__User_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'Web (FTP)' %}",
      leaf: true,
      panel: this,
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.Ftp__User_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
