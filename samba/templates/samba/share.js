{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var sambaShareGrid = this;
    var renderBoolean = function (val, x, store){
     if (val)
       return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
     return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
      };
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'Samba' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
        sambaShareGrid.store.reload();
        }
      },{
        text: "{% trans "Add Share" %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans "Add Share" %}",
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
                fieldLabel: "Name",
                allowBlank: false,
                name: "name",
                ref: 'namefield'
              }, {
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: "{% trans 'Volume' %}",
                name:       'volume',
                hiddenName: 'volume_id',
                store: new Ext.data.DirectStore({
                  fields: ["app", "obj", "id", "name"],
                  directFn: lvm__LogicalVolume.ids
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                displayField:  'name',
                valueField:    'id',
                ref:           'volfield',
              }, {
                fieldLabel: "{% trans "Path" %}",
                allowBlank: false,
                name: "path",
                ref: 'pathfield'
              }, {
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
              } ]
            }]
          });
          addwin.show();
        }
      }],
      store: new Ext.data.DirectStore({
        autoLoad: true,
        fields: ['path', 'state', 'available'],
        directFn: samba__Share.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
          
        }, {
          header: "{% trans 'State' %}",
          width: 50,
          dataIndex: "state",
          renderer: renderBoolean
        }, {
          header: "{% trans 'Available' %}",
          width: 70,
          dataIndex: "available",
          renderer: renderBoolean
        }]
      }),
     }));
    Ext.oa.Samba__Share_Panel.superclass.initComponent.apply(this, arguments);
  },
  
//   Ext.apply(this, Ext.apply(this.initialConfig, {
//     title: ""
//     
//     
//   }

  prepareMenuTree: function(tree){
    tree.root.attributes.children[2].children.push({
      text: "{% trans 'Windows (Samba)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
