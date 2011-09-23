Ext.namespace("Ext.oa");


Ext.oa.DangerousMessage = function(){
  // http://www.sencha.com/forum/showthread.php?7613-Ext.MessageBox-extend-class&p=46792&viewfull=1#post46792
  var f = function(){};
  f.prototype = Ext.MessageBox;
  var o = Ext.extend(f, {
    getDialog : function() {
      var d = o.superclass.getDialog.apply(this, arguments);
      d.mask.addClass("redmask");
      return d;
    }
  });
  return new o();
}();


Ext.oa.SysUtils_Panel = Ext.extend(Ext.Panel, {
  prepareMenuTree: function(tree){
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

// kate: space-indent on; indent-width 2; replace-tabs on;
