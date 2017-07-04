'use strict';

var helpers = require('../../common.js');
var CephRgwCommons = require('./cephRgwCommon.js');

describe('ceph rgw users', function(){
  var cephRgwCommons = new CephRgwCommons();
  var testUser1 = {
    user_id: 'e2e_herpderp',
    display_name: 'Herp Derp',
    email: 'herp.derp@openattic.org',
    max_buckets: 1234
  };
  var testUser2 = {
    user_id: 'e2e_tuxdoe',
    display_name: 'Tux Doe',
    email: 'tux.doe@openattic.org',
    max_buckets: 2,
    access_key: 'abcdefghij',
    secret_key: '0123456789'
  };
  var generateKey = element(by.model('user.generate_key'));
  var userQuotaEnabled = element(by.model('user.user_quota.enabled'));
  var userQuotaMaxSizeUnlimited = element(by.model('user.user_quota.max_size_unlimited'));
  var userQuotaMaxSize = element(by.model('user.user_quota.max_size'));
  var userQuotaMaxObjectsUnlimited = element(by.model('user.user_quota.max_objects_unlimited'));
  var userQuotaMaxObjects = element(by.model('user.user_quota.max_objects'));
  var bucketQuotaEnabled = element(by.model('user.bucket_quota.enabled'));
  var bucketQuotaMaxSizeUnlimited = element(by.model('user.bucket_quota.max_size_unlimited'));
  var bucketQuotaMaxSize = element(by.model('user.bucket_quota.max_size'));
  var bucketQuotaMaxObjectsUnlimited = element(by.model('user.bucket_quota.max_objects_unlimited'));
  var bucketQuotaMaxObjects = element(by.model('user.bucket_quota.max_objects'));

  var addUser = function(){
    cephRgwCommons.addUser();
    expect(browser.getCurrentUrl()).toContain('/ceph/rgw/users/add');
  };

  var editUser = function(uid){
    cephRgwCommons.editUser(uid);
    expect(browser.getCurrentUrl()).toMatch('/ceph/rgw/users/edit/' + uid);
  };

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    element(by.css('.tc_menuitem_ceph_rgw')).click();
    element(by.css('.tc_submenuitem_ceph_rgw_users')).click();
    browser.sleep(helpers.configs.sleep);
  });

  it('should create user "herpderp"', function(){
    addUser();
    element(by.model('user.user_id')).sendKeys(testUser1.user_id);
    element(by.model('user.display_name')).sendKeys(testUser1.display_name);
    element(by.model('user.email')).sendKeys(testUser1.email);
    element(by.model('user.max_buckets')).sendKeys(testUser1.max_buckets);
    element(by.model('user.suspended')).click();
    expect(generateKey.isSelected()).toBe(true);
    // The 'Enabled' checkbox should not be checked.
    expect(userQuotaEnabled.isSelected()).toBe(false);
    // The 'Unlimited size' and 'Unlimited objects' checkboxes and input fields
    // should not be visible.
    expect(userQuotaMaxSizeUnlimited.isDisplayed()).toBe(false);
    expect(userQuotaMaxObjectsUnlimited.isDisplayed()).toBe(false);
    expect(userQuotaMaxSize.isDisplayed()).toBe(false);
    expect(userQuotaMaxObjects.isDisplayed()).toBe(false);
    // Enable user quota.
    userQuotaEnabled.click();
    // The 'Unlimited size' and 'Unlimited objects' checkboxes should be visible
    // and selected. The input fields should be hidden.
    expect(userQuotaMaxSizeUnlimited.isSelected()).toBe(true);
    expect(userQuotaMaxObjectsUnlimited.isSelected()).toBe(true);
    expect(userQuotaMaxSize.isDisplayed()).toBe(false);
    expect(userQuotaMaxObjects.isDisplayed()).toBe(false);
    // Disable 'Unlimited objects'.
    userQuotaMaxObjectsUnlimited.click();
    // The 'Maximum objects' input field should be visible now.
    expect(userQuotaMaxObjects.isDisplayed()).toBe(true);
    userQuotaMaxObjects.clear();
    userQuotaMaxObjects.sendKeys('4815162342');
    // Enable bucket quota.
    bucketQuotaEnabled.click();
    // The 'Unlimited size' and 'Unlimited objects' checkboxes should be visible
    // and selected. The input fields should be hidden.
    expect(bucketQuotaMaxSizeUnlimited.isSelected()).toBe(true);
    expect(bucketQuotaMaxObjectsUnlimited.isSelected()).toBe(true);
    expect(bucketQuotaMaxSize.isDisplayed()).toBe(false);
    expect(bucketQuotaMaxObjects.isDisplayed()).toBe(false);
    // Disable 'Unlimited size'.
    bucketQuotaMaxSizeUnlimited.click();
    // The 'Maximum size' input field should be visible now.
    expect(bucketQuotaMaxSize.isDisplayed()).toBe(true);
    bucketQuotaMaxSize.clear();
    bucketQuotaMaxSize.sendKeys('10 GiB');
    cephRgwCommons.submitBtn.click();
  });

  it('should display the user "herpderp" in the users panel', function(){
    expect(helpers.get_list_element(testUser1.user_id).isDisplayed()).toBe(true);
  });

  it('should display the details of "herpderp"', function(){
    helpers.get_list_element(testUser1.user_id).click();
    expect(browser.getCurrentUrl()).toContain('/ceph/rgw/users/details');
    expect(element(by.cssContainingText('dt', 'Username:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'Full name:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'Email address:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'Suspended:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'Maximum buckets:')).isDisplayed()).toBe(true);
  });

  it('should check if user/bucket quota is set for "herpderp"', function(){
    editUser(testUser1.user_id);
    // Check user quota.
    expect(userQuotaEnabled.isSelected()).toBe(true);
    expect(userQuotaMaxSizeUnlimited.isSelected()).toBe(true);
    expect(userQuotaMaxObjectsUnlimited.isSelected()).toBe(false);
    expect(userQuotaMaxObjects.getAttribute('value')).toEqual('4815162342');
    // Check bucket quota. Note, the size is displayed in Kilobyte.
    expect(bucketQuotaEnabled.isSelected()).toBe(true);
    expect(bucketQuotaMaxSizeUnlimited.isSelected()).toBe(false);
    expect(bucketQuotaMaxSize.getAttribute('value')).toEqual('10485760K');
    expect(bucketQuotaMaxObjectsUnlimited.isSelected()).toBe(true);
    helpers.leaveForm();
  });

  it('should check the user ID already taken error message', function(){
    addUser();
    element(by.model('user.user_id')).sendKeys(testUser1.user_id);
    // Wait some time until the user ID has been validated via REST API call.
    browser.sleep(helpers.configs.sleep);
    expect(element(by.css('.tc_userIdNotUnique')).isDisplayed()).toBe(true);
    helpers.leaveForm(true);
  });

  it('should delete the user "herpderp"', function(){
    element(by.cssContainingText('tr', testUser1.user_id)).click();
    helpers.delete_selection(0, '$ctrl');
    expect(element(by.cssContainingText('tr', testUser1.user_id)).isPresent()).toBe(false);
  });

  it('should create user "tuxdoe"', function(){
    addUser();
    element(by.model('user.user_id')).sendKeys(testUser2.user_id);
    element(by.model('user.display_name')).sendKeys(testUser2.display_name);
    element(by.model('user.email')).sendKeys(testUser2.email);
    element(by.model('user.max_buckets')).sendKeys(testUser2.max_buckets);
    expect(generateKey.isSelected()).toBe(true);
    generateKey.click();
    element(by.model('user.access_key')).sendKeys(testUser2.access_key);
    element(by.model('user.secret_key')).sendKeys(testUser2.secret_key);
    expect(userQuotaEnabled.isSelected()).toBe(false);
    expect(bucketQuotaEnabled.isSelected()).toBe(false);
    cephRgwCommons.submitBtn.click();
  });

  it('should display the user "tuxdoe" in the users panel', function(){
    expect(element(by.cssContainingText('tr', testUser2.user_id)).isDisplayed()).toBe(true);
  });

  it('should modify the user "tuxdoe"', function(){
    editUser(testUser2.user_id);
    var displayName = element(by.model('user.display_name'));
    displayName.clear();
    displayName.sendKeys('Tux Doe Jr.');
    var maxBuckets = element(by.model('user.max_buckets'));
    maxBuckets.clear();
    maxBuckets.sendKeys('4321');
    element(by.model('user.suspended')).click();
    cephRgwCommons.submitBtn.click();
  });

  it('should validate the user modifications', function(){
    var user = element(by.cssContainingText('tr', testUser2.user_id));
    browser.sleep(400);
    expect(user.element(by.binding('row.display_name')).getText()).toEqual('Tux Doe Jr.');
    expect(user.element(by.binding('row.max_buckets')).getText()).toEqual('4321');
  });

  it('should add a new subuser', function(){
    editUser(testUser2.user_id);
    cephRgwCommons.addSubuserBtn.click();
    browser.sleep(400);
    element(by.model('subuser.subuser')).sendKeys('swift');
    element(by.model('subuser.permissions')).all(by.cssContainingText(
      'option', 'read')).first().click();
    expect(element(by.model('subuser.generate_secret')).isSelected()).toBe(true);
    element(by.model('subuser.generate_secret')).click();
    element(by.model('subuser.secret_key')).sendKeys('supersecret');
    cephRgwCommons.submitSubuserBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should check the subuser ID already taken error message', function(){
    editUser(testUser2.user_id);
    cephRgwCommons.addSubuserBtn.click();
    browser.sleep(400);
    element(by.model('subuser.subuser')).sendKeys('swift');
    expect(element(by.css('.tc_subuserNotUnique')).isDisplayed()).toBe(true);
    cephRgwCommons.cancelSubuserBtn.click();
    browser.sleep(400);
    helpers.leaveForm();
  });

  it('should add a new S3 keys', function(){
    editUser(testUser2.user_id);
    // Add key for the user.
    cephRgwCommons.addS3KeyBtn.click();
    browser.sleep(400);
    element(by.model('key.user')).all(by.cssContainingText('option',
      testUser2.user_id)).first().click();
    expect(element(by.model('key.generate_key')).isSelected()).toBe(true);
    element(by.model('key.generate_key')).click();
    element(by.model('key.access_key')).sendKeys('xyz123');
    element(by.model('key.secret_key')).sendKeys('thisismysecret');
    cephRgwCommons.submitS3KeyBtn.click();
    // Add key for the subuser.
    cephRgwCommons.addS3KeyBtn.click();
    browser.sleep(400);
    element(by.model('key.user')).element(by.cssContainingText('option',
      testUser2.user_id + ':swift')).click();
    expect(element(by.model('key.generate_key')).isSelected()).toBe(true);
    element(by.model('key.generate_key')).click();
    element(by.model('key.access_key')).sendKeys('aaaaaaaaaaaaaa');
    element(by.model('key.secret_key')).sendKeys('xxxxxxxxxxxxxx');
    cephRgwCommons.submitS3KeyBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should add a new capability', function(){
    editUser(testUser2.user_id);
    // Add 'users:*' capability.
    cephRgwCommons.addCapBtn.click();
    browser.sleep(400);
    element(by.model('cap.type')).element(by.cssContainingText('option', 'users')).click();
    element(by.model('cap.perm')).element(by.cssContainingText('option', '*')).click();
    cephRgwCommons.submitCapBtn.click();
    // Add 'metadata:write' capability.
    cephRgwCommons.addCapBtn.click();
    browser.sleep(400);
    element(by.model('cap.type')).element(by.cssContainingText('option', 'metadata')).click();
    element(by.model('cap.perm')).element(by.cssContainingText('option', 'write')).click();
    cephRgwCommons.submitCapBtn.click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should not display user quota max. size/objects', function(){
    editUser(testUser2.user_id);
    expect(userQuotaEnabled.isSelected()).toBe(false);
    expect(element(by.model('user.user_quota.max_size')).isDisplayed()).toBe(false);
    expect(element(by.model('user.user_quota.max_objects')).isDisplayed()).toBe(false);
    helpers.leaveForm();
  });

  it('should set user quota', function(){
    editUser(testUser2.user_id);
    userQuotaEnabled.click();
    // Maximum size
    expect(userQuotaMaxSizeUnlimited.isSelected()).toBe(true);
    userQuotaMaxSizeUnlimited.click();
    var maxSize = element(by.model('user.user_quota.max_size'));
    expect(userQuotaMaxSize.isDisplayed()).toBe(true);
    userQuotaMaxSize.clear();
    userQuotaMaxSize.sendKeys('100M');
    // Maximum objects
    expect(userQuotaMaxObjectsUnlimited.isSelected()).toBe(true);
    userQuotaMaxObjectsUnlimited.click();
    var maxObjects = element(by.model('user.user_quota.max_objects'));
    expect(userQuotaMaxObjects.isDisplayed()).toBe(true);
    userQuotaMaxObjects.clear();
    userQuotaMaxObjects.sendKeys('500');
    cephRgwCommons.submitBtn.click();
  });

  it('should not accept incorrect user quota max. size', function(){
    editUser(testUser2.user_id);
    var maxSizeInvalidErrMsg = element(by.css('.tc_invalidUserQuotaMaxSize'));
    var maxSizeRequiredErrMsg = element(by.css('.tc_requiredUserQuotaMaxSize'));
    userQuotaMaxSize.clear();
    userQuotaMaxSize.sendKeys('abc');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxSize.clear();
    userQuotaMaxSize.sendKeys('100');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxSize.clear();
    userQuotaMaxSize.sendKeys('10H');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxSizeUnlimited.click();
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(false);
    expect(maxSizeRequiredErrMsg.isDisplayed()).toBe(false);
    userQuotaMaxSizeUnlimited.click();
    expect(maxSizeRequiredErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxSize.clear();
    userQuotaMaxSize.sendKeys('10K');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(false);
    cephRgwCommons.submitBtn.click();
  });

  it('should not accept incorrect user quota max. objects', function(){
    editUser(testUser2.user_id);
    var maxObjectsInvalidErrMsg = element(by.css('.tc_invalidUserQuotaMaxObjects'));
    var maxObjectsRequiredErrMsg = element(by.css('.tc_requiredUserQuotaMaxObjects'));
    userQuotaMaxObjects.clear();
    userQuotaMaxObjects.sendKeys('xyz'); // Not possible because of number input.
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxObjects.clear();
    userQuotaMaxObjects.sendKeys('-100');
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxObjectsUnlimited.click();
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(false);
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(false);
    userQuotaMaxObjectsUnlimited.click();
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(true);
    userQuotaMaxObjects.clear();
    userQuotaMaxObjects.sendKeys('1234');
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(false);
    cephRgwCommons.submitBtn.click();
  });

  it('should not display bucket quota max. size/objects', function(){
    editUser(testUser2.user_id);
    expect(bucketQuotaEnabled.isSelected()).toBe(false);
    expect(element(by.model('user.bucket_quota.max_size')).isDisplayed()).toBe(false);
    expect(element(by.model('user.bucket_quota.max_objects')).isDisplayed()).toBe(false);
    helpers.leaveForm();
  });

  it('should set bucket quota', function(){
    editUser(testUser2.user_id);
    bucketQuotaEnabled.click();
    // Maximum size
    expect(bucketQuotaMaxSizeUnlimited.isSelected()).toBe(true);
    bucketQuotaMaxSizeUnlimited.click();
    var maxSize = element(by.model('user.bucket_quota.max_size'));
    expect(maxSize.isDisplayed()).toBe(true);
    maxSize.clear();
    maxSize.sendKeys('1G');
    // Maximum objects
    expect(bucketQuotaMaxObjectsUnlimited.isSelected()).toBe(true);
    bucketQuotaMaxObjectsUnlimited.click();
    var maxObjects = element(by.model('user.bucket_quota.max_objects'));
    expect(maxObjects.isDisplayed()).toBe(true);
    maxObjects.clear();
    maxObjects.sendKeys('10000');
    cephRgwCommons.submitBtn.click();
  });

  it('should not accept incorrect bucket quota max. size', function(){
    editUser(testUser2.user_id);
    var maxSize = element(by.model('user.bucket_quota.max_size'));
    var maxSizeInvalidErrMsg = element(by.css('.tc_invalidBucketQuotaMaxSize'));
    var maxSizeRequiredErrMsg = element(by.css('.tc_requiredBucketQuotaMaxSize'));
    maxSize.clear();
    maxSize.sendKeys('xyz');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    maxSize.clear();
    maxSize.sendKeys('1023');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    maxSize.clear();
    maxSize.sendKeys('5L');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(true);
    bucketQuotaMaxSizeUnlimited.click();
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(false);
    expect(maxSizeRequiredErrMsg.isDisplayed()).toBe(false);
    bucketQuotaMaxSizeUnlimited.click();
    expect(maxSizeRequiredErrMsg.isDisplayed()).toBe(true);
    maxSize.clear();
    maxSize.sendKeys('500 mb');
    expect(maxSizeInvalidErrMsg.isDisplayed()).toBe(false);
    cephRgwCommons.submitBtn.click();
  });

  it('should not accept incorrect bucket quota max. objects', function(){
    editUser(testUser2.user_id);
    var maxObjects = element(by.model('user.bucket_quota.max_objects'));
    var maxObjectsInvalidErrMsg = element(by.css('.tc_invalidBucketQuotaMaxObjects'));
    var maxObjectsRequiredErrMsg = element(by.css('.tc_requiredBucketQuotaMaxObjects'));
    maxObjects.clear();
    maxObjects.sendKeys('abc'); // Not possible because of number input.
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(true);
    maxObjects.clear();
    maxObjects.sendKeys('-1');
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(true);
    bucketQuotaMaxObjectsUnlimited.click();
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(false);
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(false);
    bucketQuotaMaxObjectsUnlimited.click();
    expect(maxObjectsRequiredErrMsg.isDisplayed()).toBe(true);
    maxObjects.clear();
    maxObjects.sendKeys('0815');
    expect(maxObjectsInvalidErrMsg.isDisplayed()).toBe(false);
    cephRgwCommons.submitBtn.click();
  });

  it('should delete all S3 keys', function(){
    editUser(testUser2.user_id);
    // Delete all keys.
    element.all(by.css('.tc_deleteS3KeyButton')).count().then(function(count){
      for(; count > 0; count--){
        // Always use the first element to delete because after pressing the
        // delete button the view is rendered again.
        element.all(by.css('.tc_deleteS3KeyButton')).get(0).click();
        browser.sleep(400);
      }
    });
    cephRgwCommons.submitBtn.click();
  });

  it('should delete a subuser', function(){
    editUser(testUser2.user_id);
    element.all(by.css('.tc_deleteSubuserButton')).get(0).click();
    browser.sleep(400);
    cephRgwCommons.submitBtn.click();
  });

  it('should delete a capability', function(){
    editUser(testUser2.user_id);
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
