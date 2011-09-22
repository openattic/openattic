Ext.namespace("Ext.oa");


Ext.oa.Lvm__LogicalVolume_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var currentChartId = null;
    var lvmPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: 'LVM',
      layout: 'border',
      buttons: [{
          text: "",
          icon: "/filer/static/icons2/16x16/actions/reload.png",
          tooltip: 'Reload',
          handler: function(self){
            lvmPanel.items.items[0].store.reload();
          }
        }, {
          text: "Set warning threshold",
          icon: "/filer/static/icons2/16x16/status/dialog-warning.png",
          handler: function(self){
            Ext.Msg.prompt(
              'Enter threshold',
              'Enter the usage threshold above which you want LVs to appear red.',
              function(btn, text){
                if( btn == 'ok' ){
                  Ext.state.Manager.set("lv_red_threshold", parseFloat(text));
                  lvmPanel.items.items[0].store.reload();
                }
              }
            );
          }
        }, {
          text: "Add Volume",
          icon: "/filer/static/icons2/16x16/actions/add.png",
          handler: function(){
            var addwin = new Ext.Window({
              title: "Add Volume",
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
                    name: "name",
                    ref: 'namefield'
                  }, {
                    xtype:      'combo',
                    fieldLabel: 'Volume',
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
                    ref:      'volfield'
                  }, {
                    xtype:      'combo',
                    fieldLabel: 'File System',
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
                    text:  "If you want to use DRBD with this device, do not yet create a file system on it, "+
                           "even if you want to share it using NAS services later on.",
                    cls:   "form_hint_label"
                  }, {
                    fieldLabel: "Size in MB",
                    name: "megs",
                    ref: 'sizefield'
                  }, {
                    xtype:      'combo',
                    fieldLabel: 'Owner',
                    name:       'owner',
                    hiddenName: 'owner_id',
                    store: new Ext.data.DirectStore({
                      fields: ["username", "id"],
                      baseParams: { fields: ["username", "id"] },
                      directFn: auth__User.all_values
                    }),
                    typeAhead:     true,
                    triggerAction: 'all',
                    emptyText:     'Select...',
                    selectOnFocus: true,
                    displayField:  'username',
                    valueField:    'id',
                    ref:      'ownerfield'
                }],
                buttons: [{
                  text: 'Create Volume',
                  icon: "/filer/static/icons/accept.png",
                  handler: function(self){
                    var progresswin = new Ext.Window({
                      title: "Adding Volume",
                      layout: "fit",
                      height: 250,
                      width: 400,
                      html: '<b>Please wait while your volume is being created...</b>'
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
                  text: 'Cancel',
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
          text: "Resize Volume",
          icon: "/filer/static/icons2/16x16/actions/gtk-execute.png"
        }, {
          text: "Delete Volume",
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
            directFn: lvm__LogicalVolume.all
          });
          store.setDefaultSort("name");
          return store;
        }()),
        colModel:  new Ext.grid.ColumnModel({
          defaults: {
            sortable: true
          },
          columns: [{
            header: "LV",
            width: 200,
            dataIndex: "name"
          }, {
            header: "Size",
            width: 150,
            dataIndex: "megs",
            align: 'right',
            renderer: function( val, x, store ){
              if( val >= 1000 )
                return String.format("{0} GB", (val / 1000).toFixed(2));
              return String.format("{0} MB", val);
            }
          }, {
            header: "FS",
            width: 50,
            dataIndex: "filesystem",
            renderer: function( val, x, store ){
              if( val )
                return val;
              return "&ndash;";
            }
          }, {
            header: "Free",
            width: 100,
            dataIndex: "fsfree",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }, {
            header: "Used",
            width: 100,
            dataIndex: "fsused",
            align: 'right',
            renderer: function( val, x, store ){
              if( !val )
                return '';
              return String.format("{0} GB", val);
            }
          }, {
            header: "Used%",
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
        title: "Storage usage",
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
          loadingText: 'Loading...',
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
      text: 'Volume Management',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/volume.png',
      panel: this,
      href: '#'
    });
    tree.root.attributes.children[1].children.push({
      text: 'Snapshots',
      leaf: true,
      icon: '/filer/static/icons2/22x22/apps/snapshot.png',
      panel: this,
      href: '#'
    });
  }
});


// kate: space-indent on; indent-width 2; replace-tabs on;
