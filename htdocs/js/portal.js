Ext.namespace("Ext.oa");

Ext.oa.Portal = Ext.extend(Ext.ux.Portal, {
  initComponent: function(){
    var tools = [{
      id: 'gear',
      handler: function(){
        Ext.Msg.alert('Message', 'The Settings tool was clicked.');
      }
    },{
      id: 'close',
      handler: function(e, target, panel){
        panel.ownerCt.remove(panel, true);
      }
    }];
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "dashboard_inst",
      region:'center',
      margins:'35 5 5 0',
      items: (function(){
        var state = Ext.state.Manager.get("portalstate",
          [["portlet_lvs", "portlet_nfs"], ["portlet_cpu", "portlet_iops_itcosm3"], ["portlet_ram", "portlet_iops_sdb"]]);

        var all_portlets = Ext.oa.getDefaultPortlets(tools);

        for( var i = 0; i < window.MainViewModules.length; i++ ){
          if( window.MainViewModules[i].getDashboardPortlets ){
            var mod_portlets = window.MainViewModules[i].getDashboardPortlets(tools);
            // Append mod_portlets to all_portlets
            all_portlets.push.apply(all_portlets, mod_portlets);
          }
        }

        var items = [];
        // For each column...
        for( var c = 0; c < state.length; c++ ){
          var colitems = [];
          // for each portlet in this column's state...
          for( var p = 0; p < state[c].length; p++ ){
            // find this portlet in the all_portlets list and add it to this column
            for( var i = 0; i < all_portlets.length; i++ ){
              if( all_portlets[i].id === state[c][p] ){
                colitems.push(all_portlets[i]);
              }
            }
          }
          // now add a column wrapper for this column
          items.push({
            columnWidth:.33,
            style:'padding:10px 0 10px 10px',
            items: colitems
          });
        }
        return items;
      }())
    }));
    Ext.oa.Portal.superclass.initComponent.apply(this, arguments);
    this.on("drop", function(e){
      var portal = this;
      var state = [];
      for( var c = 0; c < portal.items.getCount(); c++ ){
        var colIds = [];
        var col = portal.items.get(c);
        for( var p = 0; p < col.items.getCount(); p++ ){
          colIds.push(col.items.get(p).id);
        }
        state.push(colIds);
      }
      Ext.state.Manager.set("portalstate", state);
    }, this);
  },

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_status", {
      text: 'Dashboard',
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/gnome-session.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.unshift( new Ext.oa.Portal() );

// kate: space-indent on; indent-width 2; replace-tabs on;
