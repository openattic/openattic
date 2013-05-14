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
  LVName:     function(v){
    "use strict";
    return (/^[A-Za-z0-9_\-]+$/).test(v);
  },
  LVNameText: "Must only contain alphanumeric characters or _ and -.",
  LVNameMask: /[A-Za-z0-9_\-]/
});


Ext.oa.Lvm__LogicalVolume_Panel = Ext.extend(Ext.oa.ShareGridPanel, {
  api: lvm__LogicalVolume,
  id: "lvm__logicalvolume_panel_inst",
  title: gettext("Logical Volumes"),
  filterParams: {
    "snapshot__isnull": true
  },
  filterSearchParam: "name__icontains",
  texts: {
    add:     gettext('Add Volume'),
    edit:    gettext('Edit Volume'),
    remove:  gettext('Delete Volume')
  },
  window: {
    height: 350,
    width:  550
  },
  allowEdit: false,
  store: {
    fields: [ "fswarning", "fscritical", {
      name: 'fsfree',
      mapping: 'fs',
      sortType: 'asFloat',
      convert: function( val, row ){
        "use strict";
        if( val === null || typeof val.stat === "undefined" ){
          return -1; // fake to sort unknown values always at the bottom
        }
        return val.stat.freeG.toFixed(2);
      }
    }, {
      name: 'fsused',
      mapping: 'fs',
      sortType: 'asFloat',
      convert: function( val, row ){
        "use strict";
        if( val === null || typeof val.stat === "undefined" ){
          return -1;
        }
        return val.stat.usedG.toFixed(2);
      }
    }, {
      name: 'fspercent',
      mapping: 'fs',
      sortType: 'asFloat',
      convert: function( val, row ){
        "use strict";
        if( val === null || typeof val.stat === "undefined" ){
          return -1;
        }
        return (val.stat.used / val.stat.size * 100 ).toFixed(2);
      }
    }, {
      name: 'fshost',
      mapping: 'fs',
      convert: function( val, row ){
        "use strict";
        if( val === null ){
          return '';
        }
        return val.host;
      }
    }, {
      name: 'fsmountpoint',
      mapping: 'fs',
      convert: function( val, row ){
        "use strict";
        if( val === null ){
          return '';
        }
        return val.mountpoint;
      }
    },{
      name: 'vgname',
      mapping: 'vg',
      convert: toUnicode
    },{
      name: 'ownername',
      mapping: 'owner',
      convert: toUnicode
    }]
  },
  columns: [{
    header: gettext('LV'),
    dataIndex: "name"
  }, {
    header: gettext('Size'),
    dataIndex: "megs",
    align: 'right',
    renderer: function( val, x, store ){
      "use strict";
      if( val >= 1000 ){
        return String.format("{0} GB", (val / 1000).toFixed(2));
      }
      return String.format("{0} MB", val);
    }
  }, {
    header: gettext('FS'),
    dataIndex: "filesystem",
    renderer: function( val, x, store ){
      "use strict";
      if( val ){
        return val;
      }
      return "&ndash;";
    }
  }, {
    header: gettext('Free'),
    dataIndex: "fsfree",
    align: 'right',
    renderer: function( val, x, store ){
      "use strict";
      if( !val || val === -1 ){
        return '';
      }
      return String.format("{0} GB", val);
    }
  }, {
    header: gettext('Used'),
    dataIndex: "fsused",
    align: 'right',
    renderer: function( val, x, store ){
      "use strict";
      if( !val || val === -1 ){
        return '';
      }
      return String.format("{0} GB", val);
    }
  }, {
    header: gettext('Used%'),
    dataIndex: "fspercent",
    align: 'right',
    renderer: function( val, x, store ){
      "use strict";
      if( !val || val === -1 ){
        return '';
      }
      var id = Ext.id();
      (function(){
        if( Ext.get(id) === null ){
          return;
        }
        new Ext.ProgressBar({
          renderTo: id,
          value: val/100.0,
          text:  String.format("{0}%", val),
          cls:   ( val > store.data.fscritical ? "lv_used_crit" :
                  (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok"))
        });
      }).defer(25);
      return '<span id="' + id + '"></span>';
    }
  },{
    header: gettext('Owner'),
    dataIndex: "ownername"
  },{
    header: gettext('Mounted at host'),
    dataIndex: "fshost"
  },{
    header: gettext('Mount Point'),
    dataIndex: "fsmountpoint"
  },{
    header: gettext('Group'),
    dataIndex: "vgname",
    align: 'center'
  }],
  buttons: [{
    text: gettext('Set warning threshold'),
    icon: MEDIA_URL + "/icons2/16x16/status/dialog-warning.png",
    handler: function(){
      "use strict";
      var self = this;
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        var addwin = new Ext.Window({
          title: gettext('Update Levels'),
          layout: "fit",
          height: 180,
          width: 500,
          items: [{
            xtype: "form",
            border: false,
            bodyStyle: 'padding:5px 5px;',
            defaults: {
              xtype: "textfield",
              anchor: '-20px'
            },
            items: [ {
                fieldLabel: gettext('Warning Level (%)'),
                allowBlank: false,
                name: "fswarning",
                ref: 'warnfield',
                value: sel.data.fswarning,
                xtype: "numberfield"
              }, {
                fieldLabel: gettext('Critical Level (%)'),
                allowBlank: false,
                name: "fscritical",
                ref: 'critfield',
                value: sel.data.fscritical,
                xtype: "numberfield"
              } ],
            buttons: [{
              text: gettext('Update Levels'),
              icon: MEDIA_URL + "/icons2/16x16/actions/gtk-save.png",
              handler: function(btn){
                if( !btn.ownerCt.ownerCt.getForm().isValid() ){
                  return;
                }
                lvm__LogicalVolume.set(sel.data.id, {
                  'fswarning':  btn.ownerCt.ownerCt.warnfield.getValue(),
                  'fscritical': btn.ownerCt.ownerCt.critfield.getValue()
                }, function(provider, response){
                  if( response.result ){
                    self.store.reload();
                    addwin.hide();
                  }
                });
              }
            }, {
              text: gettext('Cancel'),
              icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
              handler: function(){
                addwin.hide();
              }
            }]
          }]
        });
        addwin.show();
      }
    }
  }, {
    text: gettext('Mount'),
    icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-mounted.png",
    handler: function(){
      "use strict";
      var self = this;
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        if( !sel.data.filesystem ){
          Ext.Msg.alert('Mounted',
            interpolate(
              gettext('Volume %s does not have a file system and therefore cannot be mounted.'),
              [sel.data.name] ));
          return;
        }
        lvm__LogicalVolume.is_mounted( sel.data.id, function(provider, response){
          if( response.result ){
            Ext.Msg.alert('Mounted', interpolate( gettext('Volume %s is already mounted.'), [sel.data.name] ));
            return;
          }
          lvm__LogicalVolume.is_in_standby( sel.data.id, function(provider, response){
            if( response.result ){
              Ext.Msg.alert('Mounted',
                interpolate( gettext('Volume %s cannot be mounted at the current time.'), [sel.data.name] ));
              return;
            }
            lvm__LogicalVolume.mount( sel.data.id, function(provider, response){
              if( response.type === "exception" ){
                Ext.Msg.alert('Mounted', interpolate(
                  gettext('Volume %s could not be mounted, please check the logs.'), [sel.data.name] ));
              }
              else{
                Ext.Msg.alert('Mounted', interpolate(
                  gettext('Volume %s has been mounted.'), [sel.data.name] ));
                self.store.reload();
              }
            } );
          } );
        } );
      }
    }
  }, {
    text: gettext('Unmount'),
    icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-unmounted.png",
    handler: function(){
      "use strict";
      var self = this;
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        lvm__LogicalVolume.is_mounted( sel.data.id, function(provider, response){
          if( !response.result ){
            Ext.Msg.alert('Unmount', interpolate( gettext('Volume %s is not mounted.'),
                                                      [sel.data.name] ));
          }
          else{
            Ext.Msg.confirm(
              gettext('Unmount'),
              interpolate(
                gettext('Do you really want to unmount %s?'),
                [sel.data.name]),
              function(btn){
                if(btn === 'yes'){
                  lvm__LogicalVolume.unmount( sel.data.id, function(provider, response){
                    if( response.type === "exception" ){
                      Ext.Msg.alert('Unmount', interpolate(
                        gettext('Volume %s could not be unmounted, please check the logs.'),
                        [sel.data.name] ));
                    }
                    else{
                      Ext.Msg.alert('Unmount', interpolate(
                        gettext('Volume %s has been unmounted.'),
                        [sel.data.name] ));
                      self.store.reload();
                    }
                  });
                }
              }
            );
          }
        } );
      }
    }
  }, {
    text: gettext('Shares'),
    icon: MEDIA_URL + "/oxygen/16x16/emblems/emblem-unmounted.png",
    handler: function(self){
      "use strict";
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        var shareswin = new Ext.Window({
          title: gettext('Shares'),
          layout: "fit",
          height: 300,
          width: 500,
          items: {
            xtype: "grid",
            store: {
              xtype: 'directstore',
              autoLoad: true,
              fields: ['id', 'app', 'obj', '__unicode__'],
              directFn: lvm__LogicalVolume.get_shares,
              baseParams: {id: sel.data.id}
            },
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [ {
                header: gettext('App'),
                width: 100,
                dataIndex: "app"
              }, {
                header: gettext('Object'),
                width: 100,
                dataIndex: "obj"
              }, {
                header: gettext('Description'),
                width: 350,
                dataIndex: "__unicode__"
              } ]
            })
          }
        } );
        shareswin.show();
      }
    }
  }, {
    text: gettext('Initialize'),
    icon: MEDIA_URL + "/oxygen/16x16/actions/project-development-new-template.png",
    handler: function(){
      var self = this;
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        var scriptswin = new Ext.Window({
          title: gettext('Initialize'),
          layout: "fit",
          height: 300,
          width: 500,
          items: {
            xtype: "grid",
            viewConfig: { forceFit: true },
            store: {
              xtype: 'directstore',
              autoLoad: true,
              fields: [{
                name: 'script',
                convert: function (val, row){
                  return row;
                }
              }],
              directFn: lvm__LogicalVolume.get_initscripts
            },
            colModel: new Ext.grid.ColumnModel({
              defaults: {
                sortable: true
              },
              columns: [ {
                header: gettext('Script'),
                dataIndex: "script"
              } ]
            }),
            buttons: [{
              text: gettext('Initialize'),
              handler: function(btn){
                var gridsm = scriptswin.items.items[0].getSelectionModel();
                if( gridsm.hasSelection() ){
                  var gridsel = gridsm.selections.items[0];
                  lvm__LogicalVolume.run_initscript(sel.data.id, gridsel.data.script, function(provider, response){
                    Ext.Msg.alert(
                      gettext('Initialization complete'),
                      interpolate(
                        gettext("Initialization script %(script)s has been executed successfully on %(lv)s."),
                        { "script": gridsel.data.script, "lv": sel.data.name}, true),
                      function(){
                        scriptswin.close();
                      }
                    );
                  });
                }
              }
            }]
          }
        } );
        scriptswin.show();
      }
    }
  }, {
    text: gettext('Resize Volume'),
    icon: MEDIA_URL + "/icons2/16x16/actions/gtk-execute.png",
    handler: function(){
      "use strict";
      var self = this;
      var sm = this.getSelectionModel();
      if( sm.hasSelection() ){
        var sel = sm.selections.items[0];
        lvm__VolumeGroup.get_free_megs( sel.json.vg.id, function( provider, response ){
          var freemegs = response.result;
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
                ref: 'slider',
                increment: 100,
                layout: 'form',
                width: 220,
                value: sel.data.megs,
                minValue: 100,
                maxValue: freemegs,
                listeners: {
                  change: function(sld) {
                    if( typeof sld.ownerCt.megabyte !== "undefined" )
                      sld.ownerCt.megabyte.setValue(sld.getValue());
                    if( typeof sld.ownerCt.remaining_megabyte !== "undefined" )
                      sld.ownerCt.remaining_megabyte.setValue(freemegs - sld.getValue());
                  }
                }
              }, {
                xtype: 'numberfield',
                fieldLabel: gettext('Megabyte'),
                ref: 'megabyte',
                allowBlank: false,
                minValue: 100,
                maxValue: freemegs,
                enableKeyEvents: true,
                value: sel.data.megs,
                listeners: {
                  change: function change(event) {
                    if(this.getValue() > freemegs){
                      this.setValue(freemegs);
                    }
                    this.ownerCt.slider.setValue(this.getValue(), false);
                    this.ownerCt.remaining_megabyte.setValue(freemegs - this.getValue());
                  },
                  specialkey: function(f,e){
                    if(e.getKey() === e.ENTER){
                      if(this.getValue() > freemegs){
                        this.setValue(freemegs);
                      }
                      this.ownerCt.slider.setValue(this.getValue(), false);
                      this.ownerCt.remaining_megabyte.setValue(freemegs - this.getValue());
                    }
                  }
                }
              },{
                xtype: 'textfield',
                readOnly: true,
                ref: 'remaining_megabyte',
                fieldLabel: gettext('Remaining Space'),
                value: response.result,
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
                      { "lv": sel.data.name, "megs": frm.megabyte.getValue() }, true ),
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
                        lvm__LogicalVolume.set( sel.data.id, {
                          "megs": parseFloat(frm.megabyte.getValue())
                        }, function(provider, response){
                          self.store.reload();
                          progresswin.hide();
                        } );
                      }
                    }
                  );
                }
              },{
                text: gettext('Cancel'),
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(){
                  resizewin.hide();
                }
              }]
            }]
          }));
          resizewin.show();
        });
      }
    }
  }],
  form: {
    items: [{
      fieldLabel: "Name",
      allowBlank: false,
      name: "name",
      ref: 'namefield',
      vtype: "LVName"
    }, tipify({
      xtype:      'combo',
      allowBlank: false,
      fieldLabel: gettext('Volume Group'),
      hiddenName: 'vg',
      store: {
        xtype: "directstore",
        fields: ["id", "name"],
        directFn: lvm__VolumeGroup.all
      },
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      id: "volumegroup_all_add",
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'volfield',
      listeners: {
        select: function(self, record, index){
          "use strict";
          self.ownerCt.volume_free_megs = null;
          self.ownerCt.sizelabel.setText( gettext('Querying data...') );
          lvm__VolumeGroup.get_free_megs( record.data.id, function( provider, response ){
            self.ownerCt.volume_free_megs = response.result;
            self.ownerCt.sizelabel.setText( String.format( "Max. {0} MB", response.result ) );
          } );
        }
      }
    }, gettext('The volume group in which you want the Volume to be created.')),
    tipify({
      xtype:      'combo',
      fieldLabel: gettext('File System'),
      id: "volume_filesystem_add",
      hiddenName: 'filesystem',
      store: new Ext.data.DirectStore({
        fields: ["name", "desc", "supports_dedup", "supports_compression"],
        directFn: lvm__LogicalVolume.avail_fs
      }),
      listeners: {
        select: function(self, record, index){
          "use strict";
          self.ownerCt.dedupfield.setDisabled(!record.data.supports_dedup);
          self.ownerCt.compressionfield.setDisabled(!record.data.supports_compression);
          if(!record.data.supports_dedup){
            self.ownerCt.dedupfield.setValue(false);
            self.ownerCt.compressionfield.setValue(false);
          }
        }
      },
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'desc',
      valueField:    'name',
      ref:      'fsfield'
    }, gettext('If you want to use DRBD with this device, do not yet create a file system on it, even if you want to share it using NAS services later on.')),
    {
      fieldLabel: gettext('Size in MB'),
      allowBlank: false,
      name: "megs",
      ref: 'sizefield',
      xtype: "numberfield",
      minValue: 100
    }, {
      xtype: "label",
      ref:   "sizelabel",
      text:  gettext('Waiting for volume group selection...'),
      cls:   "form_hint_label"
    }, {
      fieldLabel: gettext('Deduplication'),
      name: "dedup",
      ref: 'dedupfield',
      xtype: "checkbox",
      disabled: true
    }, {
      fieldLabel: gettext('Compression'),
      name: "compression",
      ref: 'compressionfield',
      xtype: "checkbox",
      disabled: true
    }, {
      fieldLabel: gettext('Warning Level (%)'),
      allowBlank: false,
      name: "fswarning",
      ref: 'warnfield',
      value: 75,
      xtype: "numberfield"
    }, {
      fieldLabel: gettext('Critical Level (%)'),
      allowBlank: false,
      name: "fscritical",
      ref: 'critfield',
      value: 85,
      xtype: "numberfield"
    }, {
      xtype: "authuserfield",
      hiddenName: "owner",
      allowBlank: false
    }]
  },
  deleteConfirm: function(sel, handler, scope){
    "use strict";
    Ext.Msg.prompt(
      this.texts.remove,
      gettext('What was the name of the volume you wish to delete again?<br /><b>There is no undo and you will lose all data.</b>'),
      function(btn, text){
        if( btn === 'ok' ){
          if( text == sel.data.name ){
            handler.apply(scope, ['yes'] /* teehee */);
          }
          else{
            Ext.Msg.alert(this.texts.remove, gettext("Hm, that doesn't seem right..."));
          }
        }
        else{
          Ext.Msg.alert(this.texts.remove, gettext("As you wish."));
        }
      },
      scope
    );
  }
});

Ext.reg("lvm__logicalvolume_panel", Ext.oa.Lvm__LogicalVolume_Panel);


Ext.oa.Lvm__LogicalVolume_Module = Ext.extend(Object, {
  panel: "lvm__logicalvolume_panel",
  prepareMenuTree: function(tree){
    "use strict";
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/volume.png',
      panel: "lvm__logicalvolume_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__LogicalVolume_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
