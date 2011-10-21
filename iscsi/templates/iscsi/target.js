{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Iscsi__Target_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var iscsiTrgGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'iSCSI Targets' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          iscsiTargetGrid.store.reload();
        }
      }, {
        text: "{% trans 'Add Target' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var fqdn = "";
          __main__.fqdn(function(provider, response){
            fqdn = response.result.split(".").reverse().join(".");
          });
          var addwin = new Ext.Window({
            title: "{% trans 'Add Target' %}",
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
                ref: 'namefield',
                listeners: {
                  change: function( self, newValue, oldValue ){
                    var d = new Date();
                    var m = d.getMonth();
                    self.ownerCt.addrfield.setValue(
                      String.format("iqn.{0}-{1}.{2}:{3}",
                        d.getFullYear(), (m < 10 ? "0" + m : m),
                        fqdn, self.getValue()
                      ) );
                  }
                }
              }, {
                fieldLabel: "{% trans 'IQN' %}",
                name: "iscsiname",
                ref: 'addrfield'
              }, {
                fieldLabel: "{% trans 'Allow All' %}",
                xtype: 'checkbox',
                name: "allowall",
                ref: 'allowfield'
              }],
              buttons: [{
                text: "{% trans 'Create Target' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  iscsi__Target.create({
                    'name':      self.ownerCt.ownerCt.namefield.getValue(),
                    'iscsiname': self.ownerCt.ownerCt.addrfield.getValue(),
                    'allowall':  self.ownerCt.ownerCt.allowfield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      iscsiTrgGrid.store.reload();
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
        text: "{% trans 'Delete Target' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = iscsiTrgGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            iscsi__Target.remove( sel.data.id, function(provider, response){
              iscsiTrgGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['id', 'iscsiname', 'name'],
        directFn: iscsi__Target.all
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
          header: "{% trans 'IQN' %}",
          width: 400,
          dataIndex: "iscsiname"
        }]
      })
    }));
    Ext.oa.Iscsi__Target_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children[iscsiTreeIndex].children.push({
      text: "{% trans 'Targets' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Iscsi__Target_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
