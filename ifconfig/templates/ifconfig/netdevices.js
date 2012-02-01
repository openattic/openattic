{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Ifconfig__NetDevice_TreeLoader = function(config){
  Ext.apply(this, config);
  Ext.applyIf(this, {
    directFn: ifconfig__NetDevice.filter,
    paramsAsHash: true,
    rootdevs: {}
  });
  Ext.oa.Ifconfig__NetDevice_TreeLoader.superclass.constructor.apply(this, arguments);
}

Ext.extend(Ext.oa.Ifconfig__NetDevice_TreeLoader, Ext.tree.TreeLoader, {
  getParams: function(node){
    return [{id: node.attributes.device.id}]
  },

  handleResponse: function(response){
    var myresp = {
      responseData: [],
      responseText: "",
      argument: response.argument
    };
    var self = this;
    var pushdevs = function(devlist){
      for( var i = 0; i < devlist.length; i++ ){
        if( devlist[i].devname in self.rootdevs )
          continue;
        myresp.responseData.push({
          nodeType: "async",
          text: devlist[i].devname,
          id:   Ext.id(),
          device: devlist[i]
        });
      }
    }
    pushdevs(response.responseData[0].childdevs);
    pushdevs(response.responseData[0].basedevs);
    return Ext.oa.Ifconfig__NetDevice_TreeLoader.superclass.handleResponse.apply(this, [myresp]);
  }
});

Ext.oa.Ifconfig__NetDevice_TreePanel = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      rootVisible: false,
      loader: new Ext.oa.Ifconfig__NetDevice_TreeLoader(),
      root: {
        nodeType: "async",
        text: "Loading...",
        id: Ext.id(),
        device: null
      }
    }));
    Ext.oa.Ifconfig__NetDevice_TreePanel.superclass.initComponent.apply(this, arguments);
    this.refresh();
  },

  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_TreePanel.superclass.onRender.apply(this, arguments);
  },

  refresh: function(){
    var self = this;
    ifconfig__NetDevice.get_root_devices(function(provider, response){
      var rootdevs = [];
      for( var i = 0; i < response.result.length; i++ ){
        self.loader.rootdevs[response.result[i].devname] = true;
        rootdevs.push({
          nodeType: "async",
          text: response.result[i].devname,
          id:   Ext.id(),
          device: response.result[i]
        });
      }
      self.setRootNode({
        nodeType: "async",
        text: "VollDerRoot",
        id: Ext.id(),
        children: rootdevs
      });
    });
  }
});


Ext.oa.Ifconfig__NetDevice_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var netDevPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'ifconfig__netdevice_panel_inst',
      title: "{% trans 'Network interfaces' %}",
      layout: "border",
      items: [ new Ext.oa.Ifconfig__NetDevice_TreePanel({
        region: "west",
        width: 300
      }), {
        region: "center",
        html: "now,asdi"
      }]
    }));
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.onRender.apply(this, arguments);
  }
});



Ext.reg("ifconfig__netdevice_panel", Ext.oa.Ifconfig__NetDevice_Panel);

Ext.oa.Ifconfig__NetDevice_Module = Ext.extend(Object, {
  panel: "ifconfig__netdevice_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: 'Network',
      icon: MEDIA_URL + '/icons2/22x22/places/gnome-fs-network.png',
      panel: 'ifconfig__netdevice_panel_inst',
      children: [ {
        text: 'General',
        leaf: true, href: '#',
        icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
        panel: 'ifconfig__netdevice_panel_inst'
      }, {
        text: 'Proxy',
        leaf: true, href: '#',
        icon: MEDIA_URL + '/icons2/22x22/apps/preferences-system-network-proxy.png'
      }, {
        text: 'Domain',
        icon: MEDIA_URL + '/icons2/128x128/apps/domain.png',
        children: [
          {text: 'Active Directory',  leaf: true, href: '#'},
          {text: 'LDAP',              leaf: true, href: '#'}
        ]
      } ]
    });
  }
});


window.MainViewModules.push( new Ext.oa.Ifconfig__NetDevice_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
