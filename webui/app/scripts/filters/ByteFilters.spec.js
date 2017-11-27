describe("byteFilter", () => {
  let $filter;
  beforeEach(angular.mock.module("openattic"));
  beforeEach(angular.mock.inject(_$filter_ => {
    $filter = _$filter_;
  }));

  it("should convert bytes into human readable formats", () => {
    expect($filter("bytes")(Math.pow(1024, 0))).toBe("1.00 B");
    expect($filter("bytes")(Math.pow(1024, 1))).toBe("1.00 KiB");
    expect($filter("bytes")(Math.pow(1024, 2))).toBe("1.00 MiB");
    expect($filter("bytes")(Math.pow(1024, 3))).toBe("1.00 GiB");
    expect($filter("bytes")(Math.pow(1024, 4))).toBe("1.00 TiB");
    expect($filter("bytes")(Math.pow(1024, 5))).toBe("1.00 PiB");
    expect($filter("bytes")(Math.pow(1024, 6))).toBe("1.00 EiB");
    expect($filter("bytes")(Math.pow(1024, 7))).toBe("1.00 ZiB");
    expect($filter("bytes")(Math.pow(1024, 8))).toBe("1.00 YiB");
    expect($filter("bytes")(Math.pow(1024, 9))).toBe("1024.00 YiB");
  });

  it("should use a defined input unit as number", () => {
    expect($filter("bytes")(1, 0)).toBe("1.00 B");
    expect($filter("bytes")(1, 1)).toBe("1.00 KiB");
    expect($filter("bytes")(1, 2)).toBe("1.00 MiB");
    expect($filter("bytes")(1, 3)).toBe("1.00 GiB");
    expect($filter("bytes")(1, 4)).toBe("1.00 TiB");
    expect($filter("bytes")(1, 5)).toBe("1.00 PiB");
    expect($filter("bytes")(1, 6)).toBe("1.00 EiB");
    expect($filter("bytes")(1, 7)).toBe("1.00 ZiB");
    expect($filter("bytes")(1, 8)).toBe("1.00 YiB");
    expect($filter("bytes")(1, 9)).toBe("1024.00 YiB");
  });

  it("should use a defined input unit as string", () => {
    expect($filter("bytes")(1, "B")).toBe("1.00 B");
    expect($filter("bytes")(1, "KiB")).toBe("1.00 KiB");
    expect($filter("bytes")(1, "MiB")).toBe("1.00 MiB");
    expect($filter("bytes")(1, "GiB")).toBe("1.00 GiB");
    expect($filter("bytes")(1, "TiB")).toBe("1.00 TiB");
    expect($filter("bytes")(1, "PiB")).toBe("1.00 PiB");
    expect($filter("bytes")(1, "EiB")).toBe("1.00 EiB");
    expect($filter("bytes")(1, "ZiB")).toBe("1.00 ZiB");
    expect($filter("bytes")(1, "YiB")).toBe("1.00 YiB");
  });

  it("should use a defined precision", () => {
    expect($filter("bytes")(1.456456, 3, 0)).toBe("1 GiB");
    expect($filter("bytes")(1.456456, 3, 1)).toBe("1.5 GiB");
    expect($filter("bytes")(1.456456, 3, 2)).toBe("1.46 GiB");
    expect($filter("bytes")(1.456456, 3, 3)).toBe("1.456 GiB");
    expect($filter("bytes")(1.456456, 3, 4)).toBe("1.4565 GiB");
    expect($filter("bytes")(1.456456, 3, 5)).toBe("1.45646 GiB");
    expect($filter("bytes")(1.456456, 3, 6)).toBe("1.456456 GiB");
    expect($filter("bytes")(1.456456, 3, 7)).toBe("1.4564560 GiB");
  });

  it("should have a defined output unit", () => {
    expect($filter("bytes")(1, 0, 5, 1)).toBe("0.00098 KiB");
    expect($filter("bytes")(1, 1, 0, 0)).toBe("1024 B");
    expect($filter("bytes")(1, 2, 0, 1)).toBe("1024 KiB");
    expect($filter("bytes")(1, 3, 0, 2)).toBe("1024 MiB");
    expect($filter("bytes")(1, 4, 0, 3)).toBe("1024 GiB");
    expect($filter("bytes")(1, 5, 0, 4)).toBe("1024 TiB");
    expect($filter("bytes")(1, 6, 0, 5)).toBe("1024 PiB");
    expect($filter("bytes")(1, 7, 0, 6)).toBe("1024 EiB");
    expect($filter("bytes")(1, 8, 0, 7)).toBe("1024 ZiB");
    expect($filter("bytes")(1, 9, 0, 9)).toBe("1 undefined"); // Because the unit not in the list
  });

  it("should have no unit appended", () => {
    expect($filter("bytes")(1, 3, 0, 2, false)).toBe("1024");
    expect($filter("bytes")(1.456456, 3, 7, undefined, false)).toBe("1.4564560");
    expect($filter("bytes")(1, 0, 5, 1, false)).toBe("0.00098");
    expect($filter("bytes")(2, 4, 0, 2, false)).toBe("2097152");
  });
});
