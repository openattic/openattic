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
    return (/^[A-Za-z0-9_\-]+$/).test(v);
  },
  LVNameText: "Must only contain alphanumeric characters or _ and -.",
  LVNameMask: /[A-Za-z0-9_\-]/
});

Ext.define('Ext.oa.Lvm__LogicalVolume_BasePanel', {
  extend: 'Ext.oa.ShareGridPanel',
  api: lvm__LogicalVolume,
  window: {
    height: 350,
    width:  550
  },
  allowEdit: false,
  filterSearchParam: "name__icontains",
  getStore: function(){
    return {
      fields: [ "fswarning", "fscritical", {
        name: 'fsfree',
        mapping: 'fs',
        sortType: 'asFloat',
        convert: function( val, row ){
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
          if( val === null || typeof val.stat === "undefined" ){
            return -1;
          }
          return (val.stat.used / val.stat.size * 100 ).toFixed(2);
        }
      }, {
        name: 'fshost',
        mapping: 'fs',
        convert: function( val, row ){
          if( val === null ){
            return '';
          }
          return toUnicode(val.host);
        }
      }, {
        name: 'fsmountpoint',
        mapping: 'fs',
        convert: function( val, row ){
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
    };
  },
  getColumns: function(){
    return [{
      header: gettext('LV'),
      dataIndex: "name"
    }, {
      header: gettext('Size'),
      dataIndex: "megs",
      align: 'right',
      renderer: function( val, x, store ){
        if( val >= 1000 ){
          return Ext.String.format("{0} GB", (val / 1000).toFixed(2));
        }
        return Ext.String.format("{0} MB", val);
      }
    }, {
      header: gettext('FS'),
      dataIndex: "filesystem",
      renderer: function( val, x, store ){
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
        if( !val || val === -1 ){
          return '';
        }
        return Ext.String.format("{0} GB", val);
      }
    }, {
      header: gettext('Used'),
      dataIndex: "fsused",
      align: 'right',
      renderer: function( val, x, store ){
        if( !val || val === -1 ){
          return '';
        }
        return Ext.String.format("{0} GB", val);
      }
    }, {
      header: gettext('Used%'),
      dataIndex: "fspercent",
      align: 'right',
      renderer: function( val, x, store ){
        if( !val || val === -1 ){
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
            cls:   ( val > store.data.fscritical ? "lv_used_crit" :
                    (val > store.data.fswarning  ? "lv_used_warn" : "lv_used_ok"))
          });
        },25);
        return Ext.String.format('<span id="{0}"></span>', id);
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
    }];
  },
  getButtons: function(){
    var self = this;
    return [{
      text: gettext('Set warning threshold'),
      icon: MEDIA_URL + "/icons2/16x16/status/dialog-warning.png",
      handler: function(){
        var sm = self.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
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
                  value: sel.data.fswarning,
                  xtype: "numberfield"
                }, {
                  fieldLabel: gettext('Critical Level (%)'),
                  allowBlank: false,
                  name: "fscritical",
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
                    'fswarning':  Ext.ComponentQuery.query("[name=fswarning]",  this.form)[0].getValue(),
                    'fscritical': Ext.ComponentQuery.query("[name=fscritical]", this.form)[0].getValue()
                  }, function(provider, response){
                    if( response.result ){
                      self.store.load();
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
        var sm = self.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
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
                  self.store.load();
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
        var sm = self.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
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
                        self.store.load();
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
        var sm = self.ownerCt.ownerCt.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
          var shareswin = new Ext.Window({
            title: gettext('Shares'),
            layout: "fit",
            height: 300,
            width: 500,
            items: {
              xtype: "grid",
              store: (function(){
                Ext.define('lvm_logicalvolume_shares_store', {
                  extend: 'Ext.data.Model',
                  fields: [
                    {name: 'id'},
                    {name: 'app'},
                    {name: 'obj'},
                    {name: '__unicode__'}
                  ]
                });
                return Ext.create('Ext.data.Store', {
                  model: "lvm_logicalvolume_shares_store",
                  proxy: {
                    type: 'direct',
                    directFn: lvm__LogicalVolume.get_shares,
                    extraParams: {id: sel.data.id}
                  },
                  autoLoad: true
                });
              }()),
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
            }
          } );
          shareswin.show();
        }
      }
    }, {
      text: gettext('Initialize'),
      icon: MEDIA_URL + "/oxygen/16x16/actions/project-development-new-template.png",
      handler: function(){
        var sm = self.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
          var scriptswin = new Ext.Window({
            title: gettext('Initialize'),
            layout: "fit",
            height: 300,
            width: 500,
            items: {
              xtype: "grid",
              viewConfig: { forceFit: true },
              store: (function(){
                Ext.define('lvm_logicalvolume_initialize_store', {
                  extend: 'Ext.data.Model',
                  fields: [
                    {
                      name: 'script',
                      convert: function (val, row){
                      return row.raw;
                      }
                    },
                  ]
                });
                return Ext.create('Ext.data.Store', {
                  model: "lvm_logicalvolume_initialize_store",
                  proxy: {
                    type: 'direct',
                    directFn: lvm__LogicalVolume.get_initscripts
                  },
                  autoLoad: true
                });
              }()),
              defaults: {
                sortable: true
              },
              columns: [{
                header: gettext('Script'),
                dataIndex: "script"
              }],
              buttons: [{
                text: gettext('Initialize'),
                handler: function(btn){
                  var gridsm = scriptswin.items.items[0].getSelectionModel();
                  if( gridsm.hasSelection() ){
                    var gridsel = gridsm.selected.items[0];
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
        var sm = self.getSelectionModel();
        if( sm.hasSelection() ){
          var sel = sm.selected.items[0];
          lvm__VolumeGroup.get_free_megs( sel.raw.vg.id, function( provider, response ){
            var freemegs = response.result;
            var resizewin = new Ext.Window(Ext.apply({
              layout: "fit",
              title: gettext('Resize Volume'),
              defaults: { autoScroll: true },
              height: 200,
              width: 500,
              items: [{
                xtype: "form",
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
                  increment: 100,
                  layout: 'form',
                  width: 220,
                  value: sel.data.megs,
                  minValue: 100,
                  maxValue: freemegs,
                  listeners: {
                    change: function(sld) {
                      Ext.ComponentQuery.query("[name=megabyte]", this.ownerCt)[0].setValue(sld.getValue());
                      Ext.ComponentQuery.query("[name=remaining_megabyte]", this.ownerCt)[0].setValue(freemegs - sld.getValue());
                    }
                  }
                }, {
                  xtype: 'numberfield',
                  fieldLabel: gettext('Megabyte'),
                  allowBlank: false,
                  name: "megabyte",
                  minValue: 100,
                  maxValue: freemegs,
                  enableKeyEvents: true,
                  value: sel.data.megs,
                  listeners: {
                    change: function(event) {
                      if(this.getValue() > freemegs){
                        this.setValue(freemegs);
                      }
                      Ext.ComponentQuery.query("slider", this.ownerCt)[0].setValue(this.getValue(), false);
                      Ext.ComponentQuery.query("[name=remaining_megabyte]", this.ownerCt)[0].setValue(freemegs - this.getValue());
                    },
                    specialkey: function(f,e){
                      if(e.getKey() === e.ENTER){
                        if(this.getValue() > freemegs){
                          this.setValue(freemegs);
                        }
                        Ext.ComponentQuery.query("slider", this.ownerCt)[0].setValue(this.getValue(), false);
                        Ext.ComponentQuery.query("[name=remaining_megabyte]", this.ownerCt)[0].setValue(freemegs - this.getValue());
                      }
                    }
                  }
                },{
                  xtype: 'textfield',
                  name: "remaining_megabyte",
                  readOnly: true,
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
                        { "lv": sel.data.name, "megs": frm.items.items[1].getValue() }, true ),
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
                            "megs": parseFloat(frm.items.items[1].getValue())
                          }, function(provider, response){
                            self.store.load();
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
    }];
  }
});



Ext.define('Ext.oa.Lvm__LogicalVolume_Panel', {
  alias: 'widget.lvm__logicalvolume_panel',
  extend: 'Ext.oa.Lvm__LogicalVolume_BasePanel',
  id: "lvm__logicalvolume_panel_inst",
  title: gettext("Logical Volumes"),
  filterParams: {
    "snapshot__isnull": true
  },
  texts: {
    add:     gettext('Add Volume'),
    edit:    gettext('Edit Volume'),
    remove:  gettext('Delete Volume')
  },
  initComponent: function(){
    Ext.apply(this, {
      store:   this.getStore(),
      buttons: this.getButtons(),
      columns: this.getColumns(),
    });
    this.callParent(arguments);
  },
  form: {
    items: [{
      fieldLabel: "Name",
      allowBlank: false,
      name: "name",
      ref: 'namefield',
      id: 'namefield',
      vtype: "LVName"
    }, tipify({
      xtype:      'combo',
      allowBlank: false,
      fieldLabel: gettext('Volume Group'),
      name: 'vg',
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
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
      emptyText:     gettext('Select...'),
      id: "volumegroup_all_add",
      selectOnFocus: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'volfield',
      listeners: {
        select: function(self, record, index){
          self.ownerCt.volume_free_megs = null;
          var sizelabel = Ext.ComponentQuery.query("label", self.ownerCt)[0];
          sizelabel.setText( gettext('Querying data...') );
          lvm__VolumeGroup.get_free_megs( record[0].data.id, function( provider, response ){
            self.ownerCt.volume_free_megs = response.result;
            sizelabel.setText(Ext.String.format( "Max. {0} MB", response.result ) );
          } );
        }
      }
    }, gettext('The volume group in which you want the Volume to be created.')),
    tipify({
      xtype:      'combo',
      fieldLabel: gettext('File System'),
      id: "volume_filesystem_add",
      name: 'filesystem',
      store: (function(){
        Ext.define('lvm_logicalvolume_filesystem_store', {
          extend: 'Ext.data.Model',
          fields: [
            {name: 'name'},
            {name: 'desc'},
            {name: 'supports_dedup'},
            {name: 'supports_compression'}
          ]
        });
        return Ext.create('Ext.data.Store', {
          model: "lvm_logicalvolume_filesystem_store",
          proxy: {
            type: 'direct',
            directFn: lvm__LogicalVolume.avail_fs
          }
        });
      }()),
      listeners: {
        select: function(self, record, index){
          var dedupfield = Ext.ComponentQuery.query("[name=dedup]", self.ownerCt)[0];
          var compressionfield = Ext.ComponentQuery.query("[name=compression]", self.ownerCt)[0];
          dedupfield.setDisabled(!record[0].data.supports_dedup);
          compressionfield.setDisabled(!record[0].data.supports_compression);
          if(!record[0].data.supports_dedup){
            dedupfield.setValue(false);
            compressionfield.setValue(false);
          }
        }
      },
      typeAhead:     true,
      triggerAction: 'all',
      deferEmptyText: false,
      emptyText:     gettext('Select...'),
      selectOnFocus: true,
      displayField:  'desc',
      valueField:    'name',
    }, gettext('If you want to use DRBD with this device, do not yet create a file system on it, even if you want to share it using NAS services later on.')),
    {
      fieldLabel: gettext('Size in MB'),
      allowBlank: false,
      name: "megs",
      xtype: "numberfield",
      minValue: 100
    }, {
      xtype: "label",
      text:  gettext('Waiting for volume group selection...'),
      cls:   "form_hint_label"
    }, {
      fieldLabel: gettext('Deduplication'),
      name: "dedup",
      xtype: "checkbox",
      disabled: true
    }, {
      fieldLabel: gettext('Compression'),
      name: "compression",
      xtype: "checkbox",
      disabled: true
    }, {
      fieldLabel: gettext('Warning Level (%)'),
      allowBlank: false,
      name: "fswarning",
      value: 75,
      xtype: "numberfield"
    }, {
      fieldLabel: gettext('Critical Level (%)'),
      allowBlank: false,
      name: "fscritical",
      value: 85,
      xtype: "numberfield"
    }, {
      xtype: "auth__userfield",
      name: "owner",
      allowBlank: false
    }]
  },
  deleteConfirm: function(sel, handler, scope){
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


Ext.oa.Lvm__LogicalVolume_Module = {
  panel: "lvm__logicalvolume_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: gettext('Volume Management'),
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/volume.png',
      panel: "lvm__logicalvolume_panel_inst"
    });
  }
};


// window.MainViewModules.push( Ext.oa.Lvm__LogicalVolume_Module );

// kate: space-indent on; indent-width 2; replace-tabs on;
