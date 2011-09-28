// kate: space-indent on; indent-width 2; replace-tabs on;

Ext.namespace('Ext.oa');

Ext.oa.WebSSHIframe = Ext.extend(Ext.BoxComponent, {
  // http://www.extjs.com/forum/showthread.php?p=54416#post54416
  onRender : function(ct, position){
    this.el = ct.createChild({
      tag: 'iframe',
      frameBorder: 0,
      width: 665,
      height: 455,
      src: '/ajaxterm/'
    });
  }
});

Ext.oa.WebSSHPanel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var currentChartId = null;
    var nfsGrid = this;

    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'vbox',
      layoutConfig: {
        align: 'center',
        defaultMargins: {top:25, right:0, bottom:0, left:0}
      },

      items: [{
        title: 'SSH',
        items: new Ext.oa.WebSSHIframe()
       }]
    }));
    Ext.oa.WebSSHPanel.superclass.initComponent.apply(this, arguments);
  },


  prepareMenuTree: function(tree){
    tree.root.attributes.children[3].children.push({
      text: 'SSH/Telnet',
      leaf: true,
      panel: this,
      icon: '/filer/static/icons2/22x22/apps/gnome-terminal.png',
      href: '#',
      layout: 'absolute'
     });
  }
});

window.MainViewModules.push( new Ext.oa.WebSSHPanel() );

// kate: space-indent on; indent-width 2; replace-tabs on;

