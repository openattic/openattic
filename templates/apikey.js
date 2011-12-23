{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.ApiKey_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var apiKeyGrid = this;
    var renderBoolean = function( val, x, store ){
      if( val )
        return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
      return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
    };
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "apikey_panel_inst",
      title: "{% trans 'API Keys' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          apiKeyGrid.store.reload();
        }
      }, {
        text: "{% trans 'Show API URL' %}",
        icon: MEDIA_URL + "/oxygen/16x16/actions/download.png",
        handler: function(self){
          var sm = apiKeyGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            __main__.fqdn(function(provider, response){
              Ext.Msg.prompt("{% trans 'API URL' %}",
                "{% trans 'Use this URL to connect to the openATTIC API using the API Key you selected.' %}<br />"+
                "{% trans 'Note that the input field only allows for easier copy-paste, any value you enter here will be ignored.' %}",
                null, null, false,
                String.format("http://__:{0}@{1}:31234/", sel.data.apikey, response.result)
              );
            });
          }
        }
      }, {
        text: "{% trans 'Add Key' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Key' %}",
            layout: "fit",
            height: 290,
            width: 500,
            items: [{
              xtype: "form",
              bodyStyle: 'padding:5px 5px;',
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [{
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: "{% trans 'Owner' %}",
                name:       'owner',
                hiddenName: 'owner_id',
                store: new Ext.data.DirectStore({
                  fields: ["username", "id"],
                  baseParams: { fields: ["username", "id"] },
                  directFn: auth__User.all_values
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     "{% trans 'Select...' %}",
                selectOnFocus: true,
                displayField:  'username',
                valueField:    'id',
                ref:      'ownerfield'
              }, {
                fieldLabel: "{% trans 'Description' %}",
                name: "description",
                ref: 'descriptionfield'
              }, {
                xtype: 'checkbox',
                fieldLabel: "{% trans 'Active' %}",
                name: "active",
                ref: 'activefield'
              }],
              buttons: [{
                text: 'Create Key',
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  rpcd__APIKey.create({
                    'owner': {
                      'app': 'auth',
                      'obj': 'User',
                      'id': self.ownerCt.ownerCt.ownerfield.getValue()
                    },
                    'description': self.ownerCt.ownerCt.descriptionfield.getValue(),
                    'active':      self.ownerCt.ownerCt.activefield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      apiKeyGrid.store.reload();
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
        text: "{% trans 'Delete Key' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = apiKeyGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            rpcd__APIKey.remove( sel.data.id, function(provider, response){
              apiKeyGrid.store.reload();
            } );
          }
        }
      }],
      store: {
        xtype: "directstore",
        fields: ['id', 'active', 'apikey', 'description', 'owner', {
          name: 'ownername',
          mapping: 'owner',
          convert: function( val, row ){
            if( val === null )
              return '';
            return val.username;
          }
        }],
        directFn: rpcd__APIKey.all
      },
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Description' %}",
          width: 200,
          dataIndex: "description"
        }, {
          header: "{% trans 'Owner' %}",
          width: 50,
          dataIndex: "ownername"
        }, {
          header: "{% trans 'Active' %}",
          width: 50,
          dataIndex: "active",
          renderer: renderBoolean
        }]
      })
    }));
    Ext.oa.ApiKey_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.ApiKey_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("apikey_panel", Ext.oa.ApiKey_Panel);

Ext.oa.ApiKey_Module = Ext.extend(Object, {
  panel: "apikey_panel",

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: "{% trans 'API Keys' %}",
      icon: MEDIA_URL + '/oxygen/22x22/status/dialog-password.png',
      leaf: true,
      panel: 'apikey_panel_inst',
      href: '#'
    });
  }
});

window.MainViewModules.push( new Ext.oa.ApiKey_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
