class CephNfsForm {

  constructor () {
    this.hostRequired = element(by.css(".tc_hostRequired"));
    this.fsalRequired = element(by.css(".tc_fsalRequired"));

    this.rgwUserIdRequired = element(by.css(".tc_rgwUserIdRequired"));

    this.path = element(by.model("$ctrl.model.path"));
    this.pathRequired = element(by.css(".tc_pathRequired"));
    this.newDirectoryInfo = element(by.css(".tc_newDirectoryInfo"));
    this.bucket = element(by.model("$ctrl.model.bucket"));
    this.bucketRequired = element(by.css(".tc_bucketRequired"));
    this.newBucketInfo = element(by.css(".tc_newBucketInfo"));
    this.tag = element(by.model("$ctrl.model.tag"));
    this.protocolNfsv3 = element(by.model("$ctrl.model.protocolNfsv3"));
    this.protocolNfsv4 = element(by.model("$ctrl.model.protocolNfsv4"));
    this.nfsProtocolRequired = element(by.css(".tc_nfsProtocolRequired"));
    this.pseudo = element(by.model("$ctrl.model.pseudo"));
    this.pseudoRequired = element(by.css(".tc_pseudoRequired"));
    this.accessTypeRequired = element(by.css(".tc_accessTypeRequired"));
    this.squashRequired = element(by.css(".tc_squashRequired"));
    this.transportUDP = element(by.model("$ctrl.model.transportUDP"));
    this.transportTCP = element(by.model("$ctrl.model.transportTCP"));
    this.transportProtocolRequired = element(by.css(".tc_transportProtocolRequired"));

    this.addClientsButton = element(by.css(".tc_addClients"));
    this.clients = element(by.model("clientBlock.clients"));
    this.clientsRequired = element(by.css(".tc_clientsRequired"));
    this.clientsInvalid = element(by.css(".tc_clientsInvalid"));

    this.submitButton = element(by.css(".tc_submitButton"));
    this.backButton = element(by.css(".tc_backButton"));
  }

  selectHost (index) {
    element(by.model("$ctrl.model.host")).all(by.tagName("option")).get(index).click();
  }

  selectFsal (text) {
    element(by.model("$ctrl.model.fsal")).all(by.cssContainingText("option", text)).click();
  }

  selectRgwUserIndex (index) {
    element(by.model("$ctrl.model.rgwUserId")).all(by.tagName("option")).get(index).click();
  }

  selectRgwUser (user) {
    element(by.model("$ctrl.model.rgwUserId")).all(by.cssContainingText("option", user)).click();
  }

  selectAccessType (text) {
    element(by.model("$ctrl.model.accessType")).all(by.cssContainingText("option", text)).click();
  }

  selectSquash (text) {
    element(by.model("$ctrl.model.squash")).all(by.cssContainingText("option", text)).click();
  }

  selectClientsAccessType (text) {
    element(by.model("clientBlock.accessType")).all(by.cssContainingText("option", text)).click();
  }

  selectClientsSquash (text) {
    element(by.model("clientBlock.squash")).all(by.cssContainingText("option", text)).click();
  }
}

module.exports = CephNfsForm;
