{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Initiator_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiInitGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'iscsi__initiator_panel_inst',
      title: "{% trans 'iSCSI Initiators' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          iscsiInitGrid.store.reload();
        }
      }, {
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
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
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
          width: 400,
          dataIndex: "address"
        }]
      })
    }));
    Ext.oa.Iscsi__Initiator_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Iscsi__Initiator_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("iscsi__initiator_panel", Ext.oa.Iscsi__Initiator_Panel);

Ext.oa.Iscsi__Initiator_Module = Ext.extend(Object, {
  panel: "iscsi__initiator_panel",
  prepareMenuTree: function(tree){
    iscsiTreeIndex = tree.root.attributes.children[2].children.length;
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'LAN (iSCSI)' %}",
      panel: 'iscsi__initiator_panel_inst',
      href: '#',
      children: [{
        text: "{% trans 'Initiators' %}",
        leaf: true,
        icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
        panel: 'iscsi__initiator_panel_inst',
        href: '#'
      }]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Initiator_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
