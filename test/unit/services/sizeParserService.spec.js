'use strict';

describe('Service: sizeParserService', function () {

  var SizeParserService = null;

  beforeEach(module('openattic'));
  beforeEach(inject(function(_SizeParserService_){
    SizeParserService = _SizeParserService_;
  }));

  it("should parse normal ints", function(){
    expect(SizeParserService.parseInt(   "0")).toBe(0);
    expect(SizeParserService.parseInt(   "1")).toBe(1);
    expect(SizeParserService.parseInt(   "2")).toBe(2);
    expect(SizeParserService.parseInt(   "3")).toBe(3);
    expect(SizeParserService.parseInt(  "10")).toBe(10);
    expect(SizeParserService.parseInt("1000")).toBe(1000);
  });

  it("should parse ints followed by a size modifier", function(){
    expect(SizeParserService.parseInt( "0G" )).toBe(0);
    expect(SizeParserService.parseInt("10G" )).toBe(10 * 1024);
    expect(SizeParserService.parseInt("15T" )).toBe(15 * 1024 * 1024);
    expect(SizeParserService.parseInt("30TB")).toBe(30 * 1024 * 1024);
  });

  it("should parse floats followed by a size modifier to int", function(){
    expect(SizeParserService.parseInt(  "0G")).toBe(0);
    expect(SizeParserService.parseInt("1.2" )).toBe(1);
    expect(SizeParserService.parseInt("1.0G")).toBe(parseInt(1.0 * 1024,        10));
    expect(SizeParserService.parseInt("1.5T")).toBe(parseInt(1.5 * 1024 * 1024, 10));
  });

  it("should return null for invalid values", function(){
    expect(SizeParserService.parseInt(   "0x10")).toBeNull();
    expect(SizeParserService.parseInt(   "0b15")).toBeNull();
    expect(SizeParserService.parseInt(   "10ZB")).toBeNull();
    expect(SizeParserService.parseInt(   "10 G")).toBeNull();
    expect(SizeParserService.parseInt(    "10k")).toBeNull();
    expect(SizeParserService.parseInt("10Bytes")).toBeNull();
  });

  it("should accept valid values", function(){
    expect(SizeParserService.isValid(   "0")).toBe(true);
    expect(SizeParserService.isValid(   "1")).toBe(true);
    expect(SizeParserService.isValid("1000")).toBe(true);
    expect(SizeParserService.isValid( "1.2")).toBe(true);
    expect(SizeParserService.isValid("1.0G")).toBe(true);
    expect(SizeParserService.isValid("30TB")).toBe(true);
  });

  it("should reject invalid values", function(){
    expect(SizeParserService.isValid(   "0x10")).toBe(false);
    expect(SizeParserService.isValid(   "0b15")).toBe(false);
    expect(SizeParserService.isValid(   "10ZB")).toBe(false);
    expect(SizeParserService.isValid(   "10 G")).toBe(false);
    expect(SizeParserService.isValid(    "10k")).toBe(false);
    expect(SizeParserService.isValid("10Bytes")).toBe(false);
  });

});

// kate: space-indent on; indent-width 2; replace-tabs on;
