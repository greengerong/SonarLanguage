app = angular.module('app', [])
    .value("$host", "http://nemo.sonarsource.org")
    .factory("$requestUrl", ($host) ->   "#{$host}/api/resources")
    .factory("$dynamicColor", ($host) ->
        [r,g,b] = [10,10,0]
        {
          getColor: ->
               [r,g,b] = [(r+100), (g+400), (b + 200)]
               "##{(r + 256 * g + 65536 * b).toString 16 }"
          ,
          reset:  -> 
               [r,g,b] = [10,10,0]                          
        };
    ).directive('chartData', -> 
            drawChart = (elementId, data) -> 
               chart = new AmCharts.AmPieChart()        
               chart.dataProvider = data
               chart.titleField = "name"
               chart.valueField = "percentage"
               chart.colorField = "color"
               chart.labelsEnabled = false
               chart.pullOutRadius = 0
               chart.depth3D = 20
               chart.angle = 45
               legend = new AmCharts.AmLegend()
               legend.makerType = "square"
               legend.align = "center"
               chart.addLegend legend

               chart.write elementId
               chart;

            (scope, element, attr) ->  
               
                  scope.already.push( -> 
                     data = scope.$eval(attr.chartData);
                     drawChart(element[0].id, data);                       
                  ) if element[0].id                      
    )

report = ($scope, $window, $http, $requestUrl, $dynamicColor) ->
    $scope.already = []
    $window.angularJsonpCallBack = (data) ->
         @data = data
         getObjectByKey = (msr , key) ->
            m for m in msr when m.key == key         
         
         $scope.gridSource = $scope.projects = data

         ready = (queues) -> angular.forEach(queues, (q) -> q() )       
         ready $scope.already 

    $scope.getLanguageChartData = -> 
         data = _.groupBy $scope.projects , (project) -> project.lang 
         $dynamicColor.reset()
         chartData = _.map(data, (array, key) ->          
                      "name":key
                      "percentage":array.length,
                      "color":$dynamicColor.getColor())

         _.sortBy(chartData, (num) -> num.percentage )
  
    $scope.search = ->
        source = []
        if not this.searchName
            source = @projects
        else 
            source = _.filter @projects, (p) ->                  
                       p.name.toLowerCase().indexOf $scope.searchName.toLowerCase() != -1                     
       
        source = _.sortBy(source, (p) -> p[$scope.sortCondition.key].toLowerCase()) if @sortCondition and @sortCondition.key
          
        source.reverse() if  @sortCondition.sort and not @sortCondition.sort[$scope.sortCondition.key]        
        
        @gridSource = source

    $scope.sort = (name) ->
        @sortCondition ?= {}
        @sortCondition.sort ?= {}
        @sortCondition.key = name
        @sortCondition.sort[name] = not @sortCondition.sort[name]
        @search();

    $scope.init = ->
        $http.jsonp  "#{$requestUrl}?callback=angularJsonpCallBack"
 
app.controller "report", report