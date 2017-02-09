'use strict';

(function(){
  module.exports = {
    /*
     * Use this function to run different tests on graphs that were created by the use of the graph creation component.
     * It will run the following tests with help of the given configuration:
     *  - Count all graphs.
     *  - Compare the graph positions of each graph.
     *  - Compare the graph title of each graph.
     *  - Compare all attributes used in a graph.
     *
     * @param {Object[]} graphsConfig - looks like this:
     *  [
     *   {
     *    name: 'Name of the graph',
     *    attributes: ['used', 'api_attribute_2']
     *   },
     *   ...
     *  ]
     */
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
