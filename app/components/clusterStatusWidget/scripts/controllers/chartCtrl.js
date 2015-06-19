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
                return(percent<50 ? colorSet.green : percent<75 ? colorSet.yellow : colorSet.red);
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

        $scope.hostOptions = {
            barColor:colorSet.green,
            trackColor:colorSet.red,
            scaleColor:false,
            size:50,
            lineWidth:5,
            trackWidth:4,
            lineCap:'butt',
            rotate:-90,
            onStep: function(from, to, percent) {
                $(this.el).find('.percent').text(Math.round(percent));
            }
        };

        var hosts = 4;
        var hostsOnline = 3;
        $scope.testHosts = hostsOnline + '/' + hosts;
        $scope.percentServerLoad =  Math.round(Math.random()*40+45);
        $scope.percentServerLoadUp = false;
        $scope.percentServerLoadChange = 0;

        $scope.percentDiscSpace = 10;
        $scope.percentDiscSpaceUp = false;

        $scope.hosts = 100/hosts * hostsOnline;
        $scope.temperature = 23;

        var last;
        //var checkHosts = function() {
        //    // ServerLoad
        //    last = $scope.percentServerLoad;
        //    $scope.percentServerLoad = Math.round(Math.random()*40+45);
        //    if(last < $scope.percentServerLoad) $scope.percentServerLoadUp = true; else $scope.percentServerLoadUp = false;
        //    $scope.percentServerLoadChange = (($scope.percentServerLoad / last) -1) *100;
        //    $scope.percentServerLoadChange = Math.round($scope.percentServerLoadChange);
        //
        //    // DiscSpace
        //    if($scope.percentDiscSpace > 90) $scope.percentDiscSpace = 10;
        //    $scope.percentDiscSpace = $scope.percentDiscSpace + Math.random()*5;
        //
        //    // Hosts
        //
        //    // Temp
        //    $scope.temperature = Math.round(Math.random()*3+23);
        //
        //    $timeout(checkHosts, 10000);
        //};
        //checkHosts();

        // Live Chart
        lineChartService.graphOptions.colors = [colorSet.blue,colorSet.yellow,colorSet.red];
        lineChartService.graphOptions.series.lines.fill = true;
        lineChartService.graphOptions.xaxis.mode = 'time';
        lineChartService.graphOptions.xaxis.timezone = 'browser';
        lineChartService.setMaxGraphValues(121);

        $scope.lineChartOptions = lineChartService.graphOptions;
        $scope.lineChartDataset = [{data: [[0,0],[1000,0]]}];    // Init empty Graph


        // ------------------------- AKTUELLES LIVE BLAA START -------------------------
        var cpuLoadData;
        var data;
        var date;
        var evtSource = new EventSource("../../derp/stream");
        evtSource.onmessage = function(e) {
            date = new Date().getTime();
            data = JSON.parse(e.data);
            console.log(data.CPU.loadavg);
            $scope.lineChartDataset = lineChartService.getDataset([
                {id: 0, label: 'CPU Load', data: [[date, data.CPU.loadavg]]}
            ]);
            $scope.$digest();
        };
        // ------------------------- AKTUELLES LIVE BLAA END -------------------------

        //var drawGraph = function() {
        //    //globalData3 = [[]];
        //    //if(discLoad != null) {
        //    //    globalData3[0].push([date, discLoad]);
        //    //    counter++;
        //    //    //console.log('Nummer:' + counter + ' Load:' + discLoad + ' in % um:' + date);
        //    //    $scope.lineChartDataset = lineChartService.getDataset([
        //    //        {id: 0, label: '', data: globalData3[0]},
        //    //    ]);
        //    //}
        //    $timeout(drawGraph, 1000);
        //};
        //drawGraph();

        // bind functions on flot-element
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
        //graphElement.bind("plothover", function (event, pos, item)
        //{
        //    if (item) {
        //        var x = item.datapoint[0].toFixed(2),
        //            y = item.datapoint[1].toFixed(2);
        //
        //        var date = new Date(Math.floor(x));
        //        var formattedDate = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
        //
        //        $("#tooltip").html(y + " | " + formattedDate)
        //            .css({top: item.pageY+5, left: item.pageX+5, border: "solid 1px black"})
        //            .fadeIn(200);
        //    } else {
        //        $("#tooltip").hide();
        //    }
        //});
    });