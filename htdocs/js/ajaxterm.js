// kate: space-indent on; indent-width 2; replace-tabs on;

Ext.namespace('Ext.oa');

Ext.oa.WebSSHPanel = Ext.extend(Ext.BoxComponent, {
  // http://www.extjs.com/forum/showthread.php?p=54416#post54416
  onRender : function(ct, position){
    this.el = ct.createChild({
      tag: 'iframe',
      frameBorder: 0,
      src: '/ajaxterm/'
    });
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[3].children.push({
      text: 'SSH/Telnet',
      leaf: true,
      panel: this,
      icon: '/filer/static/icons2/22x22/apps/gnome-terminal.png',
      href: '#'
    });
  }
});
