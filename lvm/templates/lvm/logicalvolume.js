Ext.namespace("Ext.oa");


Ext.oa.Lvm__LogicalVolume_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var currentChartId = null;
    var lvmPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: gettext('LVM'),
      layout: 'border',
      buttons: [{
          text: "",
          icon: "/filer/static/icons2/16x16/actions/reload.png",
          tooltip: gettext('Reload'),
          handler: function(self){
            lvmPanel.items.items[0].store.reload();
          }
        }, {
          text: gettext("Set warning threshold"),
          icon: "/filer/static/icons2/16x16/status/dialog-warning.png",
          handler: function(self){
            Ext.Msg.prompt(
              gettext('Enter threshold'),
              gettext('Enter the usage threshold above which you want LVs to appear red.'),
              function(btn, text){
                if( btn == 'ok' ){
                  Ext.state.Manager.set("lv_red_threshold", parseFloat(text));
                  lvmPanel.items.items[0].store.reload();
                }
              }
            );
          }
        }, {
          text: gettext("Mount"),
          icon: "/filer/static/oxygen/16x16/emblems/emblem-mounted.png",
          handler: function(self){
            var lvmGrid = lvmPanel.items.items[0];
            var sm = lvmGrid.getSelectionModel();
            if( sm.hasSelection() ){
              var sel = sm.selections.items[0];
              if( !sel.data.filesystem ){
                Ext.Msg.alert(sel.data.name,
                  interpolate(
                    gettext("Volume %s does not have a file system and therefore cannot be mounted."),
                    [sel.data.name] ));
                return;
              }
              lvm__LogicalVolume.is_mounted( sel.data.id, function(provider, response){
                if( response.result ){
                  Ext.Msg.alert(sel.data.name, interpolate( gettext("Volume %s is already mounted."), [sel.data.name] ));
                  return;
                }
                lvm__LogicalVolume.is_in_standby( sel.data.id, function(provider, response){
                  if( response.result ){
                    Ext.Msg.alert(sel.data.name,
                      interpolate( gettext("Volume %s cannot be mounted at the current time."), [sel.data.name] ));
                    return;
                  }
                  lvm__LogicalVolume.mount( sel.data.id, function(provider, response){
                    if( response.type === "exception" )
                      Ext.Msg.alert(sel.data.name, interpolate(
                        gettext("Volume %s could not be mounted, please check the logs."), [sel.data.name] ));
                    else
                      Ext.Msg.alert(sel.data.name, interpolate(
                        gettext("Volume %s has been mounted."), [sel.data.name] ));
                  } );
                } );
              } );
            }
          }
        }, {
          text: gettext("Unmount"),
          icon: "/filer/static/oxygen/16x16/emblems/emblem-unmounted.png",
          handler: function(self){
            var lvmGrid = lvmPanel.items.items[0];
            var sm = lvmGrid.getSelectionModel();
            if( sm.hasSelection() ){
              var sel = sm.selections.items[0];
              lvm__LogicalVolume.is_mounted( sel.data.id, function(provider, response){
                if( !response.result ){
                  Ext.Msg.alert(sel.data.name, interpolate( gettext("Volume %s is not mounted."), [sel.data.name] ));
                }
                else{
                  lvm__LogicalVolume.unmount( sel.data.id, function(provider, response){
                    if( response.type === "exception" )
                      Ext.Msg.alert(sel.data.name, interpolate(
                        gettext("Volume %s could not be unmounted, please check the logs."), [sel.data.name] ));
                    else
                      Ext.Msg.alert(sel.data.name, interpolate(
                        gettext("Volume %s has been unmounted."), [sel.data.name] ));
                  } );
                }
              } );
            }
          }
        }, {
          text: gettext("Add Volume"),
          icon: "/filer/static/icons2/16x16/actions/add.png",
          handler: function(){
            var addwin = new Ext.Window({
              title: gettext("Add Volume"),
              layout: "fit",
              height: 300,
              width: 500,
              items: [{
                xtype: "form",
                defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                    fieldLabel: "Name",
                    allowBlank: false,
                    name: "name",
                    ref: 'namefield'
                  }, {
                    xtype:      'combo',
                    allowBlank: false,
                    fieldLabel: gettext('Volume Group'),
                    name:       'volume',
                    hiddenName: 'volume_id',
                    store: new Ext.data.DirectStore({
                      fields: ["app", "obj", "id", "name"],
                      directFn: lvm__VolumeGroup.ids
                    }),
                    typeAhead:     true,
                    triggerAction: 'all',
                    emptyText:     'Select...',
                    selectOnFocus: true,
                    displayField:  'name',
                    valueField:    'id',
                    ref:           'volfield',
                    listeners: {
                      select: function(self, record, index){
                        self.ownerCt.volume_free_megs = null;
                        self.ownerCt.sizelabel.setText( gettext("Querying data...") );
                        lvm__VolumeGroup.get_free_megs( record.data.id, function( provider, response ){
                          self.ownerCt.volume_free_megs = response.result;
                          self.ownerCt.sizelabel.setText( String.format( "Max. {0} MB", response.result ) );
                        } );
                      }
                    }
                  }, {
                    xtype:      'combo',
                    fieldLabel: gettext('File System'),
                    name:       'filesystem_desc',
                    hiddenName: 'filesystem_name',
                    store: new Ext.data.DirectStore({
                      fields: ["name", "desc"],
                      directFn: lvm__LogicalVolume.avail_fs
                    }),
                    typeAhead:     true,
                    triggerAction: 'all',
                    emptyText:     'Select...',
                    selectOnFocus: true,
                    displayField:  'desc',
                    valueField:    'name',
                    ref:      'fsfield'
                  }, {
                    xtype: "label",
                    text:  gettext("If you want to use DRBD with this device, do not yet create a file system on it, even if you want to share it using NAS services later on."),
                    cls:   "form_hint_label"
                  }, {
                    fieldLabel: gettext("Size in MB"),
                    allowBlank: false,
                    name: "megs",
                    ref: 'sizefield'
                  }, {
                    xtype: "label",
                    ref:   "sizelabel",
                    text:  gettext("Waiting for volume selection..."),
                    cls:   "form_hint_label"
                  }, {
                    xtype:      'combo',
                    allowBlank: false,
                    fieldLabel: gettext('Owner'),
                    name:       'owner',
                    hiddenName: 'owner_id',
                    store: new Ext.data.DirectStore({
                      fields: ["username", "id"],
                      baseParams: { fields: ["username", "id"] },
                      directFn: auth__User.all_values
                    }),
                    typeAhead:     true,
                    triggerAction: 'all',
                    emptyText:     gettext('Select...'),
                    selectOnFocus: true,
                    displayField:  'username',
                    valueField:    'id',
                    ref:      'ownerfield'
                }],
                buttons: [{
                  text: gettext('Create Volume'),
                  icon: "/filer/static/icons/accept.png",
                  handler: function(self){
                    if( !self.ownerCt.ownerCt.getForm().isValid() ){
                      return;
                    }
                    var free = self.ownerCt.ownerCt.volume_free_megs;
                    if( free === null || typeof free == "undefined" ){
                      Ext.Msg.alert(gettext("Error"),
                        gettext("Please wait for the query for available space to complete."));
                      return;
                    }
                    if( free < self.ownerCt.ownerCt.sizefield.getValue() ){
                      Ext.Msg.alert(gettext("Error"),
                        interpolate( gettext("Your volume exceeds the available capacity of %s MB."),
                          [response.result]) );
                      return;
                    }
                    var progresswin = new Ext.Window({
                      title: gettext("Adding Volume"),
                      layout: "fit",
                      height: 250,
                      width: 400,
                      html: gettext('Please wait while your volume is being created...')
                    });
                    progresswin.show();
                    lvm__LogicalVolume.create({
                      'vg': {
                        'app': 'lvm',
                        'obj': 'VolumeGroup',
                        'id': self.ownerCt.ownerCt.volfield.getValue()
                      },
                      'filesystem': self.ownerCt.ownerCt.fsfield.getValue(),
                      'name':       self.ownerCt.ownerCt.namefield.getValue(),
                      'megs':       self.ownerCt.ownerCt.sizefield.getValue(),
                      'owner': {
                        'app': 'auth',
                        'obj': 'User',
                        'id': self.ownerCt.ownerCt.ownerfield.getValue()
                      }
                    }, function(provider, response){
                      if( response.result ){
                        lvmPanel.items.items[0].store.reload();
                        progresswin.hide();
                        addwin.hide();
                      }
                    });
                  }
                }, {
                  text: gettext('Cancel'),
                  icon: "/filer/static/icons2/16x16/actions/gtk-cancel.png",
                  handler: function(self){
                    addwin.hide();
                  }
                }]
              }]
            });
            addwin.show();
          }
        }, {
          text: gettext("Resize Volume"),
          icon: "/filer/static/icons2/16x16/actions/gtk-execute.png"
        }, {
          text: gettext("Delete Volume"),
          icon: "/filer/static/icons2/16x16/actions/remove.png",
          handler: function(self){
            var lvmGrid = lvmPanel.items.items[0];
            var sm = lvmGrid.getSelectionModel();
            if( sm.hasSelection() ){
              var sel = sm.selections.items[0];
              Ext.Msg.confirm(
                'Confirm delete',
                String.format( 'Really delete volume {0} and all its shares?<br />'+
                  '<b>There is no undo and you will lose all data.</b>', sel.data.name ),
                function(btn, text){
                  if( btn == 'yes' ){
                    lvm__LogicalVolume.remove( sel.data.id, function(provider, response){
                      lvmGrid.store.reload();
                    } );
                  }
                  else
                    alert("Aborted.");
                }
              );
            }
          }
      }],
      items: [{
        xtype: 'grid',
        region: "center",
        ref: 'lvpanel',
        store: (function(){
          // Anon function that is called immediately to set up the store's DefaultSort
          var store = new Ext.data.DirectStore({
            autoLoad: true,
            fields: ['name', 'megs', 'filesystem',  'formatted', 'id', 'state', 'fs',
              {
                name: 'fsfree',
                mapping: 'fs',
                sortType: 'asInt',
                convert: function( val, row ){
                  if( val === null || typeof val.stat === "undefined" )
                    return null;
                  return val.stat.freeG.toFixed(2);
                }
              }, {
                name: 'fsused',
                mapping: 'fs',
                sortType: 'asInt',
                convert: function( val, row ){
                  if( val === null || typeof val.stat === "undefined" )
                    return null;
                  return val.stat.usedG.toFixed(2);
                }
              }, {
                name: 'fspercent',
                mapping: 'fs',
                sortType: 'asInt',
                convert: function( val, row ){
                  if( val === null || typeof val.stat === "undefined" )
                    return null;
                  return (val.stat.used / val.stat.size * 100 ).toFixed(2);
                }
              }],
            baseParams: { "snapshot__isnull": true },
            directFn: lvm__LogicalVolume.filter
          });
          store.setDefaultSort("name");
          return store;
        }()),
        colModel:  new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: gettext("LV"),
            width: 200,
            dataIndex: "name"
          }, {
            header: gettext("Size"),
            width: 150,
            dataIndex: "megs",
            align: 'right',
            renderer: function( val, x, store ){
              if( val >= 1000 )
                return String.format("{0} GB", (val / 1000).toFixed(2));
              return String.format("{0} MB", val);
            }
          }, {
            header: gettext("FS"),
            width: 50,
            dataIndex: "filesystem",
            renderer: function( val, x, store ){
              if( val )
                return val;
              return "&ndash;";
            }
          }, {
            header: gettext("Free"),
            width: 100,
            dataIndex: "fsfree",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }, {
            header: gettext("Used"),
            width: 100,
            dataIndex: "fsused",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }, {
            header: gettext("Used%"),
            width: 75,
            dataIndex: "fspercent",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              if( val > Ext.state.Manager.get("lv_red_threshold", 90.0) )
                var color = "red";
              else
                var color = "green";
              return String.format('<span style="color:{1};">{0}%</span>', val, color);
            }
          }]
        }),
        listeners: {
          cellmousedown: function( self, rowIndex, colIndex, evt ){
            var record = self.getStore().getAt(rowIndex);
            var chartpanel = self.ownerCt.items.items[1];
            var defer = false;
            if( !chartpanel.collapsed ){
              chartpanel.collapse();
              defer = true;
            }
            if( !record.data.filesystem || currentChartId === record.data.id ){
              currentChartId = null;
              return;
            }
            currentChartId = record.data.id;
            chartpanel.items.items[0].store.loadData([[
                record.data.id, record.data.name,
                record.data.fsused, record.data.fsfree,
                (record.data.megs / 1000).toFixed(2)
              ]]);
            if( defer )
              chartpanel.expand.defer(500, chartpanel);
            else
              chartpanel.expand();
          }
        }
      }, {
        split: true,
        region: "east",
        title: gettext("Storage usage"),
        collapsible: true,
        collapsed: true,
        width:  460,
        layout: "fit",
        ref: 'chartpanel',
        items: new Ext.DataView({
          tpl: new Ext.XTemplate(
            '<tpl for=".">',
              '<div class="thumb-wrap" id="{name}">',
                '<img src="/filer/lvm/mem/{id}.png" width="450" title="{name}" />',
                '<span class="fsstat">{fsused} GB used &ndash; {fsfree} GB free &ndash; {total} GB total</span>',
              '</div>',
            '</tpl>'),
          singleSelect: true,
          autoHeight: true,
          itemSelector: 'div.thumb_wrap',
          loadingText: gettext('Loading...'),
          store: new Ext.data.ArrayStore({
            fields: ['id', 'name', 'fsused', 'fsfree', 'total'],
            data: []
          })
        })
      }]
    }));
    Ext.oa.Lvm__LogicalVolume_Panel.superclass.initComponent.apply(this, arguments);
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: gettext('Volume Management'),
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/volume.png',
      panel: this,
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__LogicalVolume_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
