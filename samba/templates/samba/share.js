{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Samba__Share_Panel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function(){
    var sambaShareGrid = this;
    var renderBoolean = function (val, x, store){
     if (val)
       return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-ok-apply.png" title="yes" />';
     return '<img src="' + MEDIA_URL + '/oxygen/16x16/actions/dialog-cancel.png" title="no" />';
      };
    Ext.apply(this, Ext.apply(this.initialConfig, {
      id: "samba__share_panel_inst",
      title: "{% trans 'Samba' %}",
      viewConfig: { forceFit: true },
      buttons: [{
        text: "",
        icon: MEDIA_URL + "/icons2/16x16/actions/reload.png",
        tooltip: "{% trans 'Reload' %}",
        handler: function(self){
        sambaShareGrid.store.reload();
        }
      },{
        text: "{% trans 'Add Share' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/add.png",
        handler: function(){
          var addwin = new Ext.Window({
            title: "{% trans 'Add Share' %}",
            layout: "fit",
            height: 500,
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
                fieldLabel: "{% trans 'Volume' %}",
                name:       'volume',
                hiddenName: 'volume_id',
                store: new Ext.data.DirectStore({
                  fields: ["id", "name"],
                  directFn: lvm__LogicalVolume.filter_values,
                  paramOrder: ["kwds", "fields"],
                  baseParams: {"kwds": {"filesystem__isnull": false}, "fields": ["name"]}
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
                      lvm__LogicalVolume.get( record.data.id, function( provider, response ){
                        self.ownerCt.dirfield.setValue( response.result.fs.mountpoints[0] );
                      } );
                    }
                  }
              }, {
                fieldLabel: "{% trans 'Path' %}",
                allowBlank: false,
                name: "path",
                ref: 'dirfield'
              }, {
                xtype:      'combo',
                allowBlank: true,
                fieldLabel: "{% trans 'Owner' %}",
                name:       'owner',
                hiddenName: 'owner_id',
                store: new Ext.data.DirectStore({
                  fields: ["username", "id"],
                  baseParams: { fields: ["username", "id"] },
                  directFn: auth__User.all_values
                }),
                typeAhead:     true,
                triggerAction: 'all',
                emptyText:     "{% trans 'Select...' %}",
                selectOnFocus: true,
                displayField:  'username',
                valueField:    'username',
                ref:      'ownerfield'
              },{
                fieldLabel: "{% trans 'Group' %}",
                allowBlank: true,
                name: "group",
                ref: 'groupfield'
              },{
                xtype: 'checkbox',
                fieldLabel: "{% trans 'Browseable' %}",
                allowBlank: false,
                name: "browseable",
                ref: 'browseablefield'
              },{
                xtype: 'checkbox',
                fieldLabel: "{% trans 'Available' %}",
                allowBlank: false,
                name: "available",
                ref: 'availablefield'
              },{
                xtype: 'checkbox',
                fieldLabel: "{% trans 'Writeable' %}",
                allowBlank: false,
                name: "writeable",
                ref: 'writeablefield'
              },{
                fieldLabel: "{% trans 'Comment' %}",
                allowBlank: true,
                name: "comment",
                ref: 'commentfield'
              },tipify({
                fieldLabel: "{% trans 'Create Mode' %}",
                allowBlank: false,
                name: "create mode",
                ref: 'createmodefield',
                value:     '0664'
              }, "{% trans 'Set rights for owner, group and others' %}"),{
                fieldLabel: "{% trans 'State' %}",
                allowBlank: false,
                name: "state",
                ref: 'statefield',
                value:     'active'
              },{
                xtype: 'checkbox',
                fieldLabel: "{% trans 'Guest OK' %}",
                allowBlank: false,
                name: "guest ok",
                ref: 'guestokfield'
              },tipify({
                fieldLabel: "{% trans 'Dir Mode' %}",
                allowBlank: false,
                name: "dir mode",
                ref: 'dirmodefield',
                value:     '0775'
              },"{% trans 'Set rights for the Directory' %}")
              ],
              buttons: [{
                text: "{% trans 'Create Share' %}",
                icon: MEDIA_URL + "/oxygen/16x16/actions/dialog-ok-apply.png",
                handler: function(self){
                  samba__Share.create({
                    'volume': {
                      'app': 'lvm',
                      'obj': 'LogicalVolume',
                      'id': self.ownerCt.ownerCt.volfield.getValue()
                    },
                    'path':    self.ownerCt.ownerCt.dirfield.getValue(),
                    'force_user':       self.ownerCt.ownerCt.ownerfield.getValue(),
                    'browseable':       self.ownerCt.ownerCt.browseablefield.getValue(),
                    'available':        self.ownerCt.ownerCt.availablefield.getValue(),
                    'force_group':      self.ownerCt.ownerCt.groupfield.getValue(),
                    'writeable':        self.ownerCt.ownerCt.writeablefield.getValue(),
                    'comment':          self.ownerCt.ownerCt.commentfield.getValue(),
                    'create_mode':      self.ownerCt.ownerCt.createmodefield.getValue(),
                    'state':            self.ownerCt.ownerCt.statefield.getValue(),
                    'guest_ok':         self.ownerCt.ownerCt.guestokfield.getValue(),
                    'dir_mode':         self.ownerCt.ownerCt.dirmodefield.getValue()
                  }, function(provider, response){
                    if( response.result ){
                      sambaShareGrid.store.reload();
                      addwin.hide();
                    }
                  });
                }
              }, {
                text: "{% trans 'Cancel' %}",
                icon: MEDIA_URL + "/icons2/16x16/actions/gtk-cancel.png",
                handler: function(self){
                  addwin.hide();
                }
              }]
            }]
          });
          addwin.show();
        }
      }, {
        text:  "{% trans 'Edit' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
        handler: function(self){
          var sm = sambaShareGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            var addwin = new Ext.Window({
              title: "{% trans 'Edit' %}",
              layout: "fit",
              height: 420,
              width: 500,
              items: [{
                xtype: "form",
                defaults: {
                  xtype: "textfield",
                  anchor: '-20px'
                },
                items: [{
                  fieldLabel: "{% trans 'Volume' %}",
                  name: "volume",
                  ref: 'volumefield',
                  readOnly: true,
                  disabled: true,
                  value: sel.json.volume.name
                },{
                  fieldLabel: "{% trans 'Path' %}",
                  name: "path",
                  ref: 'pathfield',
                  value: sel.json.path
                },{
                  xtype:      'combo',
                  allowBlank: true,
                  fieldLabel: "{% trans 'Owner' %}",
                  name:       'owner',
                  hiddenName: 'owner_id',
                  store: new Ext.data.DirectStore({
                    fields: ["username", "id"],
                    baseParams: { fields: ["username", "id"] },
                    directFn: auth__User.all_values
                  }),
                  typeAhead:     true,
                  triggerAction: 'all',
                  emptyText:     "{% trans 'Select...' %}",
                  selectOnFocus: true,
                  displayField:  'username',
                  valueField:    'username',
                  ref:      'ownerfield',
                  value: sel.json.force_user
                },{
                  fieldLabel: "{% trans 'Group' %}",
                  name: "group",
                  ref: 'groupfield',
                  value: sel.json.force_group
                },{
                  xtype: 'checkbox',
                  fieldLabel: "{% trans 'Browseable' %}",
                  name: "browseable",
                  ref: 'browseablefield',
                  checked: sel.json.browseable
                },{
                  xtype: 'checkbox',
                  fieldLabel: "{% trans 'Available' %}",
                  name: "available",
                  ref: 'availablefield',
                  checked: sel.json.available
                },{
                  xtype: 'checkbox',
                  fieldLabel: "{% trans 'Writeable' %}",
                  name: "writeable",
                  ref: 'writeablefield',
                  checked: sel.json.writeable
                },{
                  fieldLabel: "{% trans 'Comment' %}",
                  name: "comment",
                  ref: 'commentfield',
                  value: sel.json.comment
                },{
                  fieldLabel: "{% trans 'Create Mode' %}",
                  name: "create_mode",
                  ref: 'createmodefield',
                  value: sel.json.create_mode
                },{
                  fieldLabel: "{% trans 'State' %}",
                  name: "state",
                  ref: 'statefield',
                  value: sel.json.state
                },{
                  xtype: 'checkbox',
                  fieldLabel: "{% trans 'Guest OK' %}",
                  name: "guest_ok",
                  ref: 'guestokfield',
                  checked: sel.json.guest_ok
                },{
                  fieldLabel: "{% trans 'Dir Mode' %}",
                  name: "dir_mode",
                  ref: 'dirmodefield',
                  value: sel.json.dir_mode
                }],
                buttons: [{
                  text: "{% trans 'Save' %}",
                  icon: MEDIA_URL + "/icons2/16x16/actions/edit-redo.png",
                  handler: function(self){
                    var sm = sambaShareGrid.getSelectionModel();
                    if( sm.hasSelection() ){
                      var sel = sm.selections.items[0];
                      samba__Share.set(sel.id, {
                        'path':    self.ownerCt.ownerCt.pathfield.getValue(),
                        'force_user':    self.ownerCt.ownerCt.ownerfield.getValue(),
                        'force_group':  self.ownerCt.ownerCt.groupfield.getValue(),
                        'browseable':   self.ownerCt.ownerCt.browseablefield.getValue(),
                        'available':   self.ownerCt.ownerCt.availablefield.getValue(),
                        'writeable':   self.ownerCt.ownerCt.writeablefield.getValue(),
                        'comment':   self.ownerCt.ownerCt.commentfield.getValue(),
                        'create_mode':   self.ownerCt.ownerCt.createmodefield.getValue(),
                        'state':   self.ownerCt.ownerCt.statefield.getValue(),
                        'guest_ok':   self.ownerCt.ownerCt.guestokfield.getValue(),
                        'dir_mode':   self.ownerCt.ownerCt.dirmodefield.getValue()
                      }, function(provider, response){
                        if( response.result ){
                          sambaShareGrid.store.reload();
                          addwin.hide();
                        }
                      });
                    }
                  }
                }]
              }]
            });
            addwin.show();
          }
        }
      },{
        text: "{% trans 'Delete Share' %}",
        icon: MEDIA_URL + "/icons2/16x16/actions/remove.png",
        handler: function(self){
          var sm = sambaShareGrid.getSelectionModel();
          if( sm.hasSelection() ){
            var sel = sm.selections.items[0];
            Ext.Msg.confirm(
              "{% trans 'Delete Share' %}",
              interpolate(
                "{% trans 'Do you really want to delete %s?' %}",[sel.data.path]),
                function(btn){
                  if(btn == 'yes'){
                    samba__Share.remove( sel.id, function(provider, response){
                    sambaShareGrid.store.reload();
                } );
              }
            });
          }
        }
      } ],
      store: new Ext.data.DirectStore({
        fields: ['path', 'state', 'available'],
        directFn: samba__Share.all
      }),
      colModel: new Ext.grid.ColumnModel({
        defaults: {
          sortable: true
        },
        columns: [{
          header: "{% trans 'Path' %}",
          width: 200,
          dataIndex: "path"
        }, {
          header: "{% trans 'State' %}",
          width: 50,
          dataIndex: "state",
          renderer: renderBoolean
        }, {
          header: "{% trans 'Available' %}",
          width: 70,
          dataIndex: "available",
          renderer: renderBoolean
        }]
      })
     }));
    Ext.oa.Samba__Share_Panel.superclass.initComponent.apply(this, arguments);
  },
  onRender: function(){
    Ext.oa.Samba__Share_Panel.superclass.onRender.apply(this, arguments);
    this.store.reload();
  }
});

Ext.reg("samba__share_panel", Ext.oa.Samba__Share_Panel);

Ext.oa.Samba__Share_Module = Ext.extend(Object, {
  panel: "samba__share_panel",
  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_shares", {
      text: "{% trans 'Windows (Samba)' %}",
      leaf: true,
      icon: MEDIA_URL + '/icons2/22x22/apps/samba.png',
      panel: "samba__share_panel_inst",
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Samba__Share_Module() );

// kate: space-indent on; indent-width 2; replace-tabs on;
