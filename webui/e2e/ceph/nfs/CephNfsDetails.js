class CephNfsDetails {

  constructor () {
    this.panelTitle = element(by.css(".tc_panelTitle"));
    this.fsal = element(by.binding("$ctrl.getFsalDesc($ctrl.selection.item.fsal)"));
    this.path = element.all(by.binding("$ctrl.selection.item.path")).get(1);
    this.tag = element(by.binding("$ctrl.selection.item.tag"));
    this.nfsProtocol = element.all(by.repeater("protocol in $ctrl.selection.item.protocols"));
    this.pseudo = element(by.binding("$ctrl.selection.item.pseudo"));
    this.accessType = element.all(by.binding("$ctrl.selection.item.accessType")).get(0);
    this.squash = element(by.binding("$ctrl.selection.item.squash"));
    this.transportProtocol = element.all(by.repeater("transport in $ctrl.selection.item.transports"));
    this.clientAccessType = element.all(by.binding("clientBlock.accessType"));
    this.clientSquash = element.all(by.binding("clientBlock.squash"));
    this.mountCommand = element(by.binding("$ctrl.getMountCommand()"));
  }
}

module.exports = CephNfsDetails;
