'use strict';

angular.module('openattic.clusterstatuswidget')
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
        avgValues["disk_load"] = 0;

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

                // Info Box
                //$scope.sys_uptime = data.sys.uptime;

                // Easy Pie
                avgValues.cpu_load += data.cpu.load_percent;
                avgValues.disk_load += data.disks.load_percent;
                if(count_messages === 0) {
                    // CPU load in Percent
                    temp = $scope.percentCpuLoad;
                    $scope.percentCpuLoad = Math.round(avgValues.cpu_load / interval);
                    $scope.percentCpuLoadDiff = ($scope.percentCpuLoad - temp);
                    $scope.percentCpuLoadDiff < 0 ? $scope.percentCpuLoadTrend = "down" : $scope.percentCpuLoadDiff > 0 ? $scope.percentCpuLoadTrend = "up" : $scope.percentCpuLoadTrend = "stable";

                    // Disk load in Percent
                    temp = $scope.percentDiscUsage;
                    $scope.percentDiscUsage = Math.round(avgValues.disk_load / interval);
                    $scope.percentDiscUsageDiff = ($scope.percentDiscUsage - temp);
                    $scope.percentDiscUsageDiff < 0 ? $scope.percentDiscUsageTrend = "down" : $scope.percentDiscUsageDiff > 0 ? $scope.percentDiscUsageTrend = "up" : $scope.percentDiscUsageTrend = "stable";

                    // Reset values
                    avgValues.cpu_load = 0;
                    avgValues.disk_load = 0;
                }

                $scope.lineChartDataset = lineChartService.getDataset([
                    {id: 0, label: 'written data', data: [[date, data.disks.wr_mb]]},
                    {id: 1, label: 'network traffic', data: [[date, data.network.tot_in_mb]]}
                ]);
            });
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

        $scope.percentCpuUsage = 0;
        $scope.percentCpuLoadDiff = 0;
        $scope.percentCpuLoadTrend = "stable";

        $scope.percentDiscUsage = 0;
        $scope.percentDiscUsageDiff = 0;
        $scope.percentDiscUsageTrend = "stable";


        /** Live Chart ---------------------------------------------------------------------------------------------- */
        lineChartService.graphOptions.colors = [colorSet.dblue,colorSet.red,colorSet.yellow];
        lineChartService.graphOptions.series.lines.fill = true;
        lineChartService.graphOptions.series.lines.fillColor = "rgba(255, 255, 255, 0)";
        lineChartService.graphOptions.series.lines.lineWidth = 1.5;
        lineChartService.graphOptions.xaxis.mode = 'time';
        lineChartService.graphOptions.xaxis.timezone = 'browser';
        lineChartService.graphOptions.yaxis.tickFormatter = function euroFormatter(v, axis) {
            return v.toFixed(axis.tickDecimals) + " MB";
        };
        lineChartService.setMaxGraphValues(121);

        $scope.lineChartOptions = lineChartService.graphOptions;

        graph_data = [];
        graph_date = new Date().getTime();
        graph_maxValues = lineChartService.getMaxGraphValues();
        graph_interval = 1000; // time in ms -> 1000ms equals 1s

        // Init empty graph
        for(var i=0; i<graph_maxValues; i++) {
            graph_data.push([graph_date - (((graph_maxValues-i)-1) * graph_interval), lineChartService.graphOptions.yaxis.min - 1]);
        }
        $scope.lineChartDataset = lineChartService.getDataset([
            {id: 0, data: graph_data},
            {id: 1, data: graph_data}
        ]); // Init empty Graph



        /** bind functions on flot-element -------------------------------------------------------------------------- */
        $("body").mouseup(function () { lineChartService.enableDrawing(); });
        $scope.mouseDown = function() {
            lineChartService.disableDrawing();
        };
        $scope.dblClick = function() {
            lineChartService.unlockX(true);
            lineChartService.unlockY(true);
        };
        $scope.rightClick = function() {
            lineChartService.unlockX();
            lineChartService.unlockY();
        };
        $scope.selected = function(event, ranges) {
            lineChartService.lockX(ranges.xaxis.from, ranges.xaxis.to);
            lineChartService.lockY(ranges.yaxis.from, ranges.yaxis.to);
        };


        /** en-/disable graph --------------------------------------------------------------------------------------- */
        $scope.checkBoxes = [
            {label: 'Written data', id: 0, isChecked: true},
            {label: 'Network traffic', id: 1, isChecked: true}
        ];

        $scope.$watch('checkBoxes',
            function(newVal, oldVal) {
                if(_.isEqual(newVal, oldVal)) { // first call
                    lineChartService.buildCache();

                    $scope.checkBoxes.forEach(function(element) {
                        element.isChecked ? lineChartService.setActive(element.id) : lineChartService.setInactive(element.id);
                    });
                }

                $scope.checkBoxes.forEach(function(element) {
                    if(newVal[element.id].isChecked == oldVal[element.id].isChecked) {
                        return;
                    }
                    newVal[element.id].isChecked ? lineChartService.setActive(element.id) : lineChartService.setInactive(element.id);
                });
            }, true
        );



        /** stop server-sent-events --------------------------------------------------------------------------------- */
        $scope.$on('$destroy', function() {
            evtSource.close();
        });
    });