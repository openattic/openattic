describe("sizeParserService", () => {

  beforeEach(angular.mock.module("openattic"));
  beforeEach(angular.mock.inject((_SizeParserService_) => {
    sizeParserService = _SizeParserService_;
  }));

  it("should convert from B", () => {
    expect(sizeParserService.parseInt("1B", "b")).toBe(1);
    expect(sizeParserService.parseInt("1.5 B", "b")).toBe(1);
    expect(sizeParserService.parseInt("2BiB", "b")).toBe(2);
  });

  it("should convert from KiB", () => {
    expect(sizeParserService.parseInt("1K", "b")).toBe(1024);
    expect(sizeParserService.parseInt("1.2 K", "b")).toBe(1228);
    expect(sizeParserService.parseInt("1.3 KiB", "b")).toBe(1331);
    expect(sizeParserService.parseInt("1.5 kib", "b")).toBe(1536);
    expect(sizeParserService.parseInt("2KIB", "b")).toBe(2048);
  });

  it("should convert from MiB", () => {
    expect(sizeParserService.parseInt("1.5M", "b")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5M", "k")).toBe(1.5*1024);
  });

  it("should convert from GiB", () => {
    expect(sizeParserService.parseInt("1.5G", "b")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5G", "k")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5G", "m")).toBe(1.5*1024);
  });

  it("should convert from TiB", () => {
    expect(sizeParserService.parseInt("1.5T", "b")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5T", "k")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5T", "m")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5T", "g")).toBe(1.5*1024);
  });

  it("should convert from PiB", () => {
    expect(sizeParserService.parseInt("1.5P", "b")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5P", "k")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5P", "m")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5P", "g")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5P", "t")).toBe(1.5*1024);
  });

  it("should convert from EiB", () => {
    expect(sizeParserService.parseInt("1.5E", "b")).toBe(1.5*1024**6);
    expect(sizeParserService.parseInt("1.5E", "k")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5E", "m")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5E", "g")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5E", "t")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5E", "p")).toBe(1.5*1024);
  });

  // parseInt will fail with large number bigger than 1e21 because of the exponential notation,
  // which will be removed through the native parseInt call in parseInt.
  it("should convert from ZiB", () => {
    expect(sizeParserService.parseFloat("1.5Z", "b")).toBe(1.5*1024**7);
    expect(sizeParserService.parseInt("1.5Z", "k")).toBe(1.5*1024**6);
    expect(sizeParserService.parseInt("1.5Z", "m")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5Z", "g")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5Z", "t")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5Z", "p")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5Z", "e")).toBe(1.5*1024);
  });

  it("should convert from YiB", () => {
    expect(sizeParserService.parseFloat("1.5Y", "b")).toBe(1.5*1024**8);
    expect(sizeParserService.parseFloat("1.5Y", "k")).toBe(1.5*1024**7);
    expect(sizeParserService.parseInt("1.5Y", "m")).toBe(1.5*1024**6);
    expect(sizeParserService.parseInt("1.5Y", "g")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5Y", "t")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5Y", "p")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5Y", "e")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5Y", "z")).toBe(1.5*1024);
  });
});
