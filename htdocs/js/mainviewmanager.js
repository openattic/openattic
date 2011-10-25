Ext.namespace("Ext.oa");

Ext.oa.MainViewManager = Ext.extend(Ext.Panel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      layout: 'border',
      tbar: new Ext.Toolbar({
        items: [
          new Ext.BoxComponent({
            autoEl: {
              tag: "img",
              src: MEDIA_URL + '/openattic.png'
            },
            region: "north",
            height: 50
          })
        ],
        plugins : [
          new Ext.ux.ToolbarDroppable({
            createItem: function(data) {
              var record = data.draggedRecord;
              return new Ext.Button({
                text   : "test",
                iconCls: '/srv/openattic/htdocs/openattic.png',
                reorderable: true
              });
            }
          }),
          new Ext.ux.ToolbarReorderer({defaultReorderable: false})
        ]
      }),
      items: [ new Ext.oa.MenuTree({
        title: 'Menu',
        region: "west",
        split: true,
        width: 250,
        minSize: 175,
        maxSize: 400,
        collapsible: true,
        enableDD: true
      }), {
        region: "center",
        activeItem: 0,
        border: false,
        hideBorders: true,
        layout: "card",
        layoutConfig: { deferredRender: true },
        items: (function(){
          var it = [];
          window.MainViewModules.forEach(function(mod){
            if( typeof mod.panel === "string" ){
              console.log( "Pushing xtype "+mod.panel );
              it.push({ xtype: mod.panel });
            }
            else if( typeof mod !== "undefined" ){
              console.log( "Pushing panel "+mod.title );
              it.push( mod );
            }
          });
          return it;
        }())
      }],
      modules: window.MainViewModules
    }));
    Ext.oa.MainViewManager.superclass.initComponent.apply(this, arguments);

    this.menutree = this.items.items[0];
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
    if( typeof toComponent === "string" )
      this.modcontainer.layout.setActiveItem( toComponent );
    else
      this.modcontainer.layout.setActiveItem( toComponent.id );
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
