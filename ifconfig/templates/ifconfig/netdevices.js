/*
 Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

Ext.apply(Ext.form.VTypes, {
  IPAddress:  function(v) {
    return (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/).test(v) ||
           (/^[\da-f]{0,4}(:[\da-f]{0,4})+$/).test(v);
  },
  IPAddressText: gettext('Must be a numeric IP address.'),
  IPAddressMask: /[\da-f\.:]/i,

  IPAddressWithNetmask:  function(v) {
    return (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/(\d{1,2}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))?$/).test(v) ||
           (/^[\da-f]{0,4}(:[\da-f]{0,4})+(\/\d{1,3})?$/).test(v);
  },
  IPAddressWithNetmaskText: gettext('Must be a numeric IP address or "IP/Netmask".'),
  IPAddressWithNetmaskMask: /[\da-f\.\/:]/i,

  IPAddressList:  function(v) {
    // Match "123.(123.123.123 123.)*123.123.123", because that way spaces are not allowed at the end
    return (/^\d{1,3}\.(\d{1,3}\.\d{1,3}\.\d{1,3} \d{1,3}\.)*\d{1,3}\.\d{1,3}\.\d{1,3}$/).test(v);
  },
  IPAddressListText: gettext('Must be a space-separated list of numeric IP addresses.'),
  IPAddressListMask: /[\d\. ]/i,

  DomainName:  function(v) {
    return (/^[\w\.\-]+$/).test(v);
  },
  DomainNameText: gettext('Must only contain letters, numbers, "-" and ".".'),
  DomainNameMask: /[\w\.\-]/i
});

Ext.define('Ext.oa.Ifconfig__NetDevice_TreePanel', {
  alias: 'widget.ifconfig__netdevice_treepanel',
  extend: 'Ext.tree.TreePanel',
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      enableDD: true,
      rootVisible: false,
      store: Ext.create("Ext.data.TreeStore", {
        fields: ['text'],
        proxy: { type: "memory" },
        root: {
          text:     'root',
          expanded: true,
          children: [],
          id: "network_root_node"
        }
      })
    }));
    this.callParent(arguments);
    this.refresh();
  },

  onRender: function(){
    this.callParent(arguments);
  },

  refresh: function(){
    var self = this;
    ifconfig__NetDevice.get_root_devices(function(provider, response){
      var rootdevs = [], i;
      for( i = 0; i < response.result.length; i++ ){
        rootdevs.push({
          device: response.result[i]
        });
      }
      self.store.setRootNode({
        text: "...",
        id: Ext.id(),
        children: rootdevs
      });
    });
  }
});


Ext.define('Ext.oa.Ifconfig__NetDevice_Panel', {
  extend: 'Ext.Panel',
  alias: "widget.ifconfig__netdevice_panel",
  initComponent: function(){
    var netDevPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'ifconfig__netdevice_panel_inst',
      title: gettext('Network interfaces'),
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
          title: gettext('Device parameters'),
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
            fieldLabel: gettext('Device'),
            name: "devname",
            listeners: {
              change: function(self, newValue, oldValue){
                netDevPanel.active_node.setText(newValue);
              }
            }
          }, {
            fieldLabel: gettext('Speed'),
            name: "speed",
            readOnly: true
          }, {
            fieldLabel: gettext('MAC Address'),
            name: "macaddress",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: gettext('Connected'),
            name: "carrier",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: gettext('Active'),
            name: "operstate",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: gettext('Configure at boot'),
            name: "auto"
          }, {
            xtype: "checkbox",
            fieldLabel: gettext('Jumbo Frames'),
            name: "jumbo"
          }, {
            xtype: "numberfield",
            fieldLabel: gettext('MTU'),
            name: "mtu",
            readOnly: true
          }, {
            xtype: "checkbox",
            fieldLabel: gettext('DHCP'),
            name: "dhcp"
          }, {
            xtype: 'fieldset',
            id: 'ifconfig__netdevice_bondingfields',
            title: gettext('Bonding options (if applicable)'),
            collapsible: true,
            layout: 'form',
            items: [ {
              fieldLabel: gettext('MII Monitoring interval'),
              xtype: "numberfield",
              name: "bond_miimon"
            }, {
              fieldLabel: gettext('Down Delay'),
              xtype: "numberfield",
              name: "bond_downdelay"
            }, {
              fieldLabel: gettext('Up Delay'),
              xtype: "numberfield",
              name: "bond_updelay"
            }, {
              fieldLabel: gettext('Mode'),
              hiddenName: 'bond_mode',
              xtype:      'combo',
              store: [
                [ 'active-backup', gettext('Active-Backup')    ],
                [ 'broadcast',     gettext('Broadcast') ],
                [ '802.3ad',       gettext('Dynamic Link Aggregation (IEEE 802.3ad)') ],
                [ 'balance-rr',    gettext('Balance: RoundRobin') ],
                [ 'balance-xor',   gettext('Balance: XOR') ],
                [ 'balance-tlb',   gettext('Balance: Adaptive Transmit Load Balancing') ],
                [ 'balance-alb',   gettext('Balance: Adaptive Load Balancing') ]
              ],
              typeAhead:     true,
              triggerAction: 'all',
              emptyText:     gettext('Select...'),
              selectOnFocus: true,
              deferEmptyText: false
            } ]
          }],
          buttons: [{
            text: gettext('Save'),
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              var params = {id: netDevPanel.active_device.id},
                  haveslaves,
                  i, slavedev;

              if( netDevPanel.active_device.devtype === "bonding" ){
                params.slaves = [];
                haveslaves = false;
                for( i = 0; i < netDevPanel.active_node.childNodes.length; i++ ){
                  slavedev = netDevPanel.active_node.childNodes[i].attributes.device;
                  if( slavedev.devtype !== "native" ){
                    continue;
                  }
                  if( slavedev.id === -1 ){
                    Ext.Msg.alert(gettext('Save'), interpolate(
                      gettext('Slave device %s has not yet been saved, please save this device first.'),
                      [slavedev.devname]
                    ) );
                    return;
                  }
                  params.slaves.push(slavedev.id);
                  haveslaves = true;
                }
                if( !haveslaves ){
                  Ext.Msg.alert(gettext('Save'),
                    gettext('Bonding devices require at least one native slave device.')
                  );
                  return;
                }
              }
              if( netDevPanel.active_device.devtype === "vlan" ){
                if( netDevPanel.active_node.parentNode === netDevPanel.devicestree.getRootNode() ){
                  Ext.Msg.alert(gettext('Save'),
                    gettext('VLAN devices need to be dragged onto their base device first.')
                  );
                  return;
                }
                if( netDevPanel.active_node.parentNode.attributes.device.id === -1 ){
                  Ext.Msg.alert(gettext('Save'), interpolate(
                    gettext('VLAN base device %s has not yet been saved, please save this device first.'),
                    [netDevPanel.active_node.parentNode.attributes.device.devname]
                  ) );
                  return;
                }
                params.vlanrawdev = netDevPanel.active_node.parentNode.attributes.device.id;
              }
              if( netDevPanel.active_device.devtype === "bridge" ){
                if( netDevPanel.active_node.parentNode === netDevPanel.devicestree.getRootNode() ){
                  Ext.Msg.alert(gettext('Save'),
                    gettext('Bridge devices need to be dragged onto their base device first.')
                  );
                  return;
                }
                if( netDevPanel.active_node.parentNode.attributes.device.id === -1 ){
                  Ext.Msg.alert(gettext('Save'), interpolate(
                    gettext('Bridge port device %s has not yet been saved, please save this device first.'),
                    [netDevPanel.active_node.parentNode.attributes.device.devname]
                  ) );
                  return;
                }
                params.brports = [netDevPanel.active_node.parentNode.attributes.device.id];
              }
              self.ownerCt.ownerCt.getForm().submit({
                params: params,
                success: function(provider, response){
                  if( response.result.success && netDevPanel.active_device.id === -1 ){
                    netDevPanel.deviceform.load({ params: { id: response.result.id } });
                    netDevPanel.addressgrid.store.load({ params: { device__id: response.result.id } });
                    netDevPanel.deviceform.getForm().findField("devname").setReadOnly(true);
                    netDevPanel.devicestree.refresh();
                  }
                }
              });
            }
          }, {
            text: gettext('Cancel'),
            icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
            handler: function(self){
              self.ownerCt.ownerCt.getForm().reset();
            }
          }, {
            text: gettext('Delete Interface'),
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: function(self){
              ifconfig__NetDevice.in_use(netDevPanel.active_device.id, function(provider, response){
                if( response.result ){
                  Ext.Msg.alert(gettext('Delete Device'),
                    interpolate(
                      gettext('Device %s is in use, cannot delete it.'),
                        [netDevPanel.active_device.devname]
                    )
                  );
                }
                else{
                  ifconfig__NetDevice.remove(netDevPanel.active_device.id, function(provider, response){
                    if( response.type !== "exception" ){
                      netDevPanel.devicestree.refresh();
                    }
                  });
                }
              });
            }
          }]
        }, {
          xtype: "grid",
          ref: "../addressgrid",
          title: gettext('IP Addresses'),
          viewConfig: { forceFit: true },
          sortableColumns: true,
          columns: [{
            header: gettext('IP/Netmask'),
            dataIndex: "address",
            editor: new Ext.form.TextField({ vtype: 'IPAddressWithNetmask' })
          }, {
            header: gettext('Gateway'),
            dataIndex: "gateway",
            editor: new Ext.form.TextField({ vtype: 'IPAddress' })
          }, {
            header: gettext('Domain'),
            dataIndex: "domain",
            editor: new Ext.form.TextField({ vtype: 'DomainName' })
          }, {
            header: gettext('Nameservers'),
            dataIndex: "nameservers",
            editor: new Ext.form.TextField({ vtype: 'IPAddressList' })
          }, {
            header: gettext('Editable'),
            dataIndex: "configure",
            renderer: function( val, x, store ){
              if( val ){
                return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
              }
              return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
            }
          }],
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
            text: gettext('Save'),
            icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
            handler: function(self){
              var updateRec = function(record){
                if( !record.dirty ){
                  return;
                }
                if( record.data.id === -1 ){
                  var data = Ext.apply({}, record.data);
                  delete data.id;
                  ifconfig__IPAddress.create(data, function(provider, response){
                    if( response.type !== "exception" ){
                      record.set("id", response.result.id);
                      record.commit();
                    }
                  });
                }
                else{
                  ifconfig__IPAddress.set(record.data.id, record.getChanges(), function(provider, response){
                    if( response.type !== "exception" ){
                      record.commit();
                    }
                  });
                }
              };
              netDevPanel.addressgrid.store.each(updateRec);
            }
          }, {
            text: gettext('Add Address'),
            icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
            handler: function(){
              if( !netDevPanel.active_device ){
                Ext.Msg.alert(gettext('Add Address'), gettext('Please select a device first.'));
              }
              var ds = netDevPanel.addressgrid.store;
              var DS_Model = Ext.data.Record.create( ds.fields.keys );
              ds.insert(0, new DS_Model({
                id:        -1,
                device:    { "app": "ifconfig", "obj": "NetDevice", "id": netDevPanel.active_device.id },
                configure: true
              }));
              netDevPanel.addressgrid.startEditing( 0, 0 );
            }
          }, {
            text: gettext('Delete Address'),
            icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
            handler: function(){
              var sm = netDevPanel.addressgrid.getSelectionModel();
              if( sm.hasSelection() ){
                var sel = sm.selection.record;
                var ds = netDevPanel.addressgrid.store;
                if( !sel.data.configure ){
                  Ext.Msg.alert(gettext('Delete Address'),
                    gettext('This address has not been configured in this module, therefore it cannot be deleted here.')
                  );
                  return;
                }
                __main__.get_related({
                  "app": "ifconfig",
                  "obj": "IPAddress",
                  "id": sel.data.id
                }, function(provider, response){
                  if( response.result.length > 0 ){
                    Ext.Msg.alert(gettext('Delete Address'),
                      interpolate(
                        gettext('There are %s objects using this IP Address, cannot delete it.'),
                         [response.result.length]
                      )
                    );
                  }
                  else{
                    ifconfig__IPAddress.remove(sel.data.id, function(provider, response){
                      if( response.type !== "exception" ){
                        ds.remove(sel);
                      }
                    });
                  }
                });
              }
            }
          }]
        }]
      }],
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          netDevPanel.devicestree.refresh();
        }
      }, {
        text: gettext('Create device...'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
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
        text: gettext('Validate configuration'),
        icon: MEDIA_URL + "/oxygen/16x16/actions/preflight-verifier.png",
        handler: function(){
          ifconfig__NetDevice.validate_config(function(provider, response){
            if( response.type !== "exception" ){
              Ext.Msg.alert(gettext('Configuration validated'),
                gettext('No problems have been detected with your current configuration.')
              );
            }
            else{
              Ext.Msg.alert(gettext('Configuration invalid'),
                gettext('The following problem has been detected:') + "<br /><br />" +
                response.message
              );
            }
          });
        }
      }, {
        text: gettext('Activate configuration'),
        icon: MEDIA_URL + "/oxygen/16x16/actions/run-build-install.png",
        handler: function(){
        Ext.Msg.confirm(
          gettext('Activate configuration'),
          gettext('In order to safely update the configuration, all network interfaces will be shut down and restarted, possibly causing data loss if the system is currently being used. Proceed?'),
          function(btn){
            if(btn === 'yes'){
              ifconfig__NetDevice.activate_config(function(provider, response){
                if( response.type !== "exception" ){
                  Ext.Msg.alert(gettext('Configuration activated'),
                    gettext('The configuration has been updated.')
                  );
                }
                else{
                  Ext.Msg.alert(gettext('Configuration invalid'),
                    gettext('The following problem has been detected:') + "<br /><br />" +
                    response.message
                  );
                }
              });
            }
          });
        }
      }]
    }));
    this.callParent(arguments);
  },

  nodeSelected: function(selmodel, node, last){
    if( node === null ){ // Dragging
      return;
    }
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
      var DS_Model = Ext.data.Record.create( [
        "devname", "auto", "dhcp", "speed", "macaddress", "carrier", "operstate", "mtu"
      ] );
      this.deviceform.getForm().loadRecord(new DS_Model({
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
    if( node.attributes.device.devtype === "bonding" ){
      Ext.getCmp("ifconfig__netdevice_bondingfields").expand();
    }
    else{
      Ext.getCmp("ifconfig__netdevice_bondingfields").collapse();
    }
  },

  nodeDragOver: function(ev){
    var srcdev = ev.data.node.attributes.device,
        tgtdev = ev.target.attributes.device;

    // Ordering devices by the following score, we can drop each device on
    // every other device that has a lower score.
    var devscore = { bonding: 0, native: 1, vlan: 2, bridge: 3 };
    if( devscore[tgtdev.devtype] >= devscore[srcdev.devtype] ){
      return false;
    }

    // Forbid drop on a native device that is part of a bonding
    if( tgtdev.devtype === "native" && ev.target.parentNode !== this.devicestree.getRootNode() ){
      return false;
    }

    // Forbid dropping native devices that have children on a bonding
    if( tgtdev.devtype === "bonding" && srcdev.devtype === "native" && ev.data.node.hasChildNodes() ){
      return false;
    }

    return true;
  },

  onRender: function(){
    this.callParent(arguments);
    Ext.defer(function(){
      Ext.getCmp("ifconfig__netdevice_bondingfields").collapse();
    }, 200);
  },

  refresh: function(){
    this.devicestree.refresh();
  }
});



Ext.oa.Ifconfig__NetDevice_Module = {
  panel: "ifconfig__netdevice_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: gettext('Network'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/network.png',
      panel: 'ifconfig__netdevice_panel_inst'
    });
  }
};


window.MainViewModules.push( Ext.oa.Ifconfig__NetDevice_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
