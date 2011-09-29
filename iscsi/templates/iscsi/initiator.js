{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Initiator_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiInitGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'iSCSI Initiators' %}",
      buttons: [{
        text: "{% trans 'Add Initiator' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Initiator' %}",
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
                name: "name",
                ref: 'namefield'
              }, {
                fieldLabel: "{% trans 'Address (IQN/IP)' %}",
                name: "address",
                ref: 'addrfield'
              }],
              buttons: [{
                text: "{% trans 'Create Initiator' %}",
                icon: MEDIA_URL + "/icons/accept.png",
                handler: function(self){
                  iscsi__Initiator.create({
                    'name':    self.ownerCt.ownerCt.namefield.getValue(),
                    'address': self.ownerCt.ownerCt.addrfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      iscsiInitGrid.store.reload();
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
        text: "{% trans 'Delete Initiator' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiInitGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Initiator.remove( sel.data.id, function(provider, response){
              iscsiInitGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'address', 'name'],
        directFn: iscsi__Initiator.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Name' %}",
          width: 200,
          dataIndex: "name"
        }, {
          header: "{% trans 'Address' %}",
          width: 100,
          dataIndex: "address"
        }]
      })
    }));
    Ext.oa.Iscsi__Initiator_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    iscsiTreeIndex = tree.root.attributes.children[2].children.length;
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'LAN (iSCSI)' %}",
      panel: this,
      href: '#',
      children: [{
        text: "{% trans 'Initiators' %}",
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
        panel: this,
        href: '#'
      }]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Initiator_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
