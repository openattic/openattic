{% load i18n %}
Ext.namespace("Ext.oa");

Ext.oa.SysUtils__Service_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var sysUtilsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "sysutils__service_panel_inst",
      title: "{% trans 'Service State' %}",
      store: (function(){
        var st = new Ext.data.DirectStore({
          fields: ['id', 'name', 'status'],
          directFn: sysutils__InitScript.all_with_status
        });
        st.setDefaultSort("name");
        return st;
      }()),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true,
          x: 500,
          y: 500
        },
        columns: [{
          header: "{% trans 'Service Name' %}",
          width: 200,
          dataIndex: "name"
        }, {
          header: "{% trans 'Status' %}",
          width: 50,
          dataIndex: "status",
          renderer: function( val, x, store ){
            if( val === 0 )
              return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-high.png" title="running" />';
            else if( val === 3 )
              return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-low.png" title="stopped" />';
            else
              return '<img src="{{ MEDIA_URL }}/oxygen/16x16/status/security-medium.png" title="failure" />';
          }
        }]
      }),
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          sysUtilsGrid.store.reload();
        }
      }, {
        text: 'Start',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selections.items[0];
          sysutils__InitScript.start(sel.data.id, function(provider, response){
            sysUtilsGrid.store.reload();
          });
        }
        }
      },{
        text: 'Stop',
        handler: function(self){
        var sm = sysUtilsGrid.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selections.items[0];
          sysutils__InitScript.stop(sel.data.id, function(provider, response){
            sysUtilsGrid.store.reload();
          });
        }
        }
      }]
    }));
    Ext.oa.SysUtils__Service_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.SysUtils__Service_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("sysutils__service_panel", Ext.oa.SysUtils__Service_Panel);

Ext.oa.SysUtils__Service_Module = Ext.extend(Object, {
  panel: "sysutils__service_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: "{% trans 'Service State'%}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/icons2/22x22/status/network-receive.png',
      panel: "sysutils__service_panel_inst",
      href: '#'
    });
    tree.appendToRootNodeById("menu_shutdown", {
      text: "{% trans 'Reboot' %}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-reboot.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.YellowDangerousMessage.confirm(
            "Reboot",
            "{% trans 'Do you really want to reboot openATTIC?' %}",
            function(btn, text){
              if( btn == 'yes' ){
                sysutils__System.reboot( function(provider, response){
                  Ext.oa.YellowDangerousMessage.alert("Rebooting", "The system is rebooting.");
                } );
              }
            } );
        }
      },
      href: '#'
    });
    tree.appendToRootNodeById("menu_shutdown", {
      text: "{% trans 'Shutdown' %}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-shutdown.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.RedDangerousMessage.confirm(
            "Shutdown",
            "{% trans 'Do you really want to shutdown openATTIC?' %}",
            function(btn, text){
              if( btn == 'yes' ){
                sysutils__System.shutdown( function(provider, response){
                  Ext.oa.RedDangerousMessage.alert("Shutting down", "The system is shutting down.");
                } );
              }
            });
        }
      },
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.SysUtils__Service_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
