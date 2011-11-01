{% load i18n %}

Ext.namespace("Ext.oa");

Ext.oa.VolumeField = Ext.extend(Ext.form.ComboBox, {
  filesystem__isnull: false,
  initComponent: function(){
    var baseParams = {
      "field": "name"
    };

    if( this.filesystem__isnull === false )
      baseParams["kwds"] = {"__exclude__": {"filesystem":""}};

    if( this.filesystem__isnull === true )
      baseParams["kwds"] = {"filesystem":""};

    Ext.apply(this, Ext.applyIf(this.initialConfig, {
      fieldLabel: "{% trans 'Volume' %}",
      name:       'volume',
      hiddenName: 'volume_id',
      store: new Ext.data.DirectStore({
        fields: ["id", "name"],
        directFn: lvm__LogicalVolume.filter_combo,
        paramOrder: ["field", "query", "kwds"],
        baseParams: baseParams
      }),
      typeAhead:     true,
      triggerAction: 'all',
      emptyText:     "{% trans 'Select...' %}",
      selectOnFocus: true,
      forceSelection: true,
      displayField:  'name',
      valueField:    'id',
      ref:           'volfield'
    }));
    Ext.oa.VolumeField.superclass.initComponent.apply(this, arguments);
  }
});

Ext.reg("volumefield", Ext.oa.VolumeField);

// kate: space-indent on; indent-width 2; replace-tabs on;

