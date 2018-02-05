describe("hostnameValidator", () => {
  let $scope;
  let form;
  const validHostnames = [
    "172.15.3.10",
    "fce:9af7:a667:7286:4917:b8d3:34df:8373",
    "localhost",
    "foo.bar.com",
    "wks1.verwaltung.example.com",
    "3abc.example.net"
  ];
  const invalidHostnames = [
    "369.15.50.14",
    "172.15.3.280",
    "172.15.3.a",
    "xce:9af7:a667:7286:4917:b8d3:34df:8373",
    "foo+",
    "#foo.bar.com",
    "_http._sctp.www.example.com"
  ];

  beforeEach(angular.mock.module("openattic.shared"));
  beforeEach(angular.mock.inject(($compile, $rootScope) => {
    $scope = $rootScope.$new();
    $compile(`
      <form name="form">
        <input ng-model="hostname" name="hostname" hostname-validator>
      </form>
    `)($scope);
    form = $scope.form;
  }));

  validHostnames.forEach((hostname) => {
    it("should check if hostname '${hostname}' is valid", () => {
      form.hostname.$setViewValue(hostname);
      expect($scope.hostname).toEqual(hostname);
      expect(form.hostname.$valid).toBe(true);
    });
  });

  invalidHostnames.forEach((hostname) => {
    it("should check if hostname '${hostname}' is invalid", () => {
      form.hostname.$setViewValue(hostname);
      expect($scope.hostname).toBeUndefined();
      expect(form.hostname.$valid).toBe(false);
    });
  });
});
