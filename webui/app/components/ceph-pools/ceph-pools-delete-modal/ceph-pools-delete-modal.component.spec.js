describe("ceph-pools-delete", () => {
  let ctrl;
  let scope;
  let deletionTemplate;
  let currentTemplate;
  let $compile;
  let $componentController;
  let $rootScope;

  const getFakePoolData = (id) => ({
    num_bytes: Math.pow(1024, id % 10),
    cluster: "some-cluster-id",
    id: id,
    name: "pool" + id
  });

  const updateTemplate = () => {
    currentTemplate = $compile(angular.element("<div></div>").html(deletionTemplate))(scope);
    scope.$digest();
  };

  beforeEach(angular.mock.module("openattic", "openattic.cephPools"));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get("$rootScope");
    $componentController = $injector.get("$componentController");
    $compile = $injector.get("$compile");
  }));

  beforeEach(() => {
    deletionTemplate = require("./ceph-pools-delete-modal.component.html");
    scope = $rootScope.$new();
    ctrl = $componentController("cephPoolsDeleteModal", {$scope: scope}, {});
  });

  describe("one pool", () => {
    beforeEach(() => {
      ctrl.cephPools = [
        getFakePoolData(1)
      ];
      updateTemplate();
    });

    it("should have pool name in first paragraph", () => {
      expect(currentTemplate.find("p").first().text()).toMatch("You are about to delete the Ceph pool pool1.");
    });

    it("should have no list elements", () => {
      expect(currentTemplate.find("li").length).toBe(0);
    });
  });

  describe("multiple pools", () => {
    beforeEach(() => {
      ctrl.cephPools = [
        getFakePoolData(1),
        getFakePoolData(2),
        getFakePoolData(3)
      ];
      updateTemplate();
    });

    it("should have multiple pools text as first paragraph", () => {
      expect(currentTemplate.find("p").first().text()).toMatch("You are about to delete multiple Ceph pools.");
    });

    it("should have 3 li elements shown", () => {
      expect(currentTemplate.find("li").length).toBe(3);
    });

    it("should have the syntax 'poolName (bytes)' for multiple pools", () => {
      const list = currentTemplate.find("li");
      list.each(i => {
        expect($(list[i]).text()).toMatch(/pool[1-3] \(1.00 [KMG]iB\)/);
      });
    });
  });
});
