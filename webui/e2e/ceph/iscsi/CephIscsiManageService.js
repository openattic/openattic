class CephIscsiManageService {

  constructor () {
    this.manageServiceButton = element(by.css(".tc_manageService"));

    this.state = element.all(by.css(".tc_state"));
    this.stopServiceButton = element.all(by.css(".tc_stopService"));
    this.startServiceButton = element.all(by.css(".tc_startService"));

    this.closeButton = element.all(by.id("close"));
  }

  startAllIfStopped () {
    this.manageServiceButton.click();
    browser.findElements(by.css(".tc_startService")).then(() => {
      this.startServiceButton.click();
      this.waitForState(/.*Starting*/, 0);
      this.waitForState(/.*Starting*/, 1);
      this.closeButton.click();
    }).catch(() => {
      this.closeButton.click()
    });
  }

  waitForState (state, n) {
    this.state.get(n).getText().then((text) => {
      if (text.match(state)) {
        browser.sleep(1000);
        this.waitForState(state, n);
      }
    });
  }
}

module.exports = CephIscsiManageService;
