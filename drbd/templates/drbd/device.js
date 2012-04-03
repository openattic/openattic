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

Ext.oa.Drbd__Device_Panel = Ext.extend(Ext.grid.GridPanel, {
  showEditWindow: function(config, record){
    "use strict";
    var drbdDevGrid = this;
    var addwin = new Ext.Window(Ext.apply(config, {
      layout: "fit",
      defaults: {
        autoScroll:true
      },
      height: 600,
      width: 700,
      items: [{
        xtype: "form",
        bodyStyle: 'padding:5px 5px;',
        api: {
          load:   drbd__DrbdDevice.get_ext,
          submit: drbd__DrbdDevice.set_ext
        },
        baseParams: {
          id: (record ? record.id : -1)
        },
        paramOrder: ["id"],
        listeners: {
          afterrender: function(self){
            self.getForm().load();
          }
        },
        defaults: {
          xtype: "textfield",
          anchor: '-20px',
          defaults: { //teehee
            anchor: "0px"
          }
        },
        items: [{
          xtype: 'fieldset',
          title: 'Connection settings',
          layout: 'form',
          items: [ {
            xtype: "volumefield",
            hiddenName: "volume",
            filesystem__isnull: true
          }, {
            xtype:      'combo',
            fieldLabel: gettext('Peer Host'),
            name:       'peerhost',
            hiddenName: 'peerhost',
            store: new Ext.data.DirectStore({
              fields: ["id", "name"],
              baseParams: { field: "name", kwds: {} },
              paramOrder: ["field", "query", "kwds"],
              directFn: peering__PeerHost.filter_combo
            }),
            typeAhead:     true,
            triggerAction: 'all',
            emptyText:     gettext('Select...'),
            selectOnFocus: true,
            displayField:  'name',
            valueField:    'id',
            ref: 'targetfield'
          }, {
            fieldLabel: gettext('Address (here)'),
            name: "selfaddress",
            xtype: 'textfield'
          }, {
            fieldLabel: gettext('Address (Peer)'),
            name: "peeraddress",
            xtype: 'textfield'
          }, {
            xtype: 'radiogroup',
            fieldLabel: 'Protocol',
            columns: 1,
            items: [
              {name: "protocol", boxLabel: gettext('A: Asynchronous'), inputValue: "A"},
              {name: "protocol", boxLabel: gettext('B: Memory Synchronous (Semi-Synchronous)'), inputValue: "B"},
              {name: "protocol", boxLabel: gettext('C: Synchronous'), checked: true, inputValue: "C"}
            ]
          }, {
            fieldLabel: gettext('Syncer Rate'),
            name: "syncer_rate",
            xtype: 'textfield',
            value: "5M"
          }, {
            fieldLabel: gettext('Secret'),
            name: "secret",
            xtype: 'textfield'
          }, {
            fieldLabel: gettext('Timeout'),
            name: "wfc_timeout",
            xtype: 'numberfield',
            value: 10
          }, {
            fieldLabel: gettext('Timeout when degraded'),
            name: "degr_wfc_timeout",
            xtype: 'numberfield',
            value: 120
          }, {
            fieldLabel: gettext('Timeout when outdated'),
            name: "outdated_wfc_timeout",
            xtype: 'numberfield',
            value: 15
          }, {
            xtype: 'radiogroup',
            fieldLabel: 'Authentication algorithm',
            columns: 1,
            items: [
              {name: "cram_hmac_alg", boxLabel: "SHA1",   inputValue: "sha1", checked: true},
              {name: "cram_hmac_alg", boxLabel: "MD5",    inputValue: "md5"    },
              {name: "cram_hmac_alg", boxLabel: "CRC32C", inputValue: "crc32c" }
            ]
          } ]
        }, {
          xtype: 'fieldset',
          title: 'Error handling',
          collapsible: true,
          collapsed: true,
          layout: 'form',
          items: [ {
            fieldLabel: gettext('On I/O Error'),
            xtype: 'radiogroup',
            columns: 1,
            items: [ {
              name: "on_io_error", inputValue: "pass_on", checked: true,
              boxLabel: gettext('Report the I/O error to the file system on the primary, ignore it on the secondary.')
            }, {
              name: "on_io_error", inputValue: "call-local-io-error",
              boxLabel: gettext('Call the local-io-error handler script.')
            }, {
              name: "on_io_error", inputValue: "detach",
              boxLabel: gettext('Detach and continue in diskless mode.')
            } ]
          }, {
            fieldLabel: gettext('Fencing'),
            xtype: 'radiogroup',
            columns: 1,
            items: [ {
              name: "fencing", inputValue: "dont-care", checked: true,
              boxLabel: gettext('No fencing actions are undertaken.')
            }, {
              name: "fencing", inputValue: "resource-only",
              boxLabel: gettext('Call the fence-peer handler.')
            }, {
              name: "fencing", inputValue: "resource-and-stonith",
              boxLabel: gettext('Call the fence-peer handler, which outdates or STONITHes the peer.')
            } ]
          } ]
        }, {
          xtype: 'fieldset',
          title: 'Split Brain recovery',
          collapsible: true,
          collapsed: true,
          layout: 'form',
          items: [{
            fieldLabel: gettext('No Primaries'),
            xtype: 'radiogroup',
            columns: 1,
            items: [ {
              name: "sb_0pri", inputValue: "disconnect",
              boxLabel: gettext('Simply disconnect without resynchronization.')
            }, {
              name: "sb_0pri", inputValue: "discard-younger-primary", checked: true,
              boxLabel: gettext('Discard the younger Primary and sync from the host who was primary before.')
            }, {
              name: "sb_0pri", inputValue: "discard-older-primary",
              boxLabel: gettext('Discard the older Primary and sync from the host who last became primary.')
            }, {
              name: "sb_0pri", inputValue: "discard-zero-changes",
              boxLabel: gettext('Discard the node who has not written any changes. If both have changes, disconnect.')
            }, {
              name: "sb_0pri", inputValue: "discard-least-changes",
              boxLabel: gettext('Discard the node with the least changes and sync from the one with most.')
            } ]
          }, {
            fieldLabel: gettext('One Primary'),
            xtype: 'radiogroup',
            columns: 1,
            items: [ {
              name: "sb_1pri", inputValue: "disconnect",
              boxLabel: gettext('Simply disconnect without resynchronization.')
            }, {
              name: "sb_1pri", inputValue: "consensus", checked: true,
              boxLabel: gettext('Discard secondary if it would have also been discarded without any primaries, else disconnect.')
            }, {
              name: "sb_1pri", inputValue: "violently-as0p",
              boxLabel: gettext('Do what we would do if there were no primaries, even if we risk corrupting data.')
            }, {
              name: "sb_1pri", inputValue: "discard-secondary", checked: true,
              boxLabel: gettext('Discard the secondarys data.')
            }, {
              name: "sb_1pri", inputValue: "call-pri-lost-after-sb", checked: true,
              boxLabel: gettext('If the current secondary has the right data, call the pri-lost-after-sb handler on the primary.')
            } ]
          }, {
            fieldLabel: gettext('Two Primaries'),
            xtype: 'radiogroup',
            columns: 1,
            items: [ {
              name: "sb_2pri", inputValue: "disconnect", checked: true,
              boxLabel: gettext('Simply disconnect without resynchronization.')
            }, {
              name: "sb_2pri", inputValue: "violently-as0p",
              boxLabel: gettext('Do what we would do if there were no primaries, even if we risk corrupting data.')
            }, {
              name: "sb_2pri", inputValue: "call-pri-lost-after-sb", checked: true,
              boxLabel: gettext('If the current secondary has the right data, call the pri-lost-after-sb handler on the primary.')
            } ]
          }]
        } ],
        buttons: [{
          text: config.submitButtonText,
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
          text: gettext('Cancel'),
          icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
          handler: function(self){
            addwin.hide();
          }
        }]
      }]
    }));
    addwin.show();
  },

  initComponent: function(){
    "use strict";
    var drbdDevGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "drbd__device_panel_inst",
      title: gettext('DRBD'),
      viewConfig:{ forceFit: true },
      buttons: [ {
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: gettext('Reload'),
        handler: function(self){
          drbdDevGrid.store.reload();
        }
      }, {
        text: gettext('Add DRBD Device'),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          drbdDevGrid.showEditWindow({
            title: gettext('Add DRBD Device'),
            submitButtonText: gettext('Create DRBD Device')
          });
        }
      }, {
        text: gettext('Edit DRBD Device'),
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = drbdDevGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            drbdDevGrid.showEditWindow({
              title: gettext('Edit DRBD Device'),
              submitButtonText: gettext('Edit DRBD Device')
            }, sel.data);
          }
        }
      }, {
        text: gettext('Delete DRBD Device'),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = drbdDevGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            drbd__DrbdDevice.remove( sel.data.id, function(provider, response){
              drbdDevGrid.store.reload();
            } );
          }
        }
      }],
      store: new Ext.data.DirectStore({
        fields: ['id', 'protocol', 'peeraddress', 'volume', 'cstate', 'role',{
          name: 'volumename',
          mapping: 'volume',
          convert: function(val, row){
            return val.name;
          }
        }, {
          name: 'dstate_self',
          mapping: 'dstate',
          convert: function(val, row){
            return val.self;
          }
        }, {
          name: 'role_self',
          mapping: 'role',
          convert: function(val, row){
            return val.self;
          }
        }],
        directFn: drbd__DrbdDevice.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: gettext('Volume'),
          width: 200,
          dataIndex: "volumename"
        }, {
          header: gettext('Protocol'),
          width:     80,
          dataIndex: "protocol"
        }, {
          header: gettext('Peer Address'),
          width: 200,
          dataIndex: "peeraddress"
        }, {
          header: gettext('Disk state (here)'),
          width: 200,
          dataIndex: "dstate_self"
        }, {
          header: gettext('Connection state'),
          width: 200,
          dataIndex: "cstate"
        }, {
          header: gettext('Role'),
          width: 200,
          dataIndex: "role_self"
        }]
      })
    }));
    Ext.oa.Drbd__Device_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    "use strict";
    Ext.oa.Drbd__Device_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("drbd__device_panel", Ext.oa.Drbd__Device_Panel);

Ext.oa.Drbd__Device_Module = Ext.extend(Object, {
  panel: "drbd__device_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_services", {
      text: gettext('DRBD'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/nfs.png',
      panel: "drbd__device_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Drbd__Device_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
