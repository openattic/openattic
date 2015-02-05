"use strict";

bmApp.provider('BookDataService', function () {
    var baseUrl;

    this.setBaseUrl = function (url) {
        baseUrl = url;
    };

    this.$get = function ($http) {
        var srv = {};

        // Service implementation
        srv.getBookByIsbn = function (isbn) {
            return $http.get(baseUrl + '/api/books/' + isbn);
        };

        srv.getBooks = function () {
            return $http.get(baseUrl + '/api/books');
        };

        srv.getTags = function () {
            return $http.get(baseUrl + '/api/tags');
        };

        srv.storeBook = function (book) {
            return $http.post(baseUrl + '/api/books', book);
        };

        srv.updateBook = function (book) {
            return $http.put(baseUrl + '/api/books/' + book.isbn, book);
        };

        srv.deleteBookByIsbn = function (isbn) {
            return $http.delete(baseUrl + '/api/books/' + isbn);
        };

        // Public API
        return {
            getBookByIsbn: function (isbn) {
                return srv.getBookByIsbn(isbn);
            },
            getBooks: function () {
                return srv.getBooks();
            },
            getTags: function () {
                return srv.getTags();
            },
            storeBook: function (book) {
                return srv.storeBook(book);
            },
            updateBook: function (book) {
                return srv.updateBook(book);
            },
            deleteBookByIsbn: function (isbn) {
                return srv.deleteBookByIsbn(isbn);
            }
        };
    }
});