{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.Time_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var timeGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "Date/Time",
      layout: 'absolute',
      items: [{
        xtype: 'form',
        width: 350,
        x: 30,
        y: 30,
        defaultType: 'textfield',
        autoHeight: true,
        frame: true,
        reader     : new Ext.data.JsonReader({fields: ['server','id']}),
        api: {
            // The server-side method to call for load() requests
            load: sysutils__NTP.get_ext,
            // The server-side must mark the submit handler as a 'formHandler'
            submit: sysutils__NTP.set
        },
        baseParams: {id:1},
        paramOrder: ["id"],
        items: [{
          fieldLabel: 'NTP Server',
          name: 'server',
          width: 200,
          allowBlank: false,
          
          ref: 'serverfield'
          }],
          buttons: [{
           text: 'Save',
           handler: function(self){
             sysutils__NTP.set(1, {
               'server':            self.ownerCt.ownerCt.emailfield.getValue()
             }); 
             Ext.Msg.show({
                title:   'NTP',
                msg:     'Successfully Updated NTP Server',
                buttons: Ext.MessageBox.OK
            });     
          }
         }],
     }]
  
  
    }));
    Ext.oa.Time_Panel.superclass.initComponent.apply(this, arguments);
    this.items.items[0].getForm().load({
       failure: function(form, action) {
          Ext.Msg.alert("Email Form Load Failed", action.result.errorMessage);
        }
    });
  },

  prepareMenuTree: function(tree){
    tree.root.attributes.children[4].children.push({
      text: "{% trans 'Date/Time' %}",
      leaf: true,
      panel: this,
      icon: MEDIA_URL + '/icons2/22x22/apps/date_time.png',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.Time_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
