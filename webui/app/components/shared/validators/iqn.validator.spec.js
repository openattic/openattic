describe("iqnValidator", () => {
  let $scope;
  let form;

  beforeEach(angular.mock.module("openattic.shared"));
  beforeEach(angular.mock.inject(($compile, $rootScope) => {
    $scope = $rootScope.$new();
    $compile(`
      <form name="form">
        <input ng-model="iqn" name="iqn" valid-iqn>
      </form>
    `)($scope);
    form = $scope.form;
  }));

  it("should check if iqn is valid", () => {
    form.iqn.$setViewValue("iqn.1996-10.com.suse:sn-a8675309");
    expect($scope.iqn).toEqual("iqn.1996-10.com.suse:sn-a8675309");
    expect(form.iqn.$valid).toBe(true);
  });

  it("should check if iqn is invalid", () => {
    form.iqn.$setViewValue("...");
    expect($scope.iqn).toBeUndefined();
    expect(form.iqn.$valid).toBe(false);
  });
});
