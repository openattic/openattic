/*!
 * Ext JS Library 3.2.0
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ux.Portlet = Ext.extend(Ext.Panel, {
    anchor : '100%',
    frame : true,
    collapsible : true,
    draggable : true,
    cls : 'x-portlet',
    saveState: function(){
        // Don't call the standard saveState method as it sends garbage
    },
    onClose: function(){
        this.ownerCt.remove(this, true)
    }
});

Ext.reg('portlet', Ext.ux.Portlet);

// kate: space-indent on; indent-width 4; replace-tabs on;
