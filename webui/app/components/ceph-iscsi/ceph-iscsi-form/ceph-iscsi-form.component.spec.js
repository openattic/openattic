describe("ceph-iscsi-form", () => {
  let ctrl;
  let scope;
  let formTemplate;
  let currentTemplate;
  let $compile;
  let $componentController;
  let $rootScope;

  const updateTemplate = () => {
    currentTemplate = $compile(angular.element("<div></div>").html(formTemplate))(scope);
    scope.$digest();
  };

  const getText = (css) => {
    updateTemplate();
    return currentTemplate.find(css).first().text().trim();
  };

  const expectPanelTitle = (title) => {
    expect(getText(".tc_panelTitle")).toBe(title);
  };

  beforeEach(angular.mock.module("openattic", "openattic.cephPools"));

  beforeEach(angular.mock.inject(($injector) => {
    $rootScope = $injector.get("$rootScope");
    $componentController = $injector.get("$componentController");
    $compile = $injector.get("$compile");
  }));

  beforeEach(() => {
    formTemplate = require("./ceph-iscsi-form.component.html");
    scope = $rootScope.$new();
    ctrl = $componentController("cephIscsiForm", {$scope: scope}, {});
  });

  it("should change panel title on target id input change", () => {
    ctrl.formDataIsReady = true;
    ctrl.allImages.push({});
    expectPanelTitle("Target IQN:");
    ctrl.model.targetId = "test-iqn";
    expectPanelTitle("Target IQN: test-iqn");
  });
});
