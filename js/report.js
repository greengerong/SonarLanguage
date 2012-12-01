var app = angular.module('app', [])
    .value("$host", "http://nemo.sonarsource.org")
    .factory("$requestUrl", function ($host) {
        return  $host + "/api/resources";
    })
    .factory("$dynamicColor", function ($host) {
        var r = 10;
        var g = 10;
        var b = 0;
        return {
            getColor:function () {
                b = b + 200;
                r += 100;
                g += 400;
                return "#" + ((r + 256 * g + 65536 * b).toString(16));
            },
            reset:function () {
                r = 10;
                g = 10;
                b = 0;
            }
        };
    })
    .directive('chartData', function () {
        var drawChart = function (elementId, data) {
            var chart = new AmCharts.AmPieChart();
            // chart.startRadius = 10;
            chart.dataProvider = data;
            chart.titleField = "name";
            chart.valueField = "percentage";
            chart.colorField = "color";
            chart.labelsEnabled = false;
            chart.pullOutRadius = 0;
            chart.depth3D = 20;
            chart.angle = 45;
            var legend = new AmCharts.AmLegend();
            legend.makerType = "square";
            legend.align = "center";
            chart.addLegend(legend);

            chart.write(elementId);
            return chart;
        };
        return function (scope, element, attr) {
            if (element[0].id) {
                scope.already.push(function () {
                    var data = scope.$eval(attr.chartData);
                    drawChart(element[0].id, data);
                });
            }
        }
    });

var report = function ($scope, $window, $http, $requestUrl, $dynamicColor) {
    $scope.already = [];
    $window.angularJsonpCallBack = function (data) {
        this.data = data;
        var getObjectByKey = function (msr, key) {
            for (var d in msr) {
                if (msr[d].key == key) {
                    return msr[d];
                }
            }
        };

        $scope.gridSource = $scope.projects = data;

        var ready = function (queues) {
            angular.forEach(queues, function (q) {
                q();
            });
        };
        ready($scope.already);
    };

    $scope.getLanguageChartData = function () {
        var data = _.groupBy($scope.projects, function (project) {
            return project.lang;
        });

        $dynamicColor.reset()
        var chartData = _.map(data, function (array, key) {
            return {"name":key, "percentage":array.length, "color":$dynamicColor.getColor()};
        });

        return _.sortBy(chartData, function (num) {
            return num.percentage;
        });
    };

    $scope.search = function () {
        var source = [];
        if (!this.searchName) {
            source = this.projects;
        } else {
            source = _.filter(this.projects, function (p) {
                return p.name.toLowerCase().indexOf($scope.searchName.toLowerCase()) != -1;
            });
        }
        if (this.sortCondition && this.sortCondition.key) {
            source = _.sortBy(source, function (p) {
                return p[$scope.sortCondition.key].toLowerCase();
            });

            if (this.sortCondition.sort && !this.sortCondition.sort[$scope.sortCondition.key]) {
                source.reverse();
            }
        }
        this.gridSource = source;
    };

    $scope.sort = function (name) {
        this.sortCondition = this.sortCondition || {};
        this.sortCondition.sort = this.sortCondition.sort || {};
        this.sortCondition.key = name;
        this.sortCondition.sort[name] = !this.sortCondition.sort[name];
        this.search();
    };

    $scope.init = function () {
        $http.jsonp($requestUrl + "?callback=angularJsonpCallBack");
    };
};
app.controller("report", report);