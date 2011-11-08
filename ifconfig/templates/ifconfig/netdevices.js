{% load i18n %}

Ext.namespace("Ext.oa");


Ext.oa.Ifconfig__NetDevice_Panel = Ext.extend(Ext.canvasXpress, {
  initComponent: function(){
    var nfsGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'ifconfig__netdevice_panel_inst',
      title: "{% trans 'Network interfaces' %}",
      buttons: [
        {
          text: "",
          icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
          tooltip: "{% trans 'Reload' %}",
          handler: function(self){
            nfsGrid.store.reload();
          }
        }
      ],
      data: {
        nodes: [
          {id: 'Gene1', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 155, y: 160},
          {id: 'Gene2', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 155, y: 340},
          {id: 'Gene3', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 355, y: 160},
          {id: 'Gene4', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 355, y: 340},
          {id: 'Gene5', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 255, y: 100},
          {id: 'Gene6', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 255, y: 400},
          {id: 'Gene7', color: 'rgb(255,0,0)', shape: 'square', size: 1, x:  50, y: 250},
          {id: 'Gene8', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 450, y: 250}
        ],
        edges:  [
          {id1: 'Gene1', id2: 'Gene2', color: 'rgb(51,12,255)', width: '1', type: 'curvedArrowHeadLine'},
          {id1: 'Gene4', id2: 'Gene3', color: 'rgb(51,12,255)', width: '1', type: 'curvedArrowHeadLine'},
          {id1: 'Gene5', id2: 'Gene6', color: 'rgb(51,12,255)', width: '1', type: 'arrowHeadLine'},
          {id1: 'Gene3', id2: 'Gene8', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'},
          {id1: 'Gene7', id2: 'Gene1', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'}
        ],
        legend: {
          nodes: [],
          edges: [],
          text:  []
        }
      },
      options: {
        graphType: 'Network',
        backgroundGradient1Color: 'rgb(0,183,217)',
        backgroundGradient2Color: 'rgb(4,112,174)',
        nodeFontColor: 'rgb(29,34,43)',
        calculateLayout: false
      }
    }));
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.initComponent.apply(this, arguments);
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
