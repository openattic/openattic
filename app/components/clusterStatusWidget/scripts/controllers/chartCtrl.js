'use strict';

angular.module('openattic.clusterstatuswidget', ['easypiechart', 'angular-flot'])
    .controller('chartCtrl', function ($scope, lineChartService) {
        /** Variables  ------------------------------------------------------------------------------------------------ */
        var colorSet = {
            white:  "#ffffff",  // white
            red:    "#f7464a",  // red
            orange: "#b67f2C",  // orange
            yellow: "#fdb45c",  // yellow
            green:  "#5cb85c",  // green
            blue:   "#0091d9",  // blue
            dblue:  "#57889c",  // dark blue
            bgrey:  "#ebebeb",  // bright grey
            grey:   "#dcdcdc"   // grey
        };
        var avgValues;
        var count_messages;
        var data;
        var date;
        var graph_data;
        var graph_date;
        var graph_interval;
        var graph_maxValues;
        var interval;
        var temp;



        /** EventSource --------------------------------------------------------------------------------------------- */
        avgValues = {};
        count_messages = 0;
        interval = 10;

        // init
        avgValues["cpu_load"] = 0;
        $scope.percentCpuLoadDiff = 0;
        $scope.percentCpuLoadTrend = "stable";
        avgValues["disk_load"] = 0;
        $scope.percentDiscUsageDiff = 0;
        $scope.percentDiscUsageTrend = "stable";

        var evtSource = new EventSource("/openattic/serverstats/stream");
        evtSource.addEventListener("serverstats", function (e) {
            $scope.$apply(function () {
                count_messages++;
                if(count_messages === interval) count_messages = 0;

                date = new Date().getTime();
                data = JSON.parse(e.data);

                //console.log(e.data);

                // Progress Bar
                $scope.hosts = 1 + " / " + 1;
                $scope.hosts_p = 1/1 * 100;
                $scope.hosts_t = "info";

                $scope.disks_online = data.disks.count_online + " / " + data.disks.count;
                $scope.disks_online_p = data.disks.count_online / data.disks.count * 100;
                $scope.disks_online_p < 80 ? $scope.disks_online_t = "danger" : $scope.disks_online_p < 100 ? $scope.disks_online_t = "warning" : $scope.disks_online_t = "success";

                $scope.disks_usage = 90 + "TB / " + 100 + "TB";
                $scope.disks_usage_p = 90/100 * 100;
                $scope.disks_usage_p > 80 ? $scope.disks_usage_t = "danger" : $scope.disks_usage_p > 50 ? $scope.disks_usage_t = "warning" : $scope.disks_usage_t = "success";

                // Easy Pie
                avgValues.cpu_load += data.cpu.load_percent;
                avgValues.disk_load += data.disks.load_percent;
                if(count_messages === 0) {
                    temp = $scope.percentCpuLoad;
                    $scope.percentCpuLoad = Math.round(avgValues.cpu_load / interval);
                    $scope.percentCpuLoadDiff = ($scope.percentCpuLoad - temp);
                    $scope.percentCpuLoadDiff < 0 ? $scope.percentCpuLoadTrend = "down" : $scope.percentCpuLoadDiff > 0 ? $scope.percentCpuLoadTrend = "up" : $scope.percentCpuLoadTrend = "stable";

                    temp = $scope.percentDiscUsage;
                    $scope.percentDiscUsage = Math.round(avgValues.disk_load / interval);
                    $scope.percentDiscUsageDiff = ($scope.percentDiscUsage - temp);
                    $scope.percentDiscUsageDiff < 0 ? $scope.percentDiscUsageTrend = "down" : $scope.percentDiscUsageDiff > 0 ? $scope.percentDiscUsageTrend = "up" : $scope.percentDiscUsageTrend = "stable";

                    // Reset values
                    avgValues.cpu_load = 0;
                    avgValues.disk_load = 0;
                }

                $scope.lineChartDataset = lineChartService.getDataset([
                    {id: 0, label: 'CPU Load', data: [[date, data.cpu.load_percent]]},
                    {id: 1, label: 'Disk Load', data: [[date, data.disks.load_percent]]}
                ]);
            });
        }, false);
        evtSource.addEventListener("error", function() {
            evtSource.close();
        }, false);



        /** Easy Pie Chart ------------------------------------------------------------------------------------------ */
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

        $scope.percentDiscUsage = 0;

        /** Live Chart ---------------------------------------------------------------------------------------------- */
        lineChartService.graphOptions.colors = [colorSet.dblue,colorSet.red,colorSet.yellow];
        lineChartService.graphOptions.series.lines.fill = false;
        lineChartService.graphOptions.xaxis.mode = 'time';
        lineChartService.graphOptions.xaxis.timezone = 'browser';
        lineChartService.setMaxGraphValues(121);

        $scope.lineChartOptions = lineChartService.graphOptions;

        graph_data = [];
        graph_date = new Date().getTime();
        graph_maxValues = lineChartService.getMaxGraphValues();
        graph_interval = 1000; // time in ms -> 1000ms equals 1s

        // Init empty graph
        for(var i=0; i<graph_maxValues; i++) {
            graph_data.push([graph_date - (((graph_maxValues-i)-1) * graph_interval),-1]);
        }
        $scope.lineChartDataset = lineChartService.getDataset([{id: 0, data: graph_data}]); // Init empty Graph
        $scope.lineChartDataset = lineChartService.getDataset([{id: 1, data: graph_data}]); // Init empty Graph



        /** bind functions on flot-element -------------------------------------------------------------------------- */
        var graphElement = $("flot");
        graphElement.mousedown(function () { lineChartService.disableDrawing(); });
        $("body").mouseup(function () { lineChartService.enableDrawing(); });
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



        /** stop server-sent-events --------------------------------------------------------------------------------- */
        $scope.$on('$destroy', function() {
            evtSource.close();
        });



        /** other stuff --------------------------------------------------------------------------------------------- */
    });