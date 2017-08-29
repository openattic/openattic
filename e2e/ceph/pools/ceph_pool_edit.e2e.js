'use strict';

const helpers = require('../../common.js');
const cephPoolCommon = require('./cephPoolCommon.js');

describe('ceph pool edit form', function(){
  const cephPoolProperties = new cephPoolCommon();
  const name = 'e2e-pool-edit';

  const isHidden = (e) => !e.isPresent() || !e.isDisplayed();

  const editPool = () => {
    var pool = helpers.search_for_element(name);
    pool.click();
    cephPoolProperties.editButton.click();
  };

  const setPgNumber = (pgs) =>
    cephPoolProperties.getFormElement(cephPoolProperties.formElements.pgnum)
        .clear()
        .sendKeys(pgs)
        .sendKeys(protractor.Key.TAB);

  const isSubmitEnabled = () =>
    cephPoolProperties.getFormElement(cephPoolProperties.formElements.createButton)
        .isEnabled();

  beforeAll(function(){
    helpers.login();
    helpers.setLocation('ceph/pools');
    cephPoolProperties.addButton.click();
    cephPoolProperties.createPool(name, 'replicated', 32);
    editPool();
  });

  it('should contain edit in url', () => {
    expect(browser.getCurrentUrl()).toContain('/#/ceph/pool/edit/');
  });

  it('should not be possible to decrease pgnum', () => {
    setPgNumber(16);
    expect(isSubmitEnabled()).toBe(false);
    setPgNumber(32);
    expect(isSubmitEnabled()).toBe(true);
  });

  it('should be possible to increase pgnum', () => {
    setPgNumber(64);
    cephPoolProperties.submitForm(name, 'replicated', 64);
    editPool();
  });

  it('should not be possible to submit without any apps', () => {
    cephPoolProperties.deleteFirstApp();
    expect(isSubmitEnabled()).toBe(false);
    cephPoolProperties.addApplication('cephfs');
  });

  it('should be possible to add an app', () => {
    cephPoolProperties.addApplication('rgw');
    cephPoolProperties.submitForm(name);
    expect(element(by.binding('selection.item.showApps')).getText()).toBe('cephfs, rgw');
    editPool();
    cephPoolProperties.deleteFirstApp();
    cephPoolProperties.deleteFirstApp();
    cephPoolProperties.addApplication('cephfs');
    cephPoolProperties.submitForm(name);
    editPool();
  });

  it('should show no dialog if nothing is edited', () => {
    helpers.setLocation('ceph/pools', false);
    editPool();
  });

  it('should show a dialog if something is edited', () => {
    cephPoolProperties.addApplication(1);
    helpers.setLocation('ceph/pools', true);
    editPool();
  });

  afterAll(function(){
    helpers.setLocation('ceph/pools');
    cephPoolProperties.deletePool(name);
    console.log('ceph_pool_edit -> ceph_pool_edit.e2e.js');
  });
});
