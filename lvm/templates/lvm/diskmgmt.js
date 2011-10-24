{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Lvm__Partitions_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var partStore = new Ext.data.JsonStore({
      fields: [ "begin", "end", "flags-set", "number", "partition-name", "filesystem-type", "size" ],
      data: []
    });
    Ext.apply(this, Ext.apply(this.initialConfig, {
      store: partStore,
      colModel:  new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
            header: "#",
            width: 20,
            dataIndex: "number"
          }, {
            header: "{% trans "Size" %}",
            width: 100,
            dataIndex: "size"
          }, {
            header: "{% trans "Begin" %}",
            width: 100,
            dataIndex: "begin"
          }, {
            header: "{% trans "End" %}",
            width: 100,
            dataIndex: "end"
          }, {
            header: "{% trans "FS Type" %}",
            width: 100,
            dataIndex: "filesystem-type"
          }, {
            header: "{% trans "Label" %}",
            width: 100,
            dataIndex: "partition-name"
          }, {
            header: "{% trans "Flags" %}",
            width: 100,
            dataIndex: "flags-set"
        }]
      })
    }));
    Ext.oa.Lvm__Partitions_Panel.superclass.initComponent.apply(this, arguments);
    var self = this;
    lvm__VolumeGroup.get_partitions(this.device, function(provider, response){
      if( response.result ){
        var disk = response.result[0];
        self.setTitle( String.format( "{0} &mdash; {1}, {2}, {3}",
          disk["path"], disk["size"], disk["transport-type"], disk["model-name"]
        ));
        partStore.loadData( response.result[1] );
      }
    });
  }
});



Ext.oa.Lvm__Disks_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: 'lvm__disks_panel_inst',
      title: "{% trans "Disk Management" %}",
      layout: 'accordion',
      buttons: [ {
        text: "{% trans 'Initialize' %}",
        handler: function(){
          var initwin = new Ext.Window({
            title: "{% trans 'Initialize' %}",
            layout: "fit",
            height: 300,
            width: 500,
            items: [{
              xtype: "form",
              border: false,
              defaults: {
                xtype: "textfield",
                anchor: '-20px'
              },
              items: [tipify({ 
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: "{% trans 'Disk' %}",
                name:       'disk',
                hiddenName: 'disk_id',
                store: new Ext.data.DirectStore({
                  fields: ["rev", "model", "vendor", "block", "type"],
                  directFn: lvm__VolumeGroup.get_devices
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     'Select...',
                selectOnFocus: true,
                forceSelection: true,
                displayField:  'block',
                valueField:    'block',
                ref:           'diskfield',
                listeners: {
                  select: function(self, record, index){
                    var disk = self.getValue();
                    self.ownerCt.usagelabel.setText( "{% trans 'Querying data...' %}" );
                    lvm__VolumeGroup.is_device_in_use( disk, function( provider, response ){
                      if( response.result === false ){
                        self.ownerCt.usagelabel.setText(
                          interpolate("{% trans 'Disk %s is not currently used.' %}", [disk])
                          );
                        self.ownerCt.initbutton.enable();
                      }
                      else if( response.result[1] === "pv" ){
                        self.ownerCt.usagelabel.setText(
                          interpolate( "{% trans 'Disk %s is part of the Volume Group %s, refusing to touch it.' %}", [disk, response.result[2]] )
                        );
                        self.ownerCt.initbutton.disable();
                      }
                      else{
                        self.ownerCt.usagelabel.setText(
                          interpolate( "{% trans 'Disk %s is mounted as %s, refusing to touch it.' %}", [disk, response.result[2]] )
                        );
                        self.ownerCt.initbutton.disable();
                      }
                    } );
                  }
                }
              }, "Bitte wählen Sie eine Disk aus, welche Sie in die Volume Gruppe hinzufügen wollen."), {
                xtype: "label",
                ref:   "usagelabel",
                text:  "{% trans 'Waiting for disk selection...' %}",
                cls:   "form_hint_label"
              }, tipify({
                xtype:      'combo',
                allowBlank: false,
                fieldLabel: "{% trans 'Volume Group' %}",
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
                ref:           'vgfield',
                listeners: {
                  select: function(self, record, index){
                  }
                }
              },"Bitte wählen Sie die gewünschte Volume Gruppe aus. Falls Sie eine neue VG erzeugen wollen, tippen Sie den Namen, den Ihre VG haben soll,einfach in das leere Textfeld ein.")],
              buttons: [{
                text: "{% trans 'Initialize' %}",
                ref: "../initbutton",
                disabled: true,
                handler: function(self){
                  var vg   = self.ownerCt.ownerCt.vgfield.getValue();
                  var disk = self.ownerCt.ownerCt.diskfield.getValue();
                  var done = function( provider, response ){
                    Ext.Msg.alert("{% trans 'Success!' %}", "{% trans 'The Device has been successfully initialized.' %}");
                    initwin.hide();
                  }
                  if( typeof vg === "number" ){
                    lvm__VolumeGroup.join_device( vg, disk, done );
                  }
                  else if( typeof vg === "string" ){
                    lvm__VolumeGroup.create({name: vg}, function( provider, response ){
                      lvm__VolumeGroup.join_device( response.result.id, disk, done );
                    });
                  }
                }
              }]
            }]
          });
          initwin.show();
        }
      } ]
    }));
    Ext.oa.Lvm__Disks_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Lvm__Disks_Panel.superclass.onRender.apply(this, arguments);
    var self = this;
    lvm__VolumeGroup.get_devices(function(provider, response){
      if( response.result ){
        for( var i = 0; i < response.result.length; i++ ){
          self.add(new Ext.oa.Lvm__Partitions_Panel({
            title: String.format("/dev/{0} &mdash; {1} {2} {3}",
              response.result[i].block, response.result[i].vendor,
              response.result[i].model, response.result[i].rev),
            device: ('/dev/' + response.result[i].block)
          }));
        }
        self.doLayout();
      }
    });
  }
});

Ext.reg("lvm__disks_panel", Ext.oa.Lvm__Disks_Panel);

Ext.oa.Lvm__Disks_Module = Ext.extend(Object, {
  panel: "lvm__disks_panel",
  prepareMenuTree: function(tree){
    tree.root.attributes.children[1].children.push({
      text: "{% trans 'Disk Management' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: 'lvm__disks_panel_inst',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Lvm__Disks_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
