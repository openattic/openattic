var helpers = require('../../common.js');

describe('Todo Widget', function(){
    beforeEach(function(){
        helpers.login();
    });
    
    it('should have a title', function(){
        expect(element(by.css('.tc_headlinelabel')).getText()).toEqual('Tasks (3)');
    });
    
    it('should have three todo items', function(){
        var list = element.all(by.repeater('todo in todos'));
        expect(list.count()).toBe(3);
    });    
    
    it('should display a checkbox in front of each task', function(){
        var todos = element.all(by.repeater('todo in todos'));
        var todo_length = todos.count();
        expect(element.all(by.css('input[type="checkbox"]')).count()).toEqual(todo_length);    
    });

    it('should display the link behind each task to get started', function(){
        var todos = element.all(by.repeater('todo in todos'));
        var todo_length = todos.count();
        expect(element.all(by.linkText('Start Task')).count()).toEqual(todo_length);
        
    });
    
    it('the first link should lead to the volume-add form', function(){
        var link = element.all(by.css('.tc_link')).get(0);
        link.click();
        browser.sleep(200);
    });
    
    //TODO: test disks- and pools link later on
});