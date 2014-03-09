/*
 Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>

 openATTIC is free software; you can redistribute it and/or modify it
 under the terms of the GNU General Public License as published by
 the Free Software Foundation; version 2.

 This package is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
*/

Ext.namespace("Ext.oa");

window.StorageObjectHandlers = {
  lvm: {
    VolumeGroup: {
      volumes_filter: "blockvolume__logicalvolume__vg__id",
      extra_params: {
        blockvolume__logicalvolume__snapshot__isnull: true
      }
    },
    LogicalVolume: {
      snapshots_filter: "blockvolume__logicalvolume__snapshot__id"
    }
  },
  zfs: {
    Zpool: {
      volumes_filter: "filesystemvolume__zfs__zpool__id",
      extra_params: {
        volumepool__isnull: true
      }
    }
  },
  btrfs: {
    Btrfs: {
      volumes_filter: "filesystemvolume__btrfssubvolume__btrfs__id",
      extra_params: {
        volumepool__isnull: true
      }
    }
  }
}



Ext.define('volumes__volumes_StorageObject_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    var rootNode,
        kwds = {};
    if( record.raw.volumepool !== null ){
      var vptype = record.raw.volumepool.volumepool_type;
      Ext.apply(kwds, window.StorageObjectHandlers[vptype.app][vptype.obj].extra_params || {});
      kwds[ window.StorageObjectHandlers[vptype.app][vptype.obj].volumes_filter ] = record.raw.volumepool.id;
      var store = Ext.create("Ext.oa.SwitchingTreeStore", {
        model: 'volumes__volumes_StorageObject_model',
        root: record.raw,
        sorters: [{
          property: "__unicode__",
          root: "data"
        }],
        proxy: {
          type: "direct",
          directFn: volumes__StorageObject.filter,
          extraParams: {
            kwds: kwds
          },
          paramOrder: ["kwds"]
        }
      });
      rootNode = store.getRootNode();
      rootNode.set("type", toUnicode(vptype));
      rootNode.set("host", toUnicode(record.raw.volumepool.host));
      if( record.raw.volumepool.usedmegs !== null )
        rootNode.set("percent", (record.raw.volumepool.usedmegs / record.raw.megs * 100).toFixed(2));
    }
    else if( record.raw.blockvolume !== null ){
      var voltype = record.raw.blockvolume.volume_type;
      if( !record.raw.blockvolume.snapshot &&
          typeof window.StorageObjectHandlers[voltype.app] !== "undefined" &&
          typeof window.StorageObjectHandlers[voltype.app][voltype.obj] !== "undefined" &&
          typeof window.StorageObjectHandlers[voltype.app][voltype.obj].snapshots_filter !== "undefined" ){
        // May or may not haz Snapshots
        kwds[ window.StorageObjectHandlers[voltype.app][voltype.obj].snapshots_filter ] = record.raw.blockvolume.id;
        var store = Ext.create("Ext.oa.SwitchingTreeStore", {
          model: 'volumes__volumes_StorageObject_model',
          root: record.raw,
          sorters: [{
            property: "__unicode__",
            root: "data"
          }],
          proxy: {
            type: "direct",
            directFn: volumes__StorageObject.filter,
            extraParams: {
              kwds: kwds
            },
            paramOrder: ["kwds"]
          }
        });
        rootNode = store.getRootNode();
      }
      else{
        record.set("leaf", true);
        rootNode = this.callParent(arguments);
      }
      rootNode.set("type", toUnicode(voltype));
      rootNode.set("path", record.raw.blockvolume.path);
      rootNode.set("host", toUnicode(record.raw.blockvolume.host));
      rootNode.set("percent",  null);
    }
    else{
      record.set("leaf", true);
      rootNode = this.callParent(arguments);
    }
    if( record.raw.filesystemvolume !== null ){
      var voltype = record.raw.filesystemvolume.volume_type;
      rootNode.set("path",       record.raw.filesystemvolume.path);
      rootNode.set("host",       toUnicode(record.raw.filesystemvolume.host));
      rootNode.set("fswarning",  record.raw.filesystemvolume.fswarning);
      rootNode.set("fscritical", record.raw.filesystemvolume.fscritical);
      rootNode.set("ownername",  toUnicode(record.raw.filesystemvolume.owner));
      rootNode.set("type",       toUnicode(voltype));
      if( record.raw.filesystemvolume.usedmegs !== null )
        rootNode.set("percent",    (record.raw.filesystemvolume.usedmegs / record.raw.megs * 100).toFixed(2));
      if( record.raw.filesystemvolume.fstype )
        rootNode.set("type", record.raw.filesystemvolume.fstype);
    }
    rootNode.set("icon",     MEDIA_URL + '/icons2/16x16/apps/database.png');
    return rootNode;
  }
});


Ext.define('volumes__volumes_BlockVolume_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    record.set("id", [record.raw.id, "BlockVolume"].join('__'));
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
    if( rootNode.get("type") === "" ){
      rootNode.set("type",   toUnicode(record.raw.volume_type));
    }
    rootNode.set("icon",     MEDIA_URL + '/icons2/16x16/apps/database.png');
    rootNode.set("host",     toUnicode(record.raw.host));
    rootNode.set("poolname", toUnicode(record.raw.pool));
    rootNode.set("percent",  null);
    return rootNode;
  }
});

Ext.define('volumes__volumes_FileSystemVolume_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', '__unicode__', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    record.set("id", [record.raw.id, "FileSystemVolume"].join('__'));
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
    if( rootNode.get("type") === "" ){
      rootNode.set("type",       toUnicode(record.raw.volume_type));
    }
    rootNode.set("host",         toUnicode(record.raw.host));
    rootNode.set("poolname",     toUnicode(record.raw.pool));
    rootNode.set("ownername",    toUnicode(record.raw.owner));
    rootNode.set("icon",         MEDIA_URL + '/icons2/16x16/apps/database.png');
    if( record.data.usedmegs !== null )
      rootNode.set("percent",    (record.data.usedmegs / record.data.megs * 100).toFixed(2));
    else
      rootNode.set("percent",    null);
    return rootNode;
  }
});

Ext.oa.getMirrorWindow = function(config){
  var mirror_form = Ext.oa.getMirrorForm(config);
  var mirror_win = Ext.create("Ext.Window", Ext.apply(config, {
    title: gettext("Mirror"),
    layout: "fit",
    height: 260,
    width: 500,
    items: mirror_form
  }));

  mirror_form.on("click_ok", function(self, e, eOpts){
    mirror_win.close();
    mirror_win.volumePanel.refresh();
  });
  mirror_form.on("click_cancel", function(self, e, eOpts){
    mirror_win.close();
  });

  return mirror_win;
}

Ext.oa.getAdditSettingsWindow = function(config){
  var cards = [];
  var buttons = [];

  var emptySettingForm = Ext.create("Ext.form.FormPanel", {
    itemId: "empty",
    border: false,
    layout: "fit",
    items : [{
      xtype: "label",
      text : gettext("No config options available!")
    }]
  });
  cards.push(emptySettingForm);

  for(var i=0; i < window.AddVolumeSettings.length; i++){
    var button = Ext.create("Ext.button.Button", {
      text: window.AddVolumeSettings[i].title,
      itemNumber: i + 1,
      listeners: {
        click: function(self, e, eOpts){
          cards_panel.layout.setActiveItem(self.itemNumber);
        }
      }
    });

    var form = window.AddVolumeSettings[i].getForm();
    form.itemNumber = i + 1; // emptySettingForm is number 0
    form.on("click_ok", function(self, e, eOpts){
      buttons[self.ownerCt.ownerCt.itemNumber - 1].setIcon(MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png");
      cards_panel.layout.setActiveItem(0);
    })
    form.on("click_cancel", function(self, e, eOpts){
      cards_panel.layout.setActiveItem(0);
    });

    cards.push(form);
    buttons.push(button);
  }

  var cards_panel = Ext.create("Ext.panel.Panel", {
    layout: "card",
    bodyStyle: "padding: 5px 5px;",
    items: cards,
    activeItem: 0,
    width: "70%",
    height: "100%",
    border: false
  });

  return Ext.create("Ext.Window", {
    title: gettext("Additional Settings"),
    layout: "hbox",
    height: 400,
    width: 800,
    border: false,
    close: function(){
      this[this.closeAction].call(this);
      config.volumePanel.refresh();
    },
    items: [{
      region: "west",
      height: "100%",
      width: "30%",
      layout: {
        type: "vbox",
        align: "stretch",
        padding: '5'
      },
      items: buttons,
      border: false
    },
      cards_panel
    ],
    buttons: [{
      text: gettext("Close"),
      icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
      listeners: {
        click: function(self, e, eOpts){
          self.ownerCt.ownerCt.close();
        }
      }
    }]
  });
};

var required = '<span style="color:red;font-weight:bold" data-qtip="Required">*</span>';
Ext.define("Ext.oa.volumes__volumes_add_volume_form", {
  extend: "Ext.form.Panel",
  border: false,
  bodyStyle: 'padding: 5px 5px;',
  api: {
    load:   volumes__BlockVolume.get_ext,
    submit: volumes__BlockVolume.set_ext
  },
  paramOrder: ["id"],
  defaults: {
    xtype: "textfield",
    anchor: '-20px',
    defaults : {
      anchor: "0px"
    }
  },
  items: [{
    fieldLabel: gettext("Name"),
    name: "name",
    allowBlank: false,
    afterLabelTextTpl: required
  }, tipify({
    xtype:      'combo',
    allowBlank: false,
    fieldLabel: gettext('Volume Group'),
    name: 'vg',
    typeAhead:     true,
    triggerAction: 'all',
    deferEmptyText: false,
    emptyText:     gettext('Select...'),
    selectOnFocus: true,
    displayField: "name",
    valueField: "volumepool_id",
    afterLabelTextTpl: required,
    store: (function(){
      Ext.define('lvm_logicalvolume_volumegroup_store', {
        extend: 'Ext.data.Model',
        fields: [
          {name: 'id'},
          {name: 'name'},
          {name: 'volumepool_id', mapping: 'volumepool', convert: function(val){
            return val.volumepool.id;
          } }
        ]
      });
      return Ext.create('Ext.data.Store', {
        model: "lvm_logicalvolume_volumegroup_store",
        proxy: {
          type: 'direct',
          directFn: volumes__StorageObject.filter,
          extraParams: {
            kwds: {volumepool__isnull: false}
          },
          paramOrder: ["kwds"]
        }
      });
    }()),
    listeners: {
      select: function(self, record, index){
        var filesystem_combo = self.ownerCt.getComponent('volumepool_filesystems_combo');
        filesystem_combo.enable();
        filesystem_combo.clearValue();
        filesystem_combo.getStore().load({
          params: {
            "id": record[0].raw.volumepool.id
          }
        });

        self.ownerCt.getComponent('volume_size_textbox').enable();

        self.ownerCt.volume_free_megs = null;
        var volume_size_label = self.ownerCt.getComponent("volume_size_additional_label");
        volume_size_label.setText(gettext("Querying data..."));
        volumes__StorageObject.get(record[0].data.id, function(result, response){
          self.ownerCt.volume_free_megs = result.megs - result.volumepool.usedmegs;
          volume_size_label.setText(Ext.String.format("Max. {0} MB", self.ownerCt.volume_free_megs));
        });
      }
    }
  },gettext('The volume group in which you want the Volume to be created.')),
  tipify({
    xtype:      'combo',
    disabled:   true,
    forceSelection: true,
    fieldLabel: gettext('File System'),
    typeAhead:     true,
    deferEmptyText: false,
    emptyText:     gettext('Select...'),
    displayField:  'name',
    valueField:    'name',
    itemId:        'volumepool_filesystems_combo',
    queryMode:     "local",
    name: "filesystem",
    store: (function(){
      Ext.define('volumes__volumepool_filesystem_store', {
        extend: 'Ext.data.Model',
        fields: [
          {name: 'name'}
      //     //{name: 'desc'},
      //     //{name: 'supports_dedup'},
      //     //{name: 'supports_compression'}
        ]
      });
      return Ext.create('Ext.data.Store', {
        autoLoad: false,
        model: "volumes__volumepool_filesystem_store",
        proxy: {
          type: 'direct',
          directFn: volumes__VolumePool.get_supported_filesystems,
          startParam: undefined,
          limitParam: undefined,
          pageParam:  undefined,
          paramOrder: ["id"]
        }
      });
    }()),
    listeners: {
      select: function(self, record, index){
        // Enable dedup and compression field
      }
    }
  }, gettext("If you want to use DRBD with this device, do not yet create a file system on it, even if you want to share it using NAS services later on.")),
  {
    fieldLabel: gettext("Size in MB"),
    allowBlank: false,
    name: "megs",
    afterLabelTextTpl: required,
    disabled: true,
    validator: function(value){
      if(value <= this.ownerCt.volume_free_megs){
        return true;
      }
      else {
        return gettext("Error! Needs to be less or equal maxvalue!");
      }
    },
    itemId: "volume_size_textbox"
  }, {
    xtype: "label",
    text:  gettext('Waiting for volume group selection...'),
    cls:   "form_hint_label",
    itemId: "volume_size_additional_label"
  }, {
    fieldLabel: gettext('Deduplication'),
    name: "dedup",
    xtype: "checkbox",
    itemId: "volume_deduplication_checkbox",
    disabled: true
  }, {
    fieldLabel: gettext('Compression'),
    name: "compression",
    xtype: "checkbox",
    itemId: "volume_compression_checkbox",
    disabled: true
  },{
    fieldLabel: gettext('Warning Level (%)'),
    allowBlank: false,
    name: "fswarning",
    value: 75,
    xtype: "numberfield",
    afterLabelTextTpl: required
  }, {
    fieldLabel: gettext('Critical Level (%)'),
    allowBlank: false,
    name: "fscritical",
    value: 85,
    xtype: "numberfield",
    afterLabelTextTpl: required
  }, {
    xtype: "auth__userfield",
    allowBlank: false,
    name: "owner",
    afterLabelTextTpl: required
  }],
  buttons: [{
    text: gettext("Create Volume"),
    icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
    listeners: {
      click: function(self, e, eOpts){
        var form = self.ownerCt.ownerCt.getForm();
        if(form.isValid()){
          var input_vals = form.getValues();
          var owner_dict = {"app": "auth", "obj": "user", "id": input_vals.owner};

          self.ownerCt.ownerCt.getEl().mask(gettext("Loading..."));

          volumes__VolumePool.create_volume(input_vals.vg, input_vals.name, input_vals.megs,
            {
              owner:      owner_dict,
              filesystem: input_vals.filesystem,
              fswarning:  input_vals.fswarning,
              fscritical: input_vals.fscritical
            }, function(result, response){
              if(response.type !== "exception"){
                self.ownerCt.ownerCt.ownerCt.close();

                if(window.AddVolumeSettings.length > 0){
                  var settings_win = Ext.oa.getAdditSettingsWindow(Ext.apply(config, {
                      volume_id:    result.id,
                      volume_megs:  result.megs,
                      volumePanel:  config.volumePanel
                  }));
                  settings_win.show();
                }
                else{
                  config.volumePanel.refresh();
                }
              }
              else{
                self.ownerCt.ownerCt.getEl().unmask();
              }
            }
          );
        }
      }
    }
  },{
    text: gettext("Cancel"),
    icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
    listeners: {
      click: function(self, e, eOpts){
        self.ownerCt.ownerCt.ownerCt.close();
      }
    }
  }]
});
Ext.oa.getAddVolumeWindow = function(config){
  var add_volume_form = Ext.create("Ext.oa.volumes__volumes_add_volume_form");
  return Ext.create("Ext.Window", {
    title: gettext("Add Volume"),
    width:  500,
    layout: "fit",
    items: add_volume_form
  });
};

Ext.define('Ext.oa.volumes__Volume_Panel', {
  extend: 'Ext.tree.TreePanel',
  alias: 'widget.volumes__volumes_panel',
  initComponent: function(){
    var volumePanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumes__volumes_panel_inst",
      stateId: "volumes__volumes_panel_state",
      stateful: true,
      title: gettext('Volume Management'),
      border: false,
      rootVisible: false,
      buttons: [{
        text: "",
        minWidth: 16,
        icon: MEDIA_URL + '/icons2/16x16/actions/reload.png',
        tooltip: gettext('Reload'),
        handler: function(self){
          volumePanel.refresh();
        }
      }, {
        text: gettext("Expand all"),
        icon: MEDIA_URL + "/extjs/resources/ext-theme-classic/images/tree/elbow-end-plus.gif",
        handler: function(self){
          volumePanel.store.getRootNode().expand(true);
        }
      }, {
        text: gettext("Collapse all"),
        icon: MEDIA_URL + "/extjs/resources/ext-theme-classic/images/tree/elbow-end-minus.gif",
        handler: function(self){
            volumePanel.store.getRootNode().collapseChildren(true);
        }
      }, {
        text: gettext("Mount"),
        icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-mounted.png",
        handler: function(self){
          var sel = volumePanel.getSelectionModel().getSelection()[0];
          if( !sel.raw.filesystemvolume ){
            Ext.Msg.alert(
              gettext("Mount"),
              interpolate(gettext("Volume %s does not have a filesystem."), [sel.data.__unicode__])
            );
            return;
          }
          volumes__FileSystemVolume.mount(sel.raw.filesystemvolume.id, function(result, response){
            volumePanel.refresh();
          });
        }
      }, {
        text: gettext("Unmount"),
        icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-unmounted.png",
        handler: function(self){
          var sel = volumePanel.getSelectionModel().getSelection()[0];
          if( !sel.raw.filesystemvolume ){
            Ext.Msg.alert(
              gettext("Unmount"),
              interpolate(gettext("Volume %s does not have a filesystem."), [sel.data.__unicode__])
            );
            return;
          }
          Ext.Msg.confirm(
            gettext("Unmount"),
            interpolate(gettext("You are about to unmount volume %s. Are you sure?"), [sel.data.__unicode__]),
            function(btn, text){
              if( btn === 'yes' ){
                volumes__FileSystemVolume.unmount(sel.raw.filesystemvolume.id, function(result, response){
                  volumePanel.refresh();
                });
              }
            }
          );
        }
      }, {
        text: gettext("Mirror"),
        icon: MEDIA_URL + "/oxygen/16x16/actions/distribute-horizontal-center.png",
        listeners: {
          click: function(self, e, eOpts){
            if( typeof Ext.oa.getMirrorForm !== "function" ){
              Ext.Msg.alert(gettext("Missing DRBD module"),
                gettext("Please install the openATTIC DRBD module for this feature to work.")
              );
              return;
            }
            if(self.ownerCt.ownerCt.getSelectionModel().getSelection().length === 1){
              var vol_selection = self.ownerCt.ownerCt.getSelectionModel().getSelection()[0];
              if(vol_selection.raw.blockvolume){
                var mirror_win = Ext.oa.getMirrorWindow(Ext.apply(config, {
                  volume_id:    vol_selection.raw.blockvolume.id,
                  volume_megs:  vol_selection.raw.megs,
                  volumePanel:  volumePanel
                }));
                mirror_win.show();
              }
            }
          }
        }
      }, {
        text: gettext("Create Snapshot"),
        icon: MEDIA_URL + "/oxygen/16x16/devices/camera-photo.png",
        listeners: {
          click: function(self, e, eOpts){
            var sel = volumePanel.getSelectionModel().getSelection()[0];
            var win = new Ext.Window(Ext.apply({
              layout: "fit",
              title: gettext('Create Snapshot'),
              defaults: { autoScroll: true },
              height: 200,
              width: 500,
              items: [{
                xtype: "form",
                bodyStyle: 'padding:5px ;',
                defaults: {
                  xtype: "textfield",
                  anchor: '-20',
                  defaults: {
                    anchor: "0px"
                  }
                },
                items: [{
                  xtype: 'textfield',
                  name:  "name",
                  fieldLabel: gettext('Name'),
                  value: sel.raw.name + '_' + Ext.Date.format(new Date(), "Y-m-d-H-i-s")
                }, {
                  xtype: 'numberfield',
                  fieldLabel: gettext('MB'),
                  allowBlank: false,
                  name: "megs",
                  minValue: 100,
                  maxValue: sel.raw.megs,
                  enableKeyEvents: true,
                  value: sel.raw.megs
                }],
                buttons: [{
                  text:  gettext('Create Snapshot'),
                  icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
                  handler: function(btn){
                    var frm = btn.ownerCt.ownerCt;
                    if( !frm.getForm().isValid() ){
                      return;
                    }
                    var values = frm.getValues();
                    frm.getEl().mask();
                    volumes__StorageObject.create_snapshot(sel.raw.id, values["name"], values["megs"], {}, function(result, response){
                      if( response.type === "exception" ){
                        frm.getEl().unmask();
                      }
                      else{
                        win.close();
                        sel.parentNode.store.load();
                      }
                    });
                  }
                },{
                  text: gettext('Cancel'),
                  icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                  handler: function(){
                    win.close();
                  }
                }]
              }]
            }));
            win.show();
          }
        }
      }, {
        text: gettext('Resize Volume'),
        icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
        handler: function(){
          "use strict";
          var sm = volumePanel.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selected.items[0];
              var freemegs = sel.parentNode.raw.megs - sel.parentNode.raw.volumepool.usedmegs + sel.raw.megs;
              var resizewin = new Ext.Window(Ext.apply({
                layout: "fit",
                title: gettext('Resize Volume'),
                defaults: { autoScroll: true },
                height: 200,
                width: 500,
                items: [{
                  xtype: "form",
                  ref: "resize",
                  id: "resize",
                  title: gettext('Please enter your desired size'),
                  bodyStyle: 'padding:5px ;',
                  defaults: {
                    xtype: "textfield",
                    anchor: '-20',
                    defaults: {
                      anchor: "0px"
                    }
                  },
                  items: [{
                    xtype: 'slider',
                    id: 'slider',
                    increment: 100,
                    layout: 'form',
                    width: 220,
                    value: sel.data.megs,
                    minValue: 100,
                    maxValue: freemegs,
                    listeners: {
                      change: function(sld) {
                        if( typeof sld.ownerCt.getComponent("megabyte") !== "undefined" )
                          sld.ownerCt.getComponent("megabyte").setValue(sld.getValue());
                        if( typeof sld.ownerCt.getComponent("remaining_megabyte") !== "undefined" )
                          sld.ownerCt.getComponent("remaining_megabyte").setValue(freemegs - sld.getValue());
                      }
                    }
                  }, {
                    xtype: 'numberfield',
                    fieldLabel: gettext('Megabyte'),
                    id: 'megabyte',
                    allowBlank: false,
                    minValue: 100,
                    maxValue: freemegs,
                    enableKeyEvents: true,
                    value: sel.data.megs,
                    listeners: {
                      change: function change(event) {
                        if(this.ownerCt.getComponent("megabyte").getValue() > freemegs){
                          this.ownerCt.getComponent("megabyte").setValue(freemegs);
                        }
                        this.ownerCt.getComponent("slider").setValue(this.ownerCt.getComponent("megabyte").getValue(), false);
                        this.ownerCt.getComponent("remaining_megabyte").setValue(freemegs - this.ownerCt.getComponent("megabyte").getValue());
                      },
                      specialkey: function(f,e){
                        if(e.getKey() === e.ENTER){
                          if(this.ownerCt.getComponent("megabyte").getValue() > freemegs){
                            this.ownerCt.getComponent("megabyte").setValue(freemegs);
                          }
                          this.ownerCt.getComponent("slider").setValue(this.ownerCt.getComponent("megabyte").getValue(), false);
                          this.ownerCt.getComponent("remaining_megabyte").setValue(freemegs - this.ownerCt.getComponent("megabyte").getValue());
                        }
                      }
                    }
                  },{
                    xtype: 'textfield',
                    readOnly: true,
                    id: 'remaining_megabyte',
                    fieldLabel: gettext('Remaining Space'),
                    value: freemegs,
                    disabled: true
                  }],
                  buttons: [{
                    text:  gettext('Edit'),
                    icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
                    handler: function(editbtn){
                      var frm = editbtn.ownerCt.ownerCt;
                      if( !frm.getForm().isValid() ){
                        return;
                      }
                      Ext.Msg.confirm(
                        gettext('Warning'),
                        interpolate(
                          gettext('Do you really want to change Volume size of <b>%(lv)s</b> to <b>%(megs)s</b> MB?'),
                          { "lv": sel.data.name, "megs": frm.getComponent("megabyte").getValue() }, true ),
                        function(btn){
                          if( btn === 'yes' ){
                            var progresswin = new Ext.Window({
                              title: gettext('Resizing Volume'),
                              layout: "fit",
                              height: 250,
                              width: 400,
                              modal: true,
                              html: gettext('Please wait while your volume is being resized...')
                            });
                            resizewin.hide();
                            progresswin.show();
                            volumes__StorageObject.resize( sel.raw.id,
                              parseFloat(frm.getComponent("megabyte").getValue()), function(provider, response){
                              sel.parentNode.store.load();
                              progresswin.close();
                              resizewin.close();
                            } );
                          }
                        }
                      );
                    }
                  },{
                    text: gettext('Cancel'),
                    icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                    handler: function(){
                      resizewin.close();
                    }
                  }]
                }]
              }));
              resizewin.show();
          }
        }
      }, {
        text: gettext("Add Volume"),
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        listeners: {
          click: function(self, e, eOpts){
            var addwin = Ext.oa.getAddVolumeWindow(Ext.apply(config, {
              volumePanel: volumePanel
            }));
            addwin.show();
          }
        }
      }, {
        text: gettext("Delete Volume"),
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sel = volumePanel.getSelectionModel().getSelection()[0];
          Ext.Msg.confirm(
            gettext("Delete Volume"),
            interpolate(gettext("You are about to permanently delete the following volume:<br /><strong>%s</strong><br />Are you sure? There is no undo and you will lose all data on that volume."), [sel.data.__unicode__]),
            function(btn, text){
              if( btn === 'yes' ){
                volumes__StorageObject.remove(sel.raw.id, function(result, response){
                  volumePanel.refresh();
                });
              }
              else{
                Ext.Msg.alert(gettext("Delete Volume"), gettext("As you wish."));
              }
            }
          );
        }
      }],
      forceFit: true,
      store: (function(){
        var treestore = Ext.create("Ext.oa.SwitchingTreeStore", {
          model: 'volumes__volumes_StorageObject_model',
          proxy: {
            type:     'direct',
            directFn: volumes__StorageObject.filter,
            extraParams: {
              kwds: {
                volumepool__isnull: false,
                is_origin: true
              }
            },
            paramOrder: ["kwds"]
          },
          root: {
            __unicode__: gettext("Volume Pools"),
            id:   "volumes__volumes_blockvolumes_rootnode",
            type: ' ',
            megs: null,
            percent: null,
            status: null
          },
          sorters: [{property: "name"}]
        });
        return treestore;
      }()),
      defaults: {
        sortable: true
      },
      columns: [{
        xtype: 'treecolumn',
        header: gettext('Name'),
        dataIndex: "__unicode__",
        stateId: "volumes__volumes_panel_state__name",
        flex: 3
      },{
        header: gettext('Type'),
        dataIndex: "type",
        stateId: "volumes__volumes_panel_state__type",
        flex: 1
      },{
        header: gettext('Size'),
        dataIndex: "megs",
        stateId: "volumes__volumes_panel_state__megs",
        align: "right",
        renderer: function(val){
          if( val === null ){
            return '';
          }
          if( val >= 1000 ){
            return Ext.String.format("{0} GB", (val / 1000).toFixed(2));
          }
          else{
            return Ext.String.format("{0} MB", val);
          }
        },
        flex: 1
      },{
        header: gettext('Used%'),
        dataIndex: "percent",
        stateId: "volumes__volumes_panel_state__percent",
        renderer: function( val, x, store ){
          if( val === null ){
            return '';
          }
          var id = Ext.id();
          Ext.defer(function(){
            if( Ext.get(id) === null ){
              return;
            }
            new Ext.ProgressBar({
              renderTo: id,
              value: val/100.0,
              text:  Ext.String.format("{0}%", val),
              cls:   ( store.data.fswarning && store.data.fscritical ?
                       ( val > store.data.fscritical ? "lv_used_crit" :
                        (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok")) :
                      '' )
            });
          }, 25);
          return Ext.String.format('<span id="{0}"></span>', id);
        },
        flex: 2
      },{
        header: gettext('Status'),
        dataIndex: "status",
        stateId: "volumes__volumes_panel_state__status",
        renderer: function( val, x, store ){
          if( val === null || typeof val === 'undefined'){
            return '';
          }
          if( !val.contains(":") ){
            return val;
          }
          var id = Ext.id();
          var desc = Ext.String.capitalize(val.split(":")[0].toLowerCase());
          var perc = parseInt(val.split(":")[1]);
          Ext.defer(function(){
            if( Ext.get(id) === null ){
              return;
            }
            new Ext.ProgressBar({
              renderTo: id,
              value: perc/100.0,
              text:  Ext.String.format("{0} ({1}%)", desc, perc)
            });
          }, 25);
          return Ext.String.format('<span id="{0}"></span>', id);
        },
        flex: 1
      },{
        header: gettext('Warning Level'),
        dataIndex: "fswarning",
        stateId: "volumes__volumes_panel_state__fswarning",
        flex: 1
      },{
        header: gettext('Critical Level'),
        dataIndex: "fscritical",
        stateId: "volumes__volumes_panel_state__fscritical",
        flex: 1
      },{
        header: gettext('Path'),
        dataIndex: "path",
        stateId: "volumes__volumes_panel_state__path",
        flex: 1
      },{
        header: gettext('Host'),
        dataIndex: "host",
        stateId: "volumes__volumes_panel_state__host",
        flex: 1
      },{
        header: gettext('Owner'),
        dataIndex: "ownername",
        stateId: "volumes__volumes_panel_state__ownername",
        flex: 1
      }]
    }));
    this.callParent(arguments);
  },
  onRender: function(){
    this.callParent(arguments);
    var i, nodes = this.getRootNode().childNodes;
    for(var i = 0; i < nodes.length; i++){
      nodes[i].expand();
    }
  },
  refresh: function(){
    var i, nodes = this.getRootNode().childNodes;
    for(var i = 0; i < nodes.length; i++){
      nodes[i].store.load();
    }
  }
});


Ext.oa.volumeGroup_Module = {
  panel: "volumes__volumes_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/volume.png',
      panel: "volumes__volumes_panel_inst"
    });
  }
};


window.MainViewModules.push( Ext.oa.volumeGroup_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
