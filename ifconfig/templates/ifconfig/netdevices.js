{% load i18n %}

Ext.namespace("Ext.oa");

Ext.apply(Ext.form.VTypes, {
    IPAddress:  function(v) {
      return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
    },
    IPAddressText: "{% trans 'Must be a numeric IP address.' %}",
    IPAddressMask: /[\d\.]/i,

    IPAddressWithNetmask:  function(v) {
      return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/(\d{1,2}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))?$/.test(v);
    },
    IPAddressWithNetmaskText: "{% trans 'Must be a numeric IP address or 'IP/Netmask'.' %}",
    IPAddressWithNetmaskMask: /[\d\.\/]/i,

    IPAddressList:  function(v) {
      // Match "123.(123.123.123 123.)*123.123.123", because that way spaces are not allowed at the end
      return /^\d{1,3}\.(\d{1,3}\.\d{1,3}\.\d{1,3} \d{1,3}\.)*\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
    },
    IPAddressListText: "{% trans 'Must be a space-separated list of numeric IP addresses.' %}",
    IPAddressListMask: /[\d\. ]/i,

    DomainName:  function(v) {
      return /^[\w\.\-]+$/.test(v);
    },
    DomainNameText: "{% trans 'Must only contain letters, numbers, '-' and '.'.' %}",
    DomainNameMask: /[\w\.\-]/i
});

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
      text: ( attr.device ? attr.device.devname : '...' )
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
    if( response.responseData.length >= 1 ){
      var self = this;
      var pushdevs = function(devlist){
        for( var i = 0; i < devlist.length; i++ ){
          if( devlist[i].devname in self.rootdevs )
            continue;
          myresp.responseData.push({
            device: devlist[i]
          });
        }
      }
      pushdevs(response.responseData[0].childdevs);
      if( response.responseData[0].devtype === "bonding" )
        pushdevs(response.responseData[0].basedevs);
    }
    return Ext.oa.Ifconfig__NetDevice_TreeLoader.superclass.handleResponse.apply(this, [myresp]);
  }
});

Ext.oa.Ifconfig__NetDevice_TreePanel = Ext.extend(Ext.tree.TreePanel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      enableDD: true,
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
          device: response.result[i]
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
        width:  300,
        ref:    'devicestree',
        listeners: {
          afterrender: function(tree){
            tree.getSelectionModel().on("selectionchange", netDevPanel.nodeSelected, netDevPanel);
          },
          nodedragover: function(ev){
            return netDevPanel.nodeDragOver(ev);
          }
        }
      }), {
        region: "center",
        layout: "vbox",
        defaults: {
          flex: 1,
          border: false
        },
        layoutConfig: {
          align: "stretch"
        },
        items: [{
          xtype: "form",
          title: "{% trans 'Device parameters' %}",
          autoScroll: true,
          ref: "../deviceform",
          bodyStyle: 'padding:5px 5px;',
          api: {
            load:   ifconfig__NetDevice.get_ext,
            submit: ifconfig__NetDevice.set_ext
          },
          trackResetOnLoad: true,
          paramOrder: ["id"],
          defaults: {
            xtype: "textfield",
            anchor: '-20px',
            defaults: {
              anchor: "0px"
            }
          },
          items: [{
            fieldLabel: "Device",
            name: "devname",
            listeners: {
              change: function(self, newValue, oldValue){
                netDevPanel.active_node.setText(newValue);
              }
            }
          }, {
            fieldLabel: "Speed",
            name: "speed",
            readOnly: true
          }, {
            fieldLabel: "MAC Address",
            name: "macaddress",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: "Connected",
            name: "carrier",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: "Active",
            name: "operstate",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: "Configure at boot",
            name: "auto"
          }, {
            xtype: "numberfield",
            fieldLabel: "MTU",
            name: "mtu"
          }, {
            xtype: "checkbox",
            fieldLabel: "DHCP",
            name: "dhcp"
          }, {
            xtype: 'fieldset',
            ref: '../../bondingfields',
            title: 'Bonding options (if applicable)',
            collapsible: true,
            layout: 'form',
            items: [ {
              fieldLabel: "{% trans 'MII Monitoring interval' %}",
              xtype: "numberfield",
              name: "bond_miimon"
            }, {
              fieldLabel: "{% trans 'Down Delay' %}",
              xtype: "numberfield",
              name: "bond_downdelay"
            }, {
              fieldLabel: "{% trans 'Up Delay' %}",
              xtype: "numberfield",
              name: "bond_updelay"
            }, {
              fieldLabel: "{% trans 'Mode' %}",
              name:       "bond_mode__",
              hiddenName: 'bond_mode',
              xtype:      'combo',
              store: [
                [ 'active-backup', "{% trans 'Active-Backup' %}"    ],
                [ 'broadcast',     "{% trans 'Broadcast' %}" ],
                [ '802.3ad',       "{% trans 'Dynamic Link Aggregation (IEEE 802.3ad)' %}" ],
                [ 'balance-rr',    "{% trans 'Balance: RoundRobin' %}" ],
                [ 'balance-xor',   "{% trans 'Balance: XOR' %}" ],
                [ 'balance-tlb',   "{% trans 'Balance: Adaptive Transmit Load Balancing' %}" ],
                [ 'balance-alb',   "{% trans 'Balance: Adaptive Load Balancing' %}" ]
              ],
              typeAhead:     true,
              triggerAction: 'all',
              emptyText:     'Select...',
              selectOnFocus: true,
            } ]
          }],
          buttons: [{
            text: "{% trans 'Save' %}",
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              var params = {id: netDevPanel.active_device.id};

              if( netDevPanel.active_device.devtype == "bonding" ){
                params.slaves = [];
                var haveslaves = false;
                for( var i = 0; i < netDevPanel.active_node.childNodes.length; i++ ){
                  var slavedev = netDevPanel.active_node.childNodes[i].attributes.device;
                  if( slavedev.devtype != "native" )
                    continue;
                  if( slavedev.id === -1 ){
                    Ext.Msg.alert("{% trans 'Save' %}", interpolate(
                      "{% trans 'Slave device %s has not yet been saved, please save this device first.' %}",
                      [slavedev.devname]
                    ) );
                    return;
                  }
                  params.slaves.push(slavedev.id);
                  haveslaves = true;
                }
                if( !haveslaves ){
                  Ext.Msg.alert("{% trans 'Save' %}",
                    "{% trans 'Bonding devices require at least one native slave device.' %}"
                  );
                  return;
                }
              }
              if( netDevPanel.active_device.devtype == "vlan" ){
                if( netDevPanel.active_node.parentNode == netDevPanel.devicestree.getRootNode() ){
                  Ext.Msg.alert("{% trans 'Save' %}",
                    "{% trans 'VLAN devices need to be dragged onto their base device first.' %}"
                  );
                  return;
                }
                if( netDevPanel.active_node.parentNode.attributes.device.id === -1 ){
                  Ext.Msg.alert("{% trans 'Save' %}", interpolate(
                    "{% trans 'VLAN base device %s has not yet been saved, please save this device first.' %}",
                    [netDevPanel.active_node.parentNode.attributes.device.devname]
                  ) );
                  return;
                }
                params.vlanrawdev = netDevPanel.active_node.parentNode.attributes.device.id;
              }
              if( netDevPanel.active_device.devtype == "bridge" ){
                if( netDevPanel.active_node.parentNode == netDevPanel.devicestree.getRootNode() ){
                  Ext.Msg.alert("{% trans 'Save' %}",
                    "{% trans 'Bridge devices need to be dragged onto their base device first.' %}"
                  );
                  return;
                }
                if( netDevPanel.active_node.parentNode.attributes.device.id === -1 ){
                  Ext.Msg.alert("{% trans 'Save' %}", interpolate(
                    "{% trans 'Bridge port device %s has not yet been saved, please save this device first.' %}",
                    [netDevPanel.active_node.parentNode.attributes.device.devname]
                  ) );
                  return;
                }
                params.brports = [netDevPanel.active_node.parentNode.attributes.device.id];
              }
              console.log(params);
              self.ownerCt.ownerCt.getForm().submit({
                params: params,
                success: function(provider, response){
                  if( response.result.success && netDevPanel.active_device.id === -1 ){
                    netDevPanel.deviceform.load({ params: { id: response.result.id } });
                    netDevPanel.addressgrid.store.load({ params: { device__id: response.result.id } });
                    netDevPanel.deviceform.getForm().findField("devname").setReadOnly(true);
                  }
                }
              });
            }
          }, {
            text: "{% trans 'Cancel' %}",
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
            handler: function(self){
              self.ownerCt.ownerCt.getForm().reset();
            }
          }]
        }, {
          xtype: "editorgrid",
          ref: "../addressgrid",
          title: "IP Addresses",
          viewConfig: { forceFit: true },
          colModel: new Ext.grid.ColumnModel({
            defaults: {
              sortable: true
            },
            columns: [{
              header: "IP",
              dataIndex: "address",
              editor: new Ext.form.TextField({ vtype: 'IPAddressWithNetmask' })
            }, {
              header: "Gateway",
              dataIndex: "gateway",
              editor: new Ext.form.TextField({ vtype: 'IPAddress' })
            }, {
              header: "Domain",
              dataIndex: "domain",
              editor: new Ext.form.TextField({ vtype: 'DomainName' })
            }, {
              header: "Nameservers",
              dataIndex: "nameservers",
              editor: new Ext.form.TextField({ vtype: 'IPAddressList' })
            }, {
              header: "Editable",
              dataIndex: "configure",
              renderer: function( val, x, store ){
                if( val )
                  return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
                return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
              }
            }]
          }),
          store: new Ext.data.DirectStore({
            fields: ["domain", "nameservers", "gateway", "address", "device", "id", "configure"],
            directFn: ifconfig__IPAddress.filter
          }),
          listeners: {
            beforeedit: function( event ){
              return event.record.data.configure;
            }
          },
          buttons: [{
            text: "{% trans 'Save' %}",
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              var updateRec = function(record){
                if( !record.dirty )
                  return;
                if( record.data.id === -1 ){
                  var data = Ext.apply({}, record.data);
                  delete data["id"];
                  ifconfig__IPAddress.create(data, function(provider, response){
                    if( response.type !== "exception" )
                      record.set("id", response.result.id);
                      record.commit();
                  });
                }
                else{
                  ifconfig__IPAddress.set(record.data.id, record.getChanges(), function(provider, response){
                    if( response.type !== "exception" )
                      record.commit();
                  });
                }
              }
              netDevPanel.addressgrid.store.each(updateRec);
            }
          }, {
            text: "{% trans 'Add Address'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
            handler: function(){
              if( !netDevPanel.active_device ){
                Ext.Msg.alert("{% trans 'Add Address'%}", "{% trans 'Please select a device first.' %}");
              }
              var ds = netDevPanel.addressgrid.store;
              var ds_model = Ext.data.Record.create( ds.fields.keys );
              ds.insert(0, new ds_model({
                id:        -1,
                device:    { "app": "ifconfig", "obj": "NetDevice", "id": netDevPanel.active_device.id },
                configure: true
              }))
              netDevPanel.addressgrid.startEditing( 0, 0 );
            }
          }, {
            text: "{% trans 'Delete Address'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: function(){
              var sm = netDevPanel.addressgrid.getSelectionModel();
              if( sm.hasSelection() ){
                var sel = sm.selection.record;
                var ds = netDevPanel.addressgrid.store;
                if( !sel.data.configure ){
                  Ext.Msg.alert("{% trans 'Delete Address'%}",
                    "{% trans 'This device has not been configured in this module, therefore it cannot be deleted here.' %}"
                  );
                  return;
                }
                __main__.get_related({
                  "app": "ifconfig",
                  "obj": "IPAddress",
                  "id": sel.data.id
                }, function(provider, response){
                  if( response.result.length > 0 ){
                    Ext.Msg.alert("{% trans 'Delete Address'%}",
                      interpolate(
                        "{% trans 'There are %s objects using this IP Address, cannot delete it.' %}",
                         [response.result.length]
                      )
                    );
                  }
                  else{
                    ifconfig__IPAddress.remove(sel.data.id, function(provider, response){
                      if( response.type !== "exception" )
                        ds.remove(sel);
                    });
                  }
                });
              }
            }
          }]
        }]
      }],
      buttons: [{
        text: "{% trans 'Create device...'%}",
        icon: MEDIA_URL + "/oxygen/16x16/actions/preflight-verifier.png",
        menu: new Ext.menu.Menu({
          items: [{
            text: "Bonding",
            handler: function(){
              var node = netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "bondX",
                  devtype: "bonding"
                }
              } );
              netDevPanel.devicestree.getSelectionModel().select(node);
            }
          }, {
            text: "VLAN",
            handler: function(){
              var node = netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "vlanX",
                  devtype: "vlan"
                }
              } );
              netDevPanel.devicestree.getSelectionModel().select(node);
            }
          }, {
            text: "Bridge",
            handler: function(){
              var node = netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "brX",
                  devtype: "bridge"
                }
              } );
              netDevPanel.devicestree.getSelectionModel().select(node);
            }
          }]
        })
      }, {
        text: "{% trans 'Validate configuration'%}",
        icon: MEDIA_URL + "/oxygen/16x16/actions/preflight-verifier.png",
        handler: function(){
        }
      }, {
        text: "{% trans 'Activate configuration'%}",
        icon: MEDIA_URL + "/oxygen/16x16/actions/run-build-install.png",
        handler: function(){
        }
      }]
    }));
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.initComponent.apply(this, arguments);
  },

  nodeSelected: function(selmodel, node, last){
    if( node === null ) // Dragging
      return;
    this.active_device = node.attributes.device;
    this.active_node   = node;

    if( node.attributes.device.id !== -1 ){
      // Existing device
      node.expand();
      this.deviceform.load({ params: { id: node.attributes.device.id } });
      this.addressgrid.store.load({ params: { device__id: node.attributes.device.id } });
      this.deviceform.getForm().findField("devname").setReadOnly(true);
    }
    else{
      // New device
      this.addressgrid.store.removeAll();
      var ds_model = Ext.data.Record.create( [
        "devname", "auto", "dhcp", "speed", "macaddress", "carrier", "operstate", "mtu"
      ] );
      this.deviceform.getForm().loadRecord(new ds_model({
        devname: node.attributes.device.devname,
        auto: true,
        dhcp: false,
        speed: null,
        macaddress: null,
        carrier: null,
        operstate: null,
        mtu: null,
        bond_downdelay: 200,
        bond_updelay: 200,
        bond_miimon: 100,
        bond_mode: "active-backup"
      }));
      this.deviceform.getForm().findField("devname").setReadOnly(false);
    }
    if( node.attributes.device.devtype === "bonding" )
      this.bondingfields.expand();
    else
      this.bondingfields.collapse();
  },

  nodeDragOver: function(ev){
    var srcdev = ev.data.node.attributes.device,
        tgtdev = ev.target.attributes.device;

    // Ordering devices by the following score, we can drop each device on
    // every other device that has a lower score.
    var devscore = { bonding: 0, native: 1, vlan: 2, bridge: 3 }
    if( devscore[tgtdev.devtype] >= devscore[srcdev.devtype] )
      return false;

    // Forbid drop on a native device that is part of a bonding
    if( tgtdev.devtype == "native" && ev.target.parentNode != this.devicestree.getRootNode() )
      return false;

    // Forbid dropping native devices that have children on a bonding
    if( tgtdev.devtype == "bonding" && srcdev.devtype == "native" && ev.data.node.hasChildNodes() )
      return false;

    return true;
  },

  onRender: function(){
    Ext.oa.Ifconfig__NetDevice_Panel.superclass.onRender.apply(this, arguments);
    var self = this;
    (function(){
      self.bondingfields.collapse();
    }).defer(200);
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
