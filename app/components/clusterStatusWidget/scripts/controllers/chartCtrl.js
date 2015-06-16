angular.module('openattic.clusterstatuswidget', ['easypiechart', 'angular-flot'])
    .controller('chartCtrl', function ($scope, $timeout, lineChartService, serverLoadService) {
        // ColorSet
        var colorSet = {
            white:  "#ffffff",  // white
            red:    "#f7464a",  // red
            orange: "#b67f2C",  // orange
            yellow: "#fdb45c",  // yellow
            green:  "#5cb85c",  // green
            blue:   "#0091d9",  // blue
            dblue:  "#598a9e",  // dark blue
            bgrey:  "#ebebeb",  // bright grey
            grey:   "#dcdcdc"   // grey
        };

        // Easy Pie Chart
        $scope.defaultOptions = {
            barColor:function(percent) {
                return(percent<50 ? colorSet.green : percent<85 ? colorSet.yellow : colorSet.red);
            },
            trackColor:colorSet.bgrey,
            scaleColor:false,
            size:50,
            lineWidth:5,
            lineCap:'butt',
            rotate:-90,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        };

        // Line Chart
        lineChartService.graphOptions.colors = [colorSet.blue,colorSet.yellow,colorSet.red];
        lineChartService.graphOptions.series.lines.fill = true;
        lineChartService.graphOptions.xaxis.mode = 'time';
        lineChartService.graphOptions.xaxis.timezone = 'browser';
        lineChartService.graphOptions.yaxis.max = 100;
        lineChartService.setMaxGraphValues(301);

        //lineChartService.graphOptions.colors = [colorSet.blue,colorSet.yellow,colorSet.red];
        //lineChartService.graphOptions.series.lines.fill = true;
        //lineChartService.graphOptions.xaxis.max = 100;
        //lineChartService.graphOptions.yaxis.max = 10;
        //lineChartService.setMaxGraphValues(288);

        $scope.lineChartOptions = lineChartService.graphOptions;

        // ------------------------- START TEST MODE TIME -------------------------
        var globalData = [[], [], []];
        var j=288;
        var first1 = true;
        var deleteGetData = function() {
            var date = new Date().getTime();
            var data = [];
            data[0] = globalData[0].slice(0);
            data[1] = globalData[1].slice(0)
            data[2] = globalData[2].slice(0);

            if(first1) {
                if (data[0].length) {
                    data[0] = data[0].slice(1);
                    data[1] = data[1].slice(1);
                    data[2] = data[2].slice(1);

                    //for(var i=0; i<data.length; i++) {
                    //    data[i][0] = i * (100/288);
                    //}
                }

                while (data[0].length <= 288) {
                    data[0].push([date - j * 1000, getValueFromRestApi(data[0])]);
                    data[1].push([date - j * 1000, getValueFromRestApi(data[1])]);
                    data[2].push([date - j * 1000, getValueFromRestApi(data[2])]);
                    j < 1 ? j = 0 : j--;
                }
                first1 = false;
            } else {
                var prev1 = data[0][data[0].length-1][1];
                var prev2 = data[1][data[1].length-1][1];
                var prev3 = data[2][data[2].length-1][1];
                data = [[],[],[]];
                data[0].push([date - j * 1000, getValueFromRestApi3(prev1)]);
                data[1].push([date - j * 1000, getValueFromRestApi3(prev2)]);
                data[2].push([date - j * 1000, getValueFromRestApi3(prev3)]);
            }

            return data;
        }
        function getValueFromRestApi(data) {
            var len = data.length;
            var prev = len ? data[len-1][1] : Math.random() * 10;
            var y =  prev + Math.random() * 1 - 0.5;

            return y<0 ? 0 : y>10? 10 : y;
        }
        // ------------------------- END TEST MODE TIME -------------------------
        // ------------------------- START TEST MODE NORMAL -------------------------
        var globalData2 = [[],[],[]];
        var maxVal = lineChartService.getMaxGraphValues();
        var first2 = true;
        var deleteGetData2 = function() {
            var data = [];
            data[0] = globalData2[0].slice(0);
            data[1] = globalData2[1].slice(0);
            data[2] = globalData2[2].slice(0);

            if(first2) {
                for (var i = 0; i < maxVal; i++) {
                    data[0].push(getValueFromRestApi2(data[0]));
                    data[1].push(getValueFromRestApi2(data[1]));
                    data[2].push(getValueFromRestApi2(data[2]));
                }
                first2=false;
            } else {
                var prev1 = data[0][data[0].length-1];
                var prev2 = data[1][data[1].length-1];
                var prev3 = data[2][data[2].length-1];
                data = [[],[],[]];
                data[0].push(getValueFromRestApi3(prev1));
                data[1].push(getValueFromRestApi3(prev2));
                data[2].push(getValueFromRestApi3(prev3));
            }

            return data;
        }
        function getValueFromRestApi2(data) {
            var len = data.length
            var prev = len ? data[len-1] : Math.random() * 10;
            var y =  prev + Math.random() * 1 - 0.5;

            return y<0 ? 0 : y>10? 10 : y;
        }
        function getValueFromRestApi3(prev) {
            var y =  prev + Math.random() * 1 - 0.5;

            return y<0 ? 0 : y>10? 10 : y;
        }
        // ------------------------- END TEST MODE NORMAL -------------------------

        // ------------------------- START TEST MODE DERP -------------------------
        var globalData3;
        var counter = 0;
        var first3=true;
        var date;
        var last1, last2;
        var discLoad;
        var evtSource = new EventSource("../../derp/stream");
        evtSource.onmessage = function(e) {
            var data = e.data.replace(/\s*[^\w.]\s*/g, " ").split(" ");

            if(first3) {
                last1 = data[0];
                last2 = data[10];
                first3 = false;
            } else {
                var interval = data[0] - last1;
                var tot_ticks = data[10] - last2;
                date = Math.round(data[0]*1000);
                discLoad = tot_ticks / (interval * 1000.) * 100.;

                //console.log('last:' + last1 + ' Curr:' + data[0]);
                //console.log('last:' + last2 + ' Curr:' + data[10]);

                last1 = data[0];
                last2 = data[10];
            }
        }
        // ------------------------- END TEST MODE DERP -------------------------

        var drawGraph = function() {
            /*serverLoadService.query().$promise.then(function(res)
             {
             var data = [];
             var data2 = [];
             var data3 = [];

             for(var i in res) {
             if(i%5 === 0 && i>(res.length/1.25)) {
             data.push([res[i].t * 1000, res[i].load1]);
             data2.push([res[i].t * 1000, res[i].load5]);
             data3.push([res[i].t * 1000, res[i].load15]);
             }
             }

             $scope.lineChartDataset = lineChartService.getDataset(0, 'load1', data);
             $scope.lineChartDataset = lineChartService.getDataset(1, 'load5', data2, '#ff0000');
             $scope.lineChartDataset = lineChartService.getDataset(2, 'load15', data3, '#ffff00');
             }, function (error) {
             console.log('An error occurred', error);
             });*/

            globalData = deleteGetData();
            globalData2 = deleteGetData2();

            //date = new Date().getTime();
            //if(globalData[0].length === 0) {
            //    for(var i=299; i>=0; i--) {
            //        globalData[0].push([date - i*1000, 0]);
            //    }
            //}
            globalData3 = [[]];
            if(discLoad != null) {
                globalData3[0].push([date, discLoad]);
                counter++;
                //console.log('Nummer:' + counter + ' Load:' + discLoad + ' in % um:' + date);
                $scope.lineChartDataset = lineChartService.getDataset([
                    {id: 0, label: 'ServerLoad', data: globalData3[0]},
                ]);
            }

                //$scope.lineChartDataset = lineChartService.getDataset([
                //    {id: 0, label: 'Line1', data: globalData[0]},
                //    //{id: 1, label: 'Line2', data: globalData[1]},
                //    //{id: 2, label: 'Line3', data: globalData[2]}
                //]);
            //    $scope.lineChartDataset = lineChartService.getDataset([
            //        {id: 0, label: 'Line1', data: globalData2[0]},
            //        //{id: 1, label: 'Line2', data: globalData2[1]},
            //        //{id: 2, label: 'Line3', data: globalData2[2]}
            //    ]);

            $timeout(drawGraph, 1000);
        }
        drawGraph();

        var graphElement = $("flot");
        graphElement.mousedown(function () { disableDrawing = true; lineChartService.disableDrawing(); });
        $("body").mouseup(function () { disableDrawing = false; lineChartService.enableDrawing(); });
        graphElement.bind("contextmenu",function(){
            return false;
        });
        graphElement.bind("dblclick", function() {
            lineChartService.unlockX(true);
            lineChartService.unlockY(true);
            $scope.$digest();
        });
        graphElement.bind("mousedown", function(e) {
            if(e.which == 3) {
                lineChartService.unlockX();
                lineChartService.unlockY();
                $scope.$digest();
            }
        });
        graphElement.bind("plotselected", function (event, ranges) {
            lineChartService.lockX(ranges.xaxis.from, ranges.xaxis.to);
            lineChartService.lockY(ranges.yaxis.from, ranges.yaxis.to);
            $scope.$digest();
        });
    });