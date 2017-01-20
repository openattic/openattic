'use strict';

(function(){
  module.exports = {
    testGraphs: function(graphsConfig){
      var graphs = element.all(by.repeater('graph in $ctrl.config.graphs'));

      it('should count all graphs and expect to find ' + graphsConfig.length, function(){
        expect(graphs.count()).toBe(graphsConfig.length);
      });

      graphsConfig.forEach(function(graphConfig, i){
        var graphName = graphConfig.name;
        var graphAttr = graphConfig.attributes;
        it('should check the name of the graph at positon ' + i + ' to be ' + graphName, function(){
          expect(graphs.get(i).element(by.binding('graph.name')).getText()).toBe(graphName);
        });
        it('should check all attributes of the graph at positon ' + i + ' to be ' + graphAttr, function(){
          graphs.get(i).all(by.className('nv-legend-text')).each(function(attr, j){
            expect(attr.getText()).toBe(graphAttr[j]);
          });
        });
      });
    }
  };
}());
