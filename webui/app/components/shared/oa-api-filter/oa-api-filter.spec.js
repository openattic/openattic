describe("oaApiFilter", () => {

  let oaApiFilter;
  let userNames = ["test01", "test02", "clarafoo", "larabar", "xyz01",
    "xyz02", "xyz03", "xyz04", "xyz05", "xyz06", "xyz07", "xyz08",
    "xyz09", "xyz10", "xyz11", "xyz12"];
  let users = [{
    "id": "test01",
    "name": "Hugo Test"
  },{
    "id": "test02",
    "name": "Angelika Test"
  },{
    "id": "test03",
    "name": "Klaus Test"
  },{
    "id": "test04",
    "name": "Hubert Test"
  },{
    "id": "clarafoo",
    "name": "Clara Foo"
  },{
    "id": "larabar",
    "name": "Lara Bar"
  }];

  beforeEach(angular.mock.module("openattic.shared"));
  beforeEach(angular.mock.inject((_oaApiFilter_) => {
    oaApiFilter = _oaApiFilter_;
  }));

  it("should filter items [1]", () => {
    let result = oaApiFilter.filter(userNames, {
      page: 0,
      entries: undefined,
      search: "test",
      sortfield: "",
      sortorder: "ASC"
    });
    expect(result.count).toBe(2);
    expect(result.results.length).toBe(2);
    expect(result.results[0]).toEqual("test01");
    expect(result.results[1]).toEqual("test02");
  });

  it("should filter items [2]", () => {
    let result = oaApiFilter.filter(userNames, {
      page: 1,
      entries: 10,
      search: "xyz",
      sortfield: "",
      sortorder: "ASC"
    });
    expect(result.count).toBe(12);
    expect(result.results.length).toBe(2);
    expect(result.results[0]).toEqual("xyz11");
    expect(result.results[1]).toEqual("xyz12");
  });

  it("should filter items [3]", () => {
    let result = oaApiFilter.filter(userNames, {
      page: 2,
      entries: 3,
      search: "xyz",
      sortfield: "",
      sortorder: "DESC"
    });
    expect(result.count).toBe(12);
    expect(result.results.length).toBe(3);
    expect(result.results[0]).toEqual("xyz06");
    expect(result.results[1]).toEqual("xyz05");
    expect(result.results[2]).toEqual("xyz04");
  });

  it("should filter items [4]", () => {
    let result = oaApiFilter.filter(users, {
      page: 0,
      entries: 3,
      search: "test",
      sortfield: "id",
      sortorder: "DESC"
    });
    expect(result.count).toBe(4);
    expect(result.results.length).toBe(3);
    expect(result.results[0].id).toEqual("test04");
    expect(result.results[1].id).toEqual("test03");
    expect(result.results[2].id).toEqual("test02");
  });
});
