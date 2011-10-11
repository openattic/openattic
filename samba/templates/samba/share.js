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
      })
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
