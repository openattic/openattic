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
        scope:  this,
        listeners: {
          click: this.nodeClicked,
          nodedragover: this.nodeDragOver
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
            fieldLabel: "Auto",
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
            title: 'Bonding options (if applicable)',
            collapsible: true,
            collapsed: true,
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
              name: "bond_mode",
              xtype: "textfield"
            } ]
          }],
          buttons: [{
            text: "{% trans 'Save' %}",
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              self.ownerCt.ownerCt.getForm().submit({
                params: { id: -1, init_master: true, ordering: 0 },
                success: function(provider, response){
                  if( response.result ){
                    drbdDevGrid.store.reload();
                    addwin.hide();
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
            text: "{% trans 'Add Address'%}",
            icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
            handler: function(){
              if( !netDevPanel.active_device ){
                Ext.Msg.alert("{% trans 'Add Address'%}", "{% trans 'Please select a device first.' %}");
              }
              var ds = netDevPanel.addressgrid.store;
              console.log(ds);
              var ds_model = Ext.data.Record.create( ds.fields.keys );
              ds.insert(0, new ds_model({
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
                    ds.remove(sel);
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
              netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "bondX",
                  devtype: "bonding"
                }
              } );
            }
          }, {
            text: "VLAN",
            handler: function(){
              netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "vlanX",
                  devtype: "vlan"
                }
              } );
            }
          }, {
            text: "Bridge",
            handler: function(){
              netDevPanel.devicestree.getRootNode().appendChild( {
                device: {
                  id: -1,
                  devname: "brX",
                  devtype: "bridge"
                }
              } );
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

  nodeClicked: function(node, ev){
    //   ↓lol↓
    this.scope.active_device = node.attributes.device;

    if( node.attributes.device.id !== -1 ){
      // Existing device
      this.scope.deviceform.load({ params: { id: node.attributes.device.id } });
      this.scope.addressgrid.store.load({ params: { device__id: node.attributes.device.id } });
      var fld = this.scope.deviceform.getForm().findField("devname");
      if( fld ){
        fld.el.dom.readOnly = true;
        fld.readOnly = true;
      }
    }
    else{
      // New device
      this.scope.addressgrid.store.removeAll();
      var ds_model = Ext.data.Record.create( [
        "devname", "auto", "dhcp", "speed", "macaddress", "carrier", "operstate", "mtu"
      ] );
      this.scope.deviceform.getForm().loadRecord(new ds_model({
        devname: node.attributes.device.devname,
        auto: true,
        dhcp: false,
        speed: null,
        macaddress: null,
        carrier: null,
        operstate: null,
        mtu: null
      }));
      var fld = this.scope.deviceform.getForm().findField("devname");
      if( fld ){
        fld.el.dom.readOnly = false;
        fld.readOnly = false;
      }
    }
  },

  nodeDragOver: function(ev){
    var srcdev = ev.data.node.attributes.device,
        tgtdev = ev.target.attributes.device;

    console.log(String.format("Can haz drop of {0}({1}) on {2}({3})",
      srcdev.devname, srcdev.devtype, tgtdev.devname, tgtdev.devtype));

    // Ordering devices by the following score, we can drop each device on
    // every other device that has a lower score.
    var devscore = { bonding: 0, native: 1, vlan: 2, bridge: 3 }
    if( devscore[tgtdev.devtype] >= devscore[srcdev.devtype] )
      return false;

    // Forbid drop on a native device that is part of a bonding
    if( tgtdev.devtype == "native" && ev.target.parentNode != this.scope.devicestree.getRootNode() )
      return false;

    return true;
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
