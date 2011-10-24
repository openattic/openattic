{% load i18n %}
Ext.namespace("Ext.oa");


Ext.oa.DangerousMessage = function(color){
  // http://www.sencha.com/forum/showthread.php?7613-Ext.MessageBox-extend-class&p=46792&viewfull=1#post46792
  var f = function(){};
  f.prototype = Ext.MessageBox;
  var o = Ext.extend(f, {
    getDialog: function() {
      var d = o.superclass.getDialog.apply(this, arguments);
      d.mask.addClass(color);
      d.on("hide", function(){
        d.mask.removeClass(color);
      });
      return d;
    }
  });
  return new o();
};
Ext.oa.RedDangerousMessage = Ext.oa.DangerousMessage("redmask");

Ext.oa.YellowDangerousMessage = Ext.oa.DangerousMessage("yellowmask");



Ext.oa.SysUtils_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var sysUtilsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "{% trans 'Service State' %}",
      store: (function(){
        var st = new Ext.data.DirectStore({
          autoLoad: true,
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
    Ext.oa.SysUtils_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: "{% trans 'Service State'%}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/icons2/22x22/status/network-receive.png',
      panel: this,
      href: '#'
    });
    tree.root.attributes.children[4].children.push({
      text: "{% trans 'Reboot' %}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-reboot.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.YellowDangerousMessage.confirm(
            "Reboot",
            "Do you really want to reboot openATTIC?",
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
    tree.root.attributes.children[4].children.push({
      text: "{% trans 'Shutdown' %}",
      leaf: true,
      icon: '{{ MEDIA_URL }}/oxygen/22x22/actions/system-shutdown.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.RedDangerousMessage.confirm(
            "Shutdown",
            "Do you really want to shutdown openATTIC?",
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


window.MainViewModules.push( new Ext.oa.SysUtils_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
