{% load i18n %}

Ext.namespace("Ext.oa");


Ext.oa.Ifconfig__NetDevice_TreeNodeUI = Ext.extend(Ext.tree.TreeNodeUI, {
  renderElements : function(n, a, targetNode, bulkRender){
    Ext.oa.Ifconfig__NetDevice_TreeNodeUI.superclass.renderElements.call( this, n, a, targetNode, bulkRender );
    ifconfig__IPAddress.filter({"device__id": a.device.id}, function(provider, response){
      if(response.result.length == 0)
        return;
      Ext.DomHelper.applyStyles( this.elNode, 'position: relative' );
      var tpl = new Ext.DomHelper.createTemplate(
        '<span style="position: absolute; top: 0px; right: {pos}px;">{text}</span>'
        );
      var pos = 8;
      tpl.append( this.elNode, {
        'pos':  pos,
        'text': response.result.map(function(el){return el.address}).join(', ')
        } );
    }, this);
  }
});


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

  createNode : function(attr){
    Ext.apply(attr, {
      nodeType: "async",
      id:   Ext.id(),
      loader: this,
      text: ( attr.device ? attr.device.devname : '...' ),
    });
    if( attr.device ){
      attr['uiProvider'] = Ext.oa.Ifconfig__NetDevice_TreeNodeUI;
    }
    return new Ext.tree.TreePanel.nodeTypes[attr.nodeType](attr);
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
          device: devlist[i],
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
          device: response.result[i],
        });
      }
      self.setRootNode({
        nodeType: "async",
        text: "...",
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
      text: "{% trans 'Network' %}",
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
