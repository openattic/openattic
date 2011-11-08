{% load i18n %}

Ext.namespace("Ext.oa");


Ext.oa.Ifconfig__NetDevice_Panel = Ext.extend(Ext.canvasXpress, {
  initComponent: function(){
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'ifconfig__netdevice_panel_inst',
      title: "{% trans 'Network interfaces' %}",
      store: new Ext.data.DirectStore({
        fields: ["devname", "devtype", "id"],
        directFn: ifconfig__NetDevice.all,
      }),
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
          nfsGrid.store.reload();
        }
      } ],
//       data: {
//         nodes: [
//         ],
//         edges:  [
//         ],
//         legend: {
//           nodes: [],
//           edges: [],
//           text:  []
//         }
//       },
      options: {
        graphType: 'Network',
        backgroundGradient1Color: 'rgb(0,183,217)',
        backgroundGradient2Color: 'rgb(4,112,174)',
        nodeFontColor: 'rgb(29,34,43)',
        calculateLayout: false
      }
    }));
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.initComponent.apply(this, arguments);
    this.on("saveallchanges", function(obj){
      this.canvas.updateConfig({data: obj});
//       this.canvas.updateData(obj);
      this.canvas.redraw();
    }, this);
  },
  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.onRender.apply(this, arguments);
    this.store.on("datachanged", this.updateView, this);
    this.store.reload();
  },
  updateView: function(){
    console.log("Ohai");
    this.addNode({id: 'eth0',  color: 'rgb(255,0,0)', shape: 'square', size: 1, x:   0, y:  50});
    this.addNode({id: 'eth3',  color: 'rgb(255,0,0)', shape: 'square', size: 1, x:   0, y: 150});
    this.addNode({id: 'bond0', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 250, y: 100});
    this.addNode({id: 'vlan1', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y:   0});
    this.addNode({id: 'vlan2', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y: 100});
    this.addNode({id: 'vlan3', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y: 200});
    this.addEdge({id1: 'eth0',  id2: 'bond0', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'eth3',  id2: 'bond0', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan1', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan2', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan3', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.updateOrder();
    this.saveMap();
    console.log("Ohai iz done");
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
