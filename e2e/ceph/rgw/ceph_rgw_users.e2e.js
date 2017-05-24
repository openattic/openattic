'use strict';

var helpers = require('../../common.js');
var CephRgwCommons = require('./cephRgwCommon.js');

describe('ceph rgw', function(){
  var cephRgwCommons = new CephRgwCommons();
  var testUser1 = {
    user_id: 'herpderp',
    display_name: 'Herp Derp',
    email: 'herp.derp@openattic.org',
    max_buckets: 1234
  };
  var testUser2 = {
    user_id: 'tuxdoe',
    display_name: 'Tux Doe',
    email: 'tux.doe@openattic.org',
    max_buckets: 2,
    access_key: 'abcdefghij',
    secret_key: '0123456789'
  };

  beforeAll(function(){
    helpers.login();
    browser.setLocation('ceph/rgw/users');
  });

  it('should create user "herpderp"', function(){
    cephRgwCommons.addBtn.click();
    browser.sleep(400);
    element(by.model('user.user_id')).sendKeys(testUser1.user_id);
    browser.sleep(400);
    element(by.model('user.display_name')).sendKeys(testUser1.display_name);
    browser.sleep(400);
    element(by.model('user.email')).sendKeys(testUser1.email);
    browser.sleep(400);
    element(by.model('user.max_buckets')).sendKeys(testUser1.max_buckets);
    browser.sleep(400);
    element(by.model('user.suspended')).click();
    browser.sleep(400);
    element(by.model('user.generate_key')).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should display the "herpderp" in the users panel', function(){
    expect(element(by.cssContainingText('tr', testUser1.user_id)).isDisplayed()).toBe(true);
  });

  it('should check the user ID already taken error message', function(){
    cephRgwCommons.addBtn.click();
    browser.sleep(400);
    element(by.model('user.user_id')).sendKeys(testUser1.user_id);
    expect(element(by.css('.tc_userIdNotUnique')).isDisplayed()).toBe(true);
    element(by.css('.tc_backButton')).click();
  });

  it('should delete the user "herpderp"', function(){
    element(by.cssContainingText('tr', testUser1.user_id)).click();
    helpers.delete_selection(0, '$ctrl');
    expect(element(by.cssContainingText('tr', testUser1.user_id)).isPresent()).toBe(false);
  });

  it('should create user "tuxdoe"', function(){
    cephRgwCommons.addBtn.click();
    browser.sleep(400);
    element(by.model('user.user_id')).sendKeys(testUser2.user_id);
    browser.sleep(400);
    element(by.model('user.display_name')).sendKeys(testUser2.display_name);
    browser.sleep(400);
    element(by.model('user.email')).sendKeys(testUser2.email);
    browser.sleep(400);
    element(by.model('user.max_buckets')).sendKeys(testUser2.max_buckets);
    browser.sleep(400);
    element(by.model('user.access_key')).sendKeys(testUser2.access_key);
    browser.sleep(400);
    element(by.model('user.secret_key')).sendKeys(testUser2.secret_key);
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should display the "tuxdoe" in the users panel', function(){
    expect(element(by.cssContainingText('tr', testUser2.user_id)).isDisplayed()).toBe(true);
  });

  it('should modify the user "tuxdoe"', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    var el = element(by.model('user.display_name'));
    el.clear();
    el.sendKeys('Tux Doe Jr.');
    browser.sleep(400);
    el = element(by.model('user.max_buckets'));
    el.clear();
    el.sendKeys('4321');
    browser.sleep(400);
    element(by.model('user.suspended')).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should validate the user modifications', function() {
    var user = element(by.cssContainingText('tr', testUser2.user_id));
    expect(user.element(by.binding('row.display_name')).getText()).toEqual('Tux Doe Jr.');
    expect(user.element(by.binding('row.max_buckets')).getText()).toEqual('4321');
  });

  it('should add a new subuser', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    cephRgwCommons.addSubuserBtn.click();
    browser.sleep(400);
    element(by.model('subuser.subuser')).sendKeys("swift");
    browser.sleep(400);
    element(by.model('subuser.permissions')).element(by.cssContainingText('option', 'read')).click();
    browser.sleep(400);
    element(by.model('subuser.generate_secret')).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should check the subuser ID already taken error message', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    cephRgwCommons.addSubuserBtn.click();
    browser.sleep(400);
    element(by.model('subuser.subuser')).sendKeys("swift");
    browser.sleep(400);
    expect(element(by.css('.tc_subuserNotUnique')).isDisplayed()).toBe(true);
    element(by.css('.tc_cancelButton')).click();
    browser.sleep(400);
    element(by.css('.tc_backButton')).click();
  });

  it('should add a new S3 keys', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    // Add key for the user.
    cephRgwCommons.addS3KeyBtn.click();
    browser.sleep(400);
    element(by.model('key.user')).element(by.cssContainingText('option',
      testUser2.user_id)).click();
    browser.sleep(400);
    element(by.model('key.access_key')).sendKeys('xyz123');
    browser.sleep(400);
    element(by.model('key.secret_key')).sendKeys('thisismysecret');
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
    // Add key for the subuser.
    cephRgwCommons.addS3KeyBtn.click();
    browser.sleep(400);
    element(by.model('key.user')).element(by.cssContainingText('option',
      testUser2.user_id + ":swift")).click();
    browser.sleep(400);
    // This fails because of a bug in the RGW Admin Ops REST interface.
    // element(by.model('key.generate_key')).click();
    element(by.model('key.access_key')).sendKeys('aaaaaaaaaaaaaa');
    browser.sleep(400);
    element(by.model('key.secret_key')).sendKeys('xxxxxxxxxxxxxx');
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should add a new capability', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    // Add 'users:*' capability.
    cephRgwCommons.addCapBtn.click();
    browser.sleep(400);
    element(by.model('cap.type')).element(by.cssContainingText('option', 'users')).click();
    browser.sleep(400);
    element(by.model('cap.perm')).element(by.cssContainingText('option', '*')).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
    // Add 'metadata:write' capability.
    cephRgwCommons.addCapBtn.click();
    browser.sleep(400);
    element(by.model('cap.type')).element(by.cssContainingText('option', 'metadata')).click();
    browser.sleep(400);
    element(by.model('cap.perm')).element(by.cssContainingText('option', 'write')).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should delete all S3 keys', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    // Delete all keys.
    element.all(by.css('.tc_deleteS3KeyButton')).count().then(function(count) {
      for (; count > 0; count--) {
        // Always use the first element to delete because after pressing the
        // delete button the view is rendered again.
        element.all(by.css('.tc_deleteS3KeyButton')).get(0).click();
        browser.sleep(400);
      }
    });
    cephRgwCommons.submitBtn.click();
  });

  it('should delete a subuser', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    element.all(by.css('.tc_deleteSubuserButton')).get(0).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should delete a capability', function(){
    cephRgwCommons.editUser(testUser2.user_id);
    element.all(by.css('.tc_deleteCapButton')).get(0).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should delete the user "tuxdoe"', function(){
    element(by.cssContainingText('tr', testUser2.user_id)).click();
    helpers.delete_selection(0, '$ctrl');
    expect(element(by.cssContainingText('tr', testUser2.user_id)).isPresent()).toBe(false);
  });

  afterAll(function(){
    console.log('ceph_rgw -> ceph_rgw_users.e2e.js');
  });
});
