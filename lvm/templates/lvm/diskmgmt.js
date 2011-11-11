{% load i18n %}

Ext.namespace("Ext.oa");

var volumeGroups = new Ext.data.DirectStore({
          fields: ['id', 'name',"LVM_VG_FREE","LVM_VG_SIZE","LVM_VG_ATTR"],
          directFn: lvm__VolumeGroup.all,
          listeners: {
            load: function(self){
              var handleResponse = function(i){
                return function(provider, response){
                  if( response.result.LVM2_VG_SIZE >= 1000 ){
                    self.data.items[i].set("LVM_VG_SIZE", String.format("{0} GB", (response.result.LVM2_VG_SIZE / 1000).toFixed(2)));
                  }
                  else
                  {
                    self.data.items[i].set("LVM_VG_SIZE", String.format("{0} MB", response.result.LVM2_VG_SIZE));
                  }
                  if( response.result.LVM2_VG_FREE >= 1000 ){
                    self.data.items[i].set("LVM_VG_FREE", String.format("{0} GB", (response.result.LVM2_VG_FREE / 1000).toFixed(2)));   
                  }
                  else
                  {
                    self.data.items[i].set("LVM_VG_FREE", String.format("{0} MB", response.result.LVM2_VG_FREE));
                  }
                  self.data.items[i].set("LVM_VG_ATTR", response.result.LVM2_VG_ATTR);
                  self.commitChanges();
                };
              }
              for (var i = 0; i < self.data.length; i++){
                lvm__VolumeGroup.lvm_info(self.data.items[i].id, handleResponse(i));
              }
            }
          }
        });

Ext.oa.volumeGroup_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var volumeGroupPanel = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "volumeGroup_panel_inst",
      title: "{% trans "Volume Groups" %}",
      layout: 'fit',
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans "Reload" %}",
        handler: function(self){
          volumeGroupPanel.store.reload();
        }
      },{
        text: "{% trans 'Create VG or Add Disk' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
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
      }],
      viewConfig: { forceFit: true },
      store: volumeGroups,
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "Name",
          dataIndex: "name"
        },{
          header: "Size",
          dataIndex: "LVM_VG_SIZE"
        },{
          header: "Free",
          dataIndex: "LVM_VG_FREE"
        },{
          header: "Attributes",
          dataIndex: "LVM_VG_ATTR"
        }]
      })
          
    }));
    Ext.oa.volumeGroup_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.volumeGroup_Panel.superclass.onRender.apply(this, arguments);
    volumeGroups.load();
  }
  
});

Ext.reg("volumeGroup_Panel", Ext.oa.volumeGroup_Panel);

Ext.oa.volumeGroup_Module = Ext.extend(Object, {
  panel: "volumeGroup_Panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_storage", {
      text: "{% trans 'Disk Management' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/database.png',
      panel: "volumeGroup_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.volumeGroup_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
