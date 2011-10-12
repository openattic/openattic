{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Nfs__Export_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'NFS' %}",
      viewConfig: { forceFit: true },
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nfsGrid.store.reload();
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
                  name: "path",
                  disabled: true,
                  ref: 'dirfield'
                }, {
                  fieldLabel: "{% trans 'Address' %}",
                  name: "address",
                  ref: 'addrfield'
                }, {
                  fieldLabel: "{% trans 'Options' %}",
                  name: "options",
                  ref: 'optfield',
                  value: "rw,no_subtree_check,no_root_squash"
              }],
              buttons: [{
                text: "{% trans 'Create Export' %}",
                icon: MEDIA_URL + "/icons/accept.png",
                handler: function(self){
                  nfs__Export.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'options': self.ownerCt.ownerCt.optfield.getValue(),
                    'address': self.ownerCt.ownerCt.addrfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      nfsGrid.store.reload();
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
          var sm = nfsGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Delete Export' %}",
              interpolate(
                "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
                function(btn){
                  if(btn == 'yes'){
                    nfs__Export.remove( sel.data.id, function(provider, response){
                    nfsGrid.store.reload();
            } );
          }
        });
      }
        }}  
      ],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'address', 'path', 'options', 'state'],
        directFn: nfs__Export.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Address' %}",
          width: 100,
          dataIndex: "address"
        }, {
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'Options' %}",
          width: 200,
          dataIndex: "options"
        }]
      })
    }));
    Ext.oa.Nfs__Export_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'Linux (NFS)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Nfs__Export_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
