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

Ext.define('volumes__volumes_BlockVolume_model', {
  extend: 'Ext.data.TreeModel',
  requires: [
    'Ext.data.NodeInterface'
  ],
  fields: [
    'id', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
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
    'id', 'name', 'type', 'megs', 'status', 'usedmegs', 'percent',
    'fswarning', 'fscritical', 'host', 'path', 'poolname', 'ownername'
  ],
  createNode: function(record){
    // See if there is a specific model for this object type, and if so, use it
    var modelname = Ext.String.format('volumes__{0}_{1}_model', record.raw.volume_type.app, record.raw.volume_type.obj);
    if( Ext.ClassManager.get(modelname) !== null ){
      var model = Ext.create(modelname);
      return model.createNode(record);
    }
    // There is none, rely on the object having everything we need
    var rootNode;
    record.set("leaf", true);
    rootNode = this.callParent(arguments);
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
      text : gettext("No config options available!"),
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
    valueField: "id",
    afterLabelTextTpl: required,
    store: (function(){
      Ext.define('lvm_logicalvolume_volumegroup_store', {
        extend: 'Ext.data.Model',
        fields: [
          {name: 'id'},
          {name: 'name'}
        ]
      });
      return Ext.create('Ext.data.Store', {
        model: "lvm_logicalvolume_volumegroup_store",
        proxy: {
          type: 'direct',
          directFn: lvm__VolumeGroup.all
        }
      });
    }()),
    listeners: {
      select: function(self, record, index){
        var filesystem_combo = self.ownerCt.getComponent('volumepool_filesystems_combo');
        filesystem_combo.enable();
        filesystem_combo.getStore().load({
          params: {
            "id": record[0].data.id
          }
        });

        self.ownerCt.getComponent('volume_size_textbox').enable();

        self.ownerCt.volume_free_megs = null;
        var volume_size_label = self.ownerCt.getComponent("volume_size_additional_label");
        volume_size_label.setText(gettext("Querying data..."));
        lvm__VolumeGroup.get_free_megs(record[0].data.id, function(provider, response){
          self.ownerCt.volume_free_megs = response.result;
          volume_size_label.setText(Ext.String.format("Max. {0} MB", response.result));
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

          volumes__VolumePool.create_volume(input_vals.vg, input_vals.name, input_vals.megs,
            owner_dict, input_vals.filesystem, input_vals.fswarning, input_vals.fscritical,
            function(result, response){
            if(response.type !== "exception"){
              self.ownerCt.ownerCt.ownerCt.close();

              var settings_win = Ext.oa.getAdditSettingsWindow(Ext.apply(config, {
                  volume_id:    result.id,
                  volumePanel:  config.volumePanel
              }));
              settings_win.show();
            }
          });
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
    items: add_volume_form,
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
        icon: MEDIA_URL + '/icons2/16x16/actions/reload.png',
        tooltip: gettext('Reload'),
        handler: function(self){
          volumePanel.refresh();
        }
      }, {
        text: gettext("Expand all"),
        handler: function(self){
          volumePanel.store.getRootNode().expand(true);
        }
      }, {
        text: gettext("Collapse all"),
        handler: function(self){
          var i,
              childNodes = store.getRootNode().childNodes;
          for( i = 0; i < childNodes.length; i++ ){
            childNodes[i].collapseChildren(true);
          }
        }
      }, {
        text: gettext("Add Volume"),
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
        handler: function(self){
          var sel = volumePanel.getSelectionModel().getSelection()[0];
          Ext.Msg.prompt(
            gettext("Delete Volume"),
            gettext('What was the name of the volume you wish to delete again?<br /><b>There is no undo and you will lose all data.</b>'),
            function(btn, text){
              if( btn === 'ok' ){
                if( text == sel.data.name ){
                  if( sel.raw.filesystem ){
                    volumes__FileSystemVolume.remove(sel.data.id, function(result, response){
                      if( response.type !== "exception" ){
                        volumePanel.refresh();
                      }
                    });
                  }
                  else{
                    volumes__BlockVolume.remove(sel.data.id, function(result, response){
                      if( response.type !== "exception" ){
                        volumePanel.refresh();
                      }
                    });
                  }
                }
                else{
                  Ext.Msg.alert(gettext("Delete Volume"), gettext("Hm, that doesn't seem right..."));
                }
              }
              else{
                Ext.Msg.alert(gettext("Delete Volume"), gettext("As you wish."));
              }
            }
          );
        }
      },{
        text: gettext("Mirror"),
        listeners: {
          click: function(self, e, eOpts){
            if(self.ownerCt.ownerCt.getSelectionModel().getSelection().length === 1){
              var vol_selection = self.ownerCt.ownerCt.getSelectionModel().getSelection()[0];
              if(vol_selection.$className.indexOf("BlockVolume") != -1){
                var mirror_win = Ext.oa.getMirrorWindow(Ext.apply(config, {
                  volume_id:    vol_selection.data.id,
                  volumePanel:  volumePanel
                }));
                mirror_win.show();
              }
            }
          }
        }
      }],
      forceFit: true,
      store: (function(){
        var treestore = Ext.create("Ext.oa.SwitchingTreeStore", {
          fields: ['name'],
          proxy: { type: "memory" },
          root: {
            name:     'root',
            expanded: true,
            id: "volumes_root_node"
          }
        });
        var blockvolstore = Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumes__volumes_BlockVolume_model',
          proxy: {
            type:     'direct',
            directFn: volumes__BlockVolume.filter,
            extraParams: {
              kwds: {
                upper_id__isnull: true
              }
            },
            paramOrder: ["kwds"]
          },
          root: {
            name: gettext("Block-based"),
            id:   "volumes__volumes_blockvolumes_rootnode",
            type: ' ',
            megs: null,
            percent: null,
            status: null,
          },
          sorters: [{property: "name"}]
        });
        var fsvolstore = Ext.create('Ext.oa.SwitchingTreeStore', {
          model: 'volumes__volumes_FileSystemVolume_model',
          proxy: {
            type:     'direct',
            directFn: volumes__FileSystemVolume.all
          },
          root: {
            name: gettext("File-based"),
            id:   "volumes__volumes_fsvolumes_rootnode",
            type: ' ',
            megs: null,
            percent: null,
            status: null,
          },
          sorters: [{property: "name"}]
        });
        var rootNode = treestore.getRootNode();
        rootNode.appendChild(blockvolstore.getRootNode());
        rootNode.appendChild(fsvolstore.getRootNode());
        return treestore;
      }()),
      defaults: {
        sortable: true
      },
      columns: [{
        xtype: 'treecolumn',
        header: gettext('Name'),
        dataIndex: "name",
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
              cls:   ( val > 85 ? "lv_used_crit" :
                      (val > 70 ? "lv_used_warn" : "lv_used_ok"))
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
        header: gettext('Volume Pool'),
        dataIndex: "poolname",
        stateId: "volumes__volumes_panel_state__poolname",
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
