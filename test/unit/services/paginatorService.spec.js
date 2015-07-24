'use strict';

describe('Service: paginatorService', function () {

    var paginatorService;

    beforeEach(module('openattic.datatable'));

    beforeEach(inject(function(_paginatorService_){
        paginatorService = _paginatorService_;
    }));

    it('should provide a method getNumbers()', function(){
        expect(typeof paginatorService.getNumbers).toBe('function');
    });


    describe('getNumbers()-Method', function(){

        it('should return an array', function(){
            expect(paginatorService.getNumbers(1,2,3) instanceof Array).toBe(true);
        });

        it('should throw an error when calling with less or more then three args', function(){
            expect(function(){
                paginatorService.getNumbers();
            }).toThrow();

            expect(function(){
                paginatorService.getNumbers(1);
            }).toThrow();

            expect(function(){
                paginatorService.getNumbers(1,2,3);
            }).not.toThrow();
        });

        it('should return an array of correct numbers when 1,1,7', function(){
            expect(paginatorService.getNumbers(0,1,7)).toEqual([0]);
        });


        it('should always return 0 as first', function(){
            expect(paginatorService.getNumbers(4,26,7)[0]).toBe(0);
            expect(paginatorService.getNumbers(13,26,3)[0]).toBe(0);
            expect(paginatorService.getNumbers(9,26,7)[0]).toBe(0);
        });

        it('should always return the max number', function(){
            expect(paginatorService.getNumbers(4,26,7)[6]).toBe(25);
            expect(paginatorService.getNumbers(3,10,3)[2]).toBe(2);
            expect(paginatorService.getNumbers(9,99,7)[6]).toBe(98);
        });

        it('should always return 0 as first', function(){
            expect(paginatorService.getNumbers(4,26,10).length).toBe(10);
            expect(paginatorService.getNumbers(4,260,100).length).toBe(100);
            expect(paginatorService.getNumbers(4,260,99).length).toBe(99);
        });


        it('should return an array of correct numbers when 5,26,7', function(){
            expect(paginatorService.getNumbers(0,4,4)).toEqual([0,1,2,3]);
        });

        it('should return an array of correct numbers when 5,26,7', function(){
            expect(paginatorService.getNumbers(4,26,7)).toEqual([0,'ellipsis',3,4,5,'ellipsis',25]);
        });

    });

});
