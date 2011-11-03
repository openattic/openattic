{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.SSMTP_Panel = Ext.extend(Ext.Panel, {
  initComponent: function(){
    var ssmtpGrid = this;
    Ext.apply(this, Ext.apply(this.initialConfig, {
      title: "SSMTP",
      layout: 'absolute',
      items: [{
        xtype: 'form',
        width: 350,
        x: 30,
        y: 30,
        frame: true,
        defaultType: 'textfield',
        reader: new Ext.data.JsonReader({fields: ['root','mailhub','rewriteDomain','id']}),
        api: {
          // The server-side method to call for load() requests
          load: ssmtp__SSMTP.get_ext,
          // The server-side must mark the submit handler as a 'formHandler'
          submit: ssmtp__SSMTP.set
        },
        baseParams: {id:1},
        paramOrder: ["id"],
        items: [{
          fieldLabel: 'Email',
          name: 'root',
          width: 200,
          allowBlank: false,
          ref: 'emailfield'
        },{
          fieldLabel: "{% trans 'Mailserver' %}",
          name: "{% trans 'mailhub' %}",
          width: 200,
          allowBlank: false,
          ref: 'mailserverfield'
        },{
          fieldLabel: "{% trans 'Domainname' %}",
          name:  "{% trans 'rewriteDomain' %}",
          width: 200,
          allowBlank: false,
          ref: 'domainnamefield'
        }],
        buttons: [{
          text: "{% trans 'Save' %}",
          handler: function(self){
            ssmtp__SSMTP.set(1, {
              'root':            self.ownerCt.ownerCt.emailfield.getValue(), 
              'mailhub':         self.ownerCt.ownerCt.mailserverfield.getValue(), 
              'rewriteDomain':   self.ownerCt.ownerCt.domainnamefield.getValue()
            });
            Ext.Msg.show({
                title:   "{% trans 'Email' %}",
                msg:     "{% trans 'Successfully Updated' %}",
                buttons: Ext.MessageBox.OK
            });
          }
        }]
      }]
    }));
    Ext.oa.SSMTP_Panel.superclass.initComponent.apply(this, arguments);
    this.items.items[0].getForm().load({
    });
  },

  prepareMenuTree: function(tree){
    tree.appendToRootNodeById("menu_system", {
      text: "{% trans 'Email' %}",
      leaf: true,
      panel: this,
      icon: MEDIA_URL + '/icons2/22x22/apps/email.png',
      href: '#'
    });
  }
});


window.MainViewModules.push( new Ext.oa.SSMTP_Panel() );

// kate: space-indent on; indent-width 2; replace-tabs on;
