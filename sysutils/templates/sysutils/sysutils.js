Ext.namespace("Ext.oa");


Ext.oa.DangerousMessage = function(){
  // http://www.sencha.com/forum/showthread.php?7613-Ext.MessageBox-extend-class&p=46792&viewfull=1#post46792
  var f = function(){};
  f.prototype = Ext.MessageBox;
  var o = Ext.extend(f, {
    getDialog: function() {
      var d = o.superclass.getDialog.apply(this, arguments);
      d.mask.addClass("redmask");
      d.on("hide", function(){
        d.mask.removeClass("redmask");
      });
      return d;
    }
  });
  return new o();
}();


Ext.oa.SysUtils_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Service State",
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
          sortable: true
        },
        columns: [{
          header: "Service name",
          width: 200,
          dataIndex: "name"
        }, {
          header: "Status",
          width: 50,
          dataIndex: "status",
          renderer: function( val, x, store ){
            if( val === 0 )
              return '<img src="/filer/static/oxygen/16x16/status/security-high.png" title="running" />';
            else if( val === 3 )
              return '<img src="/filer/static/oxygen/16x16/status/security-low.png" title="stopped" />';
            else
              return '<img src="/filer/static/oxygen/16x16/status/security-medium.png" title="failure" />';
          }
        }]
      })
    }));
    Ext.oa.SysUtils_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[0].children.push({
      text: 'Service State',
      leaf: true,
      icon: '/filer/static/icons2/22x22/status/network-receive.png',
      panel: this,
      href: '#'
    });
    tree.root.attributes.children[5].children.push({
      text: 'Reboot',
      leaf: true,
      icon: '/filer/static/oxygen/22x22/actions/system-reboot.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.DangerousMessage.confirm(
            "Reboot",
            "Do you really want to reboot openATTIC?",
            function(btn, text){
              if( btn == 'yes' ){
                sysutils__System.reboot( function(provider, response){
                  Ext.oa.DangerousMessage.alert("Rebooting", "The system is rebooting.");
                } );
              }
            } );
        }
      },
      href: '#'
    });
    tree.root.attributes.children[5].children.push({
      text: 'Shutdown',
      leaf: true,
      icon: '/filer/static/oxygen/22x22/actions/system-shutdown.png',
      listeners: {
        click: function(self, ev){
          Ext.oa.DangerousMessage.confirm(
            "Shutdown",
            "Do you really want to shutdown openATTIC?",
            function(btn, text){
              if( btn == 'yes' ){
                sysutils__System.shutdown( function(provider, response){
                  Ext.oa.DangerousMessage.alert("Shutting down", "The system is shutting down.");
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
