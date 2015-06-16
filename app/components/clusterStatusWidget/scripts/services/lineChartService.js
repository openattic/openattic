'use strict';

/**
 * lineChartService.js
 *
 * @author  Sebastian Krah
 * @version 1.0
 *
 * How to use:
 * - First make sure to set all options you need ("lineChartService.setMaxGraphValues();" needs to be graphData.length on first insert)
 * - Assign your options to your scope
 * - Prepare your Chartdata (timestamp needs to be in ms)
 *      - Width "xaxis.mode = 'time';" you will need an array with the following structure:
 *        [[timestamp, value], [timestamp, value], [timestamp, value], ...]
 *      - otherwise you will need an normal array filled with your values:
 *        [value, value, value, ...]
 * - Finally you need to assign the created dataset to your scope
 * - Optional you can update your chart in certain time intervals by using $timestamp
 *
 * Here is an inline example:
 * <code>
 *     lineChartService.graphOptions.colors = ['#ff0000', '#00ff00', '#0000ff'];
 *     lineChartService.graphOptions.xaxis.mode = 'time';
 *     lineChartService.graphOptions.xaxis.timezone = 'browser';
 *     lineChartService.graphOptions.yaxis.max = 10;
 *     lineChartService.setMaxGraphValues(5);
 *
 *     $scope.lineChartOptions = lineChartService.graphOptions;
 *
 *     var now = new Date().getTime();
 *     var graphData = [[now-25000,1], [now-20000,7], [now-15000,5], [now-10000,9], [now-5000,2]];
 *
 *     $scope.lineChartDataset = lineChartService.getDataset([
 *         {id: 0, label: 'DiscLoad', data: graphData}
 *     ]);
 *
 *     //optional
 *     var updateChart = function() {
 *         graphData = [[new Date().getTime(), Math.round(Math.random()*10)]];
 *         $scope.lineChartDataset = lineChartService.getDataset([
 *             {id: 0, label: 'DiscLoad', data: graphData}
 *         ]);
 *         $timeout(updateChart, 5000); // If you use mode = 'time' make sure that you use an interval matching your timestamps
 *     }
 *     updateChart();
 * </code>
 */

angular.module('openattic.clusterstatuswidget').service('lineChartService', function() {
    // private attributes
    var graphDataset = [];
    var tempGraphDataset = [];
    var maxGraphValues = 200;
    var disableDrawing = false;

    // public attributes
    var graphOptions = this.graphOptions = {
        colors: ['#ff0000','#00ff00','#0000ff','#000000','#00ffff','#ff00ff','#ffff00'],
        grid: {
            show: true,
            borderWidth: 1,
            borderColor: {
                top: '#000',
                right: '#000',
                bottom: '#000',
                left: '#000'
            }
        },
        legend: {
            show: true,
            position: 'nw',
            backgroundOpacity: 0,
        },
        series: {
            shadowSize: 0,
            lines: {
                lineWidth: 1,
                fill: true,
                fillColor: {
                    colors: [{
                        opacity: 0.4
                    }, {
                        opacity: 0.0
                    }]
                },
                steps: false
            }
        },
        xaxis: {
            min: 0,
            max: 100,
            timeformat: "%H:%M:%S"
        },
        yaxis: {
            min: 0,
            max: 100
        },
        selection: {
            mode: "xy"
        }
    };
    var selectOptions = this.selectOptions = {
        xaxis: {
            locked: false,
            min: [],
            max: []
        },
        yaxis: {
            locked: false,
            min: [],
            max: []
        }
    }

    // private methods
    function buildGraph(graphNumber, graphData) {
        var data;

        // On first call
        if(typeof graphDataset[graphNumber] === 'undefined') {
            graphDataset[graphNumber] = { data: [] };
// TODO fill for mode 'time' with placeholder
            for(var i=0; i<maxGraphValues; i++) {
                // fill empty data with 0
                graphDataset[graphNumber].data.push([i * (graphOptions.xaxis.max/(maxGraphValues-1)),0]);
            }
        }

        if(graphOptions.xaxis.mode == 'time') {
            data = [];

            if (graphData.length >= maxGraphValues) {
                data = graphData;
            } else {
                data = graphDataset[graphNumber].data.slice(graphData.length);
                for (var i in graphData) {
                    data.push([graphData[i][0], graphData[i][1]]);
                }
            }

            if (!selectOptions.xaxis.locked) {
                // if area unselected
                graphOptions.xaxis.min = data[0][0];
                graphOptions.xaxis.max = data[data.length - 1][0];
            } else {
                // if area selected
                var diff = data[1][0] - data[0][0];

                if (data.length >= 1 && graphNumber == 0) {
                    // Move all values in stacks
                    for (var i in selectOptions.xaxis.min) {
                        if (selectOptions.xaxis.min.length === selectOptions.xaxis.max.length) {
                            selectOptions.xaxis.min[i] = selectOptions.xaxis.min[i] + diff;
                            selectOptions.xaxis.max[i] = selectOptions.xaxis.max[i] + diff;
                        } else {
                            throw "min/max array not at the same length";
                        }
                    }

                    // Make selected area moveable
                    graphOptions.xaxis.min = graphOptions.xaxis.min + diff;
                    graphOptions.xaxis.max = graphOptions.xaxis.max + diff;
                }
            }
        } else {
            var maxX;
            selectOptions.xaxis.locked ? maxX=selectOptions.xaxis.max[0] : maxX=graphOptions.xaxis.max;

            if(graphData.length >= maxGraphValues) {
                // graphdata >= n (n = maximal values in chart)
                data = [];
                for(var i=0; i<graphData.length; i++) {
                    data.push([i * (maxX/(maxGraphValues-1)), graphData[i]]);
                }
            } else {
                // 0 < graphdata < n (n = maximal values in chart)
                data = graphDataset[graphNumber].data.slice(graphData.length);
                for(var i=0; i<data.length; i++) {
                    data[i][0] = i * (maxX/(maxGraphValues-1));
                }

                var size = data.length;
                for(var i=data.length; i<maxGraphValues; i++) {
                    data.push([i * (maxX/(maxGraphValues-1)), graphData[i-size]]);
                }
            }
        }
        return data;
    }

    // public methods
    this.getDataset = function(graphSets) {
        if(graphOptions.xaxis.mode == 'time') {
            //time mode
            if(!disableDrawing) {
                for(var i in graphSets) {
                    if(tempGraphDataset.length > 0) {

                        tempGraphDataset[i] = tempGraphDataset[i].concat(graphSets[i].data);

                        graphDataset[graphSets[i].id] = {
                            label: graphSets[i].label,
                            data: buildGraph(graphSets[i].id, tempGraphDataset[i])
                        };
                    } else {
                        graphDataset[graphSets[i].id] = {
                            label: graphSets[i].label,
                            data: buildGraph(graphSets[i].id, graphSets[i].data)
                        };
                    }
                }
                tempGraphDataset = [];
            } else {
                for(var i in graphSets) {
                    if(typeof tempGraphDataset[i] === 'undefined') {
                        tempGraphDataset[i] = [];
                    }
                    tempGraphDataset[i] = tempGraphDataset[i].concat(graphSets[i].data);
                }
            }
        } else {
            // normal mode
            for(var i in graphSets) {
                graphDataset[graphSets[i].id] = {
                    label: graphSets[i].label,
                    data: buildGraph(graphSets[i].id, graphSets[i].data)
                };
            }
        }

        return graphDataset;
    }

    this.setMaxGraphValues = function(values) {
        maxGraphValues = values;
    }

    this.getMaxGraphValues = function() {
        return maxGraphValues;
    }

    this.lockX = function(min, max) {
        if(graphOptions.xaxis.mode == 'time' && typeof tempGraphDataset[0] !== 'undefined') {
            var tempLen = tempGraphDataset[0].length;
            var diff = tempGraphDataset[0][tempLen-1][0] - graphDataset[0].data[graphDataset[0].data.length-1][0];

            if(!selectOptions.xaxis.locked) {
                graphOptions.xaxis.min = graphDataset[0].data[tempLen][0];
                graphOptions.xaxis.max = tempGraphDataset[0][tempLen - 1][0];
                } else {
                for(var i in selectOptions.xaxis.min) {
                    selectOptions.xaxis.min[i] = selectOptions.xaxis.min[i] + diff;
                    selectOptions.xaxis.max[i] = selectOptions.xaxis.max[i] + diff;
                }
            }
        }
        selectOptions.xaxis.min.push(graphOptions.xaxis.min);
        selectOptions.xaxis.max.push(graphOptions.xaxis.max);
        selectOptions.xaxis.locked = true;

        graphOptions.xaxis.min = min;
        graphOptions.xaxis.max = max;
    }

    this.unlockX = function(reset) {
        if(selectOptions.xaxis.min.length > 0 && selectOptions.xaxis.max.length > 0) {
            if(typeof reset !== 'undefined' && reset === true) {
                graphOptions.xaxis.min = selectOptions.xaxis.min[0];
                graphOptions.xaxis.max = selectOptions.xaxis.max[0];
                selectOptions.xaxis.min = [];
                selectOptions.xaxis.max = [];
            } else {
                graphOptions.xaxis.min = selectOptions.xaxis.min.pop();
                graphOptions.xaxis.max = selectOptions.xaxis.max.pop();
            }
        }

        if(selectOptions.xaxis.min.length == 0 && selectOptions.xaxis.max.length == 0) {
            selectOptions.xaxis.locked = false;
        }
    }

    this.lockY = function(min, max) {
        selectOptions.yaxis.min.push(graphOptions.yaxis.min);
        selectOptions.yaxis.max.push(graphOptions.yaxis.max);
        selectOptions.yaxis.locked = true;

        graphOptions.yaxis.min = min;
        graphOptions.yaxis.max = max;
    }

    this.unlockY = function(reset) {
        if(selectOptions.yaxis.min.length > 0 && selectOptions.yaxis.max.length > 0) {
            if(typeof reset !== 'undefined' && reset === true) {
                graphOptions.yaxis.min = selectOptions.yaxis.min[0];
                graphOptions.yaxis.max = selectOptions.yaxis.max[0];
                selectOptions.yaxis.min = [];
                selectOptions.yaxis.max = [];
            } else {
                graphOptions.yaxis.min = selectOptions.yaxis.min.pop();
                graphOptions.yaxis.max = selectOptions.yaxis.max.pop();
            }
        }

        if(selectOptions.yaxis.min.length == 0 && selectOptions.yaxis.max.length == 0) {
            selectOptions.yaxis.locked = false;
        }
    }

    this.disableDrawing = function() {
        disableDrawing = true;
    }

    this.enableDrawing = function() {
        disableDrawing = false;
    }
});