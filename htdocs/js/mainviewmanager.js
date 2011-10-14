Ext.namespace("Ext.oa");

Ext.oa.MainViewManager = Ext.extend(Ext.Panel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      items: [ {
        title: 'openATTIC',
        region: "west",
        layout: "border",
        split: true,
        width: 250,
        minSize: 175,
        maxSize: 400,
        collapsible: true,
        border: false,
        items: [
          new Ext.BoxComponent({
            autoEl: { tag: "img", src: MEDIA_URL + '/openattic.png' }, region: "north", height: 80
          }),
          new Ext.oa.MenuTree({
            border: false,
            region: "center"
          })
        ]
      }, {
        region: "center",
        activeItem: 0,
        border: false,
        hideBorders: true,
        layout: "card",
        items: window.MainViewModules
      }],
      modules: window.MainViewModules
    }));
    Ext.oa.MainViewManager.superclass.initComponent.apply(this, arguments);

    this.menutree = this.items.items[0].items.items[1];
    this.modcontainer = this.items.items[1];
    this.currentComponent = window.MainViewModules[0];

    for( var i = 0; i < window.MainViewModules.length; i++ ){
      window.MainViewModules[i].prepareMenuTree(this.menutree);
    }

    this.menutree.on( 'beforeclick', this.treenodeClicked, this );
  },

  treenodeClicked: function( node, event ){
    if( node.leaf && typeof node.attributes.panel != "undefined" )
      this.switchComponent( node.attributes.panel );
  },

  switchComponent: function( toComponent ){
    this.modcontainer.layout.setActiveItem( toComponent.id );
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
