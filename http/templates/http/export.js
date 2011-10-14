{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Http__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var httpGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "http",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          httpGrid.store.reload();
        }
      }, {
        text: "{% trans 'Add Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Export' %}",
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
                xtype: 'volumefield',
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
                name: "path",
                disabled: true,
                ref: 'dirfield'
              }],
              buttons: [{
                text: "{% trans 'Create Export' %}",
                icon: MEDIA_URL + "/icons/accept.png",
                handler: function(self){
                  http__Export.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':  self.ownerCt.ownerCt.dirfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      httpGrid.store.reload();
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
        text: "{% trans 'Delete Export' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = httpGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            http__Export.remove( sel.data.id, function(provider, response){
              httpGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state', 'id', 'volume', {
          name: 'volumename',
          mapping: 'volume',
          convert: function( val, row ){
            return val.name;
          }
        }],
        directFn: http__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [ {
          header: "{% trans 'Path' %}",
          width: 350,
          dataIndex: "path"
        }, {
          header: "{% trans 'Browse' %}",
          width: 100,
          dataIndex: "volumename",
          renderer: function(val, x, store){
            return String.format(
              '<a href="/volumes/{0}" target="_blank" title="Browse">' +
                '<img alt="Browser" src="{{ MEDIA_URL }}/icons/application_double.png">' +
              '</a>',
              val );
          }
        } ]
      })
    }));
    Ext.oa.Http__Export_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'Web (HTTP)' %}",
      leaf: true,
      panel: this,
      icon: MEDIA_URL + '/icons2/22x22/mimetypes/www.png',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Http__Export_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
