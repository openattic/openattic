describe("cephRgwBucketNameValidate", function () {
  let $scope;
  let form;

  beforeEach(angular.mock.module("ui.router"));
  beforeEach(angular.mock.module("openattic.cephRgw"));
  beforeEach(angular.mock.inject(function ($compile, $rootScope) {
    $scope = $rootScope.$new();
    $compile(`
      <form name="form">
        <input ng-model="bucket" name="bucket" ceph-rgw-bucket-name-validate>
      </form>
    `)($scope);
    form = $scope.form;
  }));

  it("should check if bucket name is valid", function () {
    form.bucket.$setViewValue("asd");
    expect($scope.bucket).toEqual("asd");
    expect(form.bucket.$valid).toBe(true);

    form.bucket.$setViewValue("asd-asd");
    expect($scope.bucket).toEqual("asd-asd");
    expect(form.bucket.$valid).toBe(true);

    form.bucket.$setViewValue("asd.asd.");
    expect($scope.bucket).toEqual("asd.asd.");
    expect(form.bucket.$valid).toBe(true);

    form.bucket.$setViewValue("asd_asd.");
    expect($scope.bucket).toEqual("asd_asd.");
    expect(form.bucket.$valid).toBe(true);
  });

  it("should check if bucket name is invalid", function () {
    form.bucket.$setViewValue(".asd");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);

    form.bucket.$setViewValue("-asd");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);

    form.bucket.$setViewValue("_asd");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);

    form.bucket.$setViewValue("a");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);

    form.bucket.$setViewValue("a s d");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);

    form.bucket.$setViewValue("a's;d");
    expect($scope.bucket).toBeUndefined();
    expect(form.bucket.$valid).toBe(false);
  });
});
