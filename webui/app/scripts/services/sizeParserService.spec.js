const angular = require('angular');
require('angular-mocks');

require('../../app');

describe('sizeParserService', function() {

  beforeEach(angular.mock.module("openattic"));
  beforeEach(angular.mock.inject(function(_SizeParserService_){
    sizeParserService = _SizeParserService_;
  }));

  it('should convert from B', function() {
    expect(sizeParserService.parseInt("1B", "b")).toBe(1);
    expect(sizeParserService.parseInt("1.5 B", "b")).toBe(1);
    expect(sizeParserService.parseInt("2BiB", "b")).toBe(2);
  });

  it('should convert from KiB', function() {
    expect(sizeParserService.parseInt("1K", "b")).toBe(1024);
    expect(sizeParserService.parseInt("1.2 K", "b")).toBe(1228);
    expect(sizeParserService.parseInt("1.3 KiB", "b")).toBe(1331);
    expect(sizeParserService.parseInt("1.5 kib", "b")).toBe(1536);
    expect(sizeParserService.parseInt("2KIB", "b")).toBe(2048);
  });

  it('should convert from MiB', function() {
    expect(sizeParserService.parseInt("1.5M", "b")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5M", "k")).toBe(1.5*1024);
  });

  it('should convert from GiB', function() {
    expect(sizeParserService.parseInt("1.5G", "b")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5G", "k")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5G", "m")).toBe(1.5*1024);
  });

  it('should convert from TiB', function() {
    expect(sizeParserService.parseInt("1.5T", "b")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5T", "k")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5T", "m")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5T", "g")).toBe(1.5*1024);
  });

  it('should convert from PiB', function() {
    expect(sizeParserService.parseInt("1.5P", "b")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5P", "k")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5P", "m")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5P", "g")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5P", "t")).toBe(1.5*1024);
  });

  it('should convert from EiB', function() {
    expect(sizeParserService.parseInt("1.5E", "b")).toBe(1.5*1024**6);
    expect(sizeParserService.parseInt("1.5E", "k")).toBe(1.5*1024**5);
    expect(sizeParserService.parseInt("1.5E", "m")).toBe(1.5*1024**4);
    expect(sizeParserService.parseInt("1.5E", "g")).toBe(1.5*1024**3);
    expect(sizeParserService.parseInt("1.5E", "t")).toBe(1.5*1024**2);
    expect(sizeParserService.parseInt("1.5E", "p")).toBe(1.5*1024);
  });
});
