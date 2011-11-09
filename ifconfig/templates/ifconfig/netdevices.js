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
        directFn: ifconfig__NetDevice.all
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
  
    var devmap = {};
    var clusters = [];
    var haveids  = {}; // Use an object so we can use the "in" operator
    var allconns = {};
    
    this.store.data.each(function(record){
      devmap[record.data.devname] = record.json;
      var src = (
        ( record.json.devtype === "bridge"  &&  record.json.brports ) ||
        ( record.json.devtype === "bonding" &&  record.json.slaves  ) ||
        ( record.json.devtype === "vlan"    && [record.json.vlanrawdev] ) || [] );
      if( !( record.data.devname in allconns ))
        allconns[record.data.devname] = [];
      for( var i = 0; i < src.length; i++ ){
        allconns[record.data.devname].push(src[i].devname);
        if( !( src[i].devname in allconns ))
          allconns[src[i].devname] = [];
        allconns[src[i].devname].push(record.data.devname);
      }
    });
    
//     debugger;
    
    var typeorder = ["bonding", "bridge", "vlan", "native"];
    for( var i = 0; i < typeorder.length; i++ ){
      var currtype = typeorder[i];
      this.store.data.each(function(storerecord){
        if( storerecord.json.devtype === currtype ){
          var currcluster = [];
          var currempty = true;
          var addDevs = function(record){
            if( record.devname in haveids )
              return;
            currcluster.push(record.devname);
            currempty = false;
            haveids[record.devname] = true;
            for( var i = 0; i < allconns[record.devname].length; i++ )
              addDevs(devmap[allconns[record.devname][i]]);
          };
          addDevs(storerecord.json);
          if( !currempty )
            clusters.push(currcluster);
        }
      });
    }
    
//     debugger;
    
    var currY = 0;
    for( var i = 0; i < clusters.length; i++ ){
      console.log( "Drawing node cluster " + (i + 1) + "/" + clusters.length);
      currY -= this.updateViewLine(devmap, clusters[i], currY);
    }

    this.updateOrder();
    this.saveMap();
  },
  updateViewLine: function(devmap, cluster, currY){
    // Sort our devices into groups by devtype. Each group that has nodes will then be drawn as a column.
    var devgroups = {
      native:  [],
      vlan:    [],
      bridge:  [],
      bonding: []
    };
    var grouplen = {
      native:  0,
      vlan:    0,
      bridge:  0,
      bonding: 0
    };
    var maxgroup = "";
    var maxlength = 0;
    for( var i = 0; i < cluster.length; i++ ){
      var dev = devmap[cluster[i]];
      devgroups[dev.devtype].push(dev);
      grouplen[dev.devtype]++;
      if( grouplen[dev.devtype] > maxlength ){
        maxgroup  = dev.devtype;
        maxlength = grouplen[dev.devtype];
      }
    }

    console.log(
      String.format("We have {0} native, {1} bonding, {2} vlan, and {3} bridge devices.",
      grouplen["native"], grouplen["bonding"], grouplen["vlan"], grouplen["bridge"] )
    );

    // For now, the coordinates are VIRTUAL coordinates because those are easier to calculate.
    // Those virtual coordinates place the top right device at (0,0) and then move
    // to the left bottom side by using negative coordinates.
    // The advantage of this system is that we can use array indexes to calculate our
    // virtual coordinates, and get the final ones by multiplying the virtuals with a
    // given step size in pixels.

    var srcnodes = [];
    var haveids  = {};

    // The `offset' value is added to every Y coordinate for the current devgroup in order
    // to render devgroups with less than `maxlength' devices in it centered vertically.
    // startX and startY define the coordinates of the current node WITHOUT the offset.

    var renderDevice = function( dev, offset, startx, starty ){
      if( dev.devname in haveids )
        return;
      console.log( "Render Device " + dev.devname + " at (" + startx + "," + (offset + starty) + ")" );
      srcnodes.push({ dev: dev, x: startx, y: (offset + starty) });
      haveids[dev.devname] = true;
      if( dev.devtype === "bridge" && dev.brports.length > 0 ){
        var nextoffset = (maxlength - dev.brports.length) / 2.0 * -1;
        for( var i = 0; i < dev.brports.length; i++ ){
          renderDevice( devmap[dev.brports[i].devname], nextoffset, startx - 1, starty - i );
        }
      }
      else if( typeof dev.vlanrawdev !== "undefined" ){
        renderDevice( devmap[dev.vlanrawdev.devname], offset, startx - 1, starty );
      }
      else if( dev.devtype === "bonding" && dev.slaves.length > 0 ){
        var nextoffset = (maxlength - dev.slaves.length) / 2.0 * -1;
        for( var i = 0; i < dev.slaves.length; i++ ){
          renderDevice( devmap[dev.slaves[i].devname], nextoffset, startx - 1, starty - i );
        }
      }
    }

    var typeorder = ["bridge", "vlan", "bonding", "native"];
    for( var t = 0; t < typeorder.length; t++ ){
      var currgroup = typeorder[t];
      for( var i = 0; i < grouplen[currgroup]; i++ ){
        console.log( "Init render: " + devgroups[currgroup][i].devname );
        var offset = (maxlength - grouplen[currgroup]) / 2.0 * -1;
        renderDevice( devgroups[currgroup][i], offset, 0, -i );
      }
      if( grouplen[currgroup] > 0 )
        break;
    }

    // (baseX,baseY) defines where in the canvas our virtual (0,0) will be located.
    // stepX and stepY define the step size that will be taken if the virtual coords move by 1.

    var baseX = 4 * 250,
        baseY = currY,
        stepX = 250,
        stepY = 100;

    for( var i = 0; i < srcnodes.length; i++ ){
      // Translate the virtual coordinates into real ones and add the Node with those coordinates.
      var realX =  baseX + (stepX * srcnodes[i].x),
          realY = (baseY + (stepY * srcnodes[i].y)) * -1;
      // Work around the arrow heads not appearing when two nodes have the same Y coordinate
      // by adding i to it. This moves the nodes by a few pixels which the user won't even notice.
      realY += i;
      console.log( "Adding Node " + srcnodes[i].dev.devname + " at (" + realX + "," + realY + ")" );
      this.addDevNode(srcnodes[i].dev, realX, realY);
    }

    this.store.data.each(function(record){
      var dev = record.json;
      if( dev.devtype === "bridge" && dev.brports.length > 0 ){
        for( var i = 0; i < dev.brports.length; i++ ){
          this.addDevEdge(dev, dev.brports[i]);
        }
      }
      else if( typeof dev.vlanrawdev !== "undefined" ){
        this.addDevEdge(dev, dev.vlanrawdev);
      }
      else if( dev.devtype === "bonding" && dev.slaves.length > 0 ){
        for( var i = 0; i < dev.slaves.length; i++ ){
          this.addDevEdge(dev, dev.slaves[i]);
        }
      }
    }, this);

    return stepY * maxlength;
  },
  addDevNode: function(dev, x, y){
    return this.addNode({id: dev.devname,  color: 'rgb(255,0,0)', shape: 'square', size: 1, x: x, y: y});
  },
  addDevEdge: function(dev1, dev2){
    return this.addEdge({id1: dev1.devname, id2: dev2.devname, color: 'rgb(51,12,255)', width: '1', type: 'bezierArrowHeadLine'});
  },
  nodeOrEdgeClicked: function(obj, evt){
    if( typeof obj.nodes !== "undefined" ){
      var clicked = obj.nodes[0];
      console.log( "You clicked on the device " + clicked.id );
    }
    else if( typeof obj.edges !== "undefined" ){
      var clicked = obj.edges[0];
      console.log( "You clicked on the edge between device " + clicked.id1 + " and " + clicked.id2 );
    }
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
