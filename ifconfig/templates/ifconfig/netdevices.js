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
      this.canvas.redraw();
    }, this);
  },
  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.onRender.apply(this, arguments);
    this.on("leftclick", this.nodeOrEdgeClicked, this);
    this.store.on("datachanged", this.updateView, this);
    this.store.reload();
  },
  updateView: function(){
    // Sort our devices into groups by devtype. Each group that has nodes will then be drawn as a column.
    var devgroups = {
      native:  [],
      vlan:    [],
      bridge:  [],
      bonding: []
    };
    var devmap = {};
    var grouplen = {
      native:  0,
      vlan:    0,
      bridge:  0,
      bonding: 0
    };
    var maxgroup = "";
    var maxlength = 0;
    this.store.data.each(function(record){
      devgroups[record.data.devtype].push(record.json);
      devmap[record.data.devname] = record.json;
      grouplen[record.data.devtype]++;
      if( grouplen[record.data.devtype] > maxlength ){
        maxgroup  = record.data.devtype;
        maxlength = grouplen[record.data.devtype];
      }
    });

    console.log(
      String.format("We have {0} native, {1} bonding, {2} vlan, and {3} bridge devices.",
      grouplen["native"], grouplen["bonding"], grouplen["vlan"], grouplen["bridge"] )
    );
    console.log(
      String.format("Will start drawing with the {0} device group.", maxgroup)
    );

    debugger;

    var srcnodes = [];
    var haveids  = [];

    var renderDevice = function( dev, startx, starty ){
      srcnodes.push({id: dev.devname, x: startx, y: starty});
      if( dev.devtype === "bridge" && dev.brports.length > 0 ){
        var offset = (maxlength - dev.brports.length) / 2.0 * -1;
        for( var i = 0; i < dev.brports.length; i++ ){
          renderDevice( devmap[dev.brports[i].devname], startx - 1, offset - starty - i );
        }
      }
      else if( dev.devtype === "bonding" && dev.slaves.length > 0 ){
        var offset = (maxlength - dev.slaves.length) / 2.0 * -1;
        for( var i = 0; i < dev.slaves.length; i++ ){
          renderDevice( devmap[dev.slaves[i].devname], startx - 1, offset - starty - i );
        }
      }
    }

    var currgroup = "bridge";
    for( var i = 0; i < grouplen[currgroup]; i++ ){
      console.log( "Init render: " + devgroups[currgroup][i].devname );
      renderDevice( devgroups[currgroup][i], 0, i * -1 );
    }

    debugger;

    this.addNode({id: 'eth0',  color: 'rgb(255,0,0)', shape: 'square', size: 1, x:   0, y:  50});
    this.addNode({id: 'eth3',  color: 'rgb(255,0,0)', shape: 'square', size: 1, x:   0, y: 150});
    this.addNode({id: 'bond0', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 250, y: 100});
    this.addNode({id: 'vlan1', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y:   0});
    this.addNode({id: 'vlan2', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y: 101});
    this.addNode({id: 'vlan3', color: 'rgb(255,0,0)', shape: 'square', size: 1, x: 500, y: 200});
    this.addEdge({id1: 'eth0',  id2: 'bond0', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'eth3',  id2: 'bond0', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan1', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan2', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.addEdge({id1: 'bond0', id2: 'vlan3', color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
    this.updateOrder();
    this.saveMap();
  },
  nodeOrEdgeClicked: function(obj, evt){
    console.log("I am ze ubermensch!");
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
