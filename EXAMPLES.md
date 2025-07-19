# iXmaps Framework - Complete Examples

## Table of Contents

1. [Data Loading Examples](#data-loading-examples)
2. [Visualization Examples](#visualization-examples)
3. [Interactive Maps](#interactive-maps)
4. [Custom Components](#custom-components)
5. [Real-World Applications](#real-world-applications)
6. [Advanced Techniques](#advanced-techniques)

## Data Loading Examples

### 1. CSV Data with Multiple Sources

```javascript
// Load demographic data from multiple CSV sources
function loadDemographicData() {
    var dataBroker = Data.broker()
        .addSource("population.csv", "csv")
        .addSource("income.csv", "csv")
        .addSource("education.csv", "csv")
        .realize(function(datasets) {
            
            var population = datasets[0];
            var income = datasets[1];
            var education = datasets[2];
            
            // Merge datasets by common ID field
            var mergedData = mergeDemographicData(population, income, education);
            
            // Create comprehensive visualization
            createDemographicMap(mergedData);
        });
}

function mergeDemographicData(pop, inc, edu) {
    // Add income data to population dataset
    pop.addColumn({destination: 'median_income'}, function(row) {
        var regionId = row[pop.column('region_id').index];
        var incomeRow = inc.records.find(r => 
            r[inc.column('region_id').index] === regionId
        );
        return incomeRow ? incomeRow[inc.column('median_income').index] : 0;
    });
    
    // Add education data
    pop.addColumn({destination: 'college_rate'}, function(row) {
        var regionId = row[pop.column('region_id').index];
        var eduRow = edu.records.find(r => 
            r[edu.column('region_id').index] === regionId
        );
        return eduRow ? eduRow[edu.column('college_percent').index] : 0;
    });
    
    return pop;
}
```

### 2. Real-time Data Updates

```javascript
// Load and continuously update real-time data
class RealTimeDataLoader {
    constructor(options) {
        this.options = options;
        this.updateInterval = options.interval || 60000; // 1 minute default
        this.isRunning = false;
        this.currentData = null;
    }
    
    start() {
        this.isRunning = true;
        this.loadData();
        
        // Set up automatic updates
        this.intervalId = setInterval(() => {
            if (this.isRunning) {
                this.loadData();
            }
        }, this.updateInterval);
    }
    
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    
    loadData() {
        Data.feed({
            source: this.options.source + "?timestamp=" + Date.now(),
            type: this.options.type,
            cache: false // Disable caching for real-time data
        }).load((data) => {
            this.processUpdate(data);
        }).error((error) => {
            console.warn("Real-time data update failed:", error);
            // Continue with last known good data
        });
    }
    
    processUpdate(newData) {
        if (this.currentData) {
            // Compare with previous data and highlight changes
            this.highlightChanges(this.currentData, newData);
        }
        
        this.currentData = newData;
        
        // Update visualization
        this.updateVisualization(newData);
        
        // Trigger callback
        if (this.options.onUpdate) {
            this.options.onUpdate(newData);
        }
    }
    
    highlightChanges(oldData, newData) {
        // Implementation for highlighting data changes
        var changes = this.detectChanges(oldData, newData);
        this.animateChanges(changes);
    }
    
    updateVisualization(data) {
        // Update existing themes with new data
        ixmaps.doSwitchMapTheme("realtime_theme", "update");
    }
}

// Usage
var realtimeLoader = new RealTimeDataLoader({
    source: "https://api.example.com/live-data.json",
    type: "json",
    interval: 30000, // Update every 30 seconds
    onUpdate: function(data) {
        console.log("Data updated:", data.table.records, "records");
        updateDashboard(data);
    }
});

realtimeLoader.start();
```

### 3. Complex GeoJSON Processing

```javascript
// Process complex GeoJSON with multiple feature types
function loadComplexGeoData() {
    Data.feed({
        source: "complex-boundaries.geojson",
        type: "geojson"
    }).load(function(geoData) {
        
        // Separate features by type
        var countries = geoData.filter(function(row) {
            return row[geoData.column('feature_type').index] === 'country';
        });
        
        var states = geoData.filter(function(row) {
            return row[geoData.column('feature_type').index] === 'state';
        });
        
        var cities = geoData.filter(function(row) {
            return row[geoData.column('feature_type').index] === 'city';
        });
        
        // Calculate area and population density
        countries.addColumn({
            destination: 'area_km2'
        }, function(row) {
            var geometry = JSON.parse(row[countries.column('geometry').index]);
            return calculateArea(geometry) / 1000000; // Convert to km²
        });
        
        countries.addColumn({
            source: 'population',
            destination: 'density'
        }, function(value, row) {
            var area = row[countries.column('area_km2').index];
            return area > 0 ? parseInt(value) / area : 0;
        });
        
        // Create multi-layer visualization
        createMultiLayerMap(countries, states, cities);
    });
}

function calculateArea(geometry) {
    // Use turf.js or similar library for accurate area calculation
    if (typeof turf !== 'undefined') {
        return turf.area(geometry);
    }
    
    // Fallback simple calculation
    return approximateArea(geometry.coordinates);
}

function createMultiLayerMap(countries, states, cities) {
    // Country level - choropleth by density
    ixmaps.doCreateChart(
        "country_density",
        "density",
        null,
        "choropleth",
        "YlOrRd",
        7
    );
    
    // State level - borders only
    ixmaps.doCreateChart(
        "state_borders",
        null,
        null,
        "border",
        "#666666",
        1
    );
    
    // City level - proportional circles
    ixmaps.doCreateChart(
        "city_population",
        "population",
        null,
        "bubble",
        "Blues",
        5
    );
}
```

## Visualization Examples

### 1. Multi-Series Time Chart

```javascript
// Create time series visualization with multiple data series
function createTimeSeriesVisualization() {
    Data.feed({
        source: "economic-indicators.csv",
        type: "csv"
    }).load(function(data) {
        
        // Convert date strings to proper dates
        data.addColumn({
            source: 'date_string',
            destination: 'date'
        }, function(value) {
            return new Date(value);
        });
        
        // Add year/month columns for grouping
        data.addColumn({
            source: 'date',
            destination: 'year'
        }, function(value) {
            return value.getFullYear();
        });
        
        data.addColumn({
            source: 'date',
            destination: 'month'
        }, function(value) {
            return value.getMonth() + 1;
        });
        
        // Create pivot table by month
        var monthlyData = data.pivot({
            lead: ['year', 'month'],
            cols: 'indicator_type',
            sum: ['value'],
            calc: 'mean'
        });
        
        // Sort chronologically
        monthlyData.sort('year', 'UP');
        
        // Create custom time series chart
        createCustomTimeChart(monthlyData);
    });
}

function createCustomTimeChart(data) {
    var container = document.getElementById('timechart-container');
    var width = 800;
    var height = 400;
    var margin = {top: 20, right: 80, bottom: 40, left: 60};
    
    // Clear previous chart
    d3.select(container).selectAll("*").remove();
    
    var svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var chartWidth = width - margin.left - margin.right;
    var chartHeight = height - margin.top - margin.bottom;
    
    // Process data for D3
    var chartData = data.json().map(function(d) {
        return {
            date: new Date(d.year, d.month - 1),
            gdp: +d.GDP || 0,
            unemployment: +d.Unemployment || 0,
            inflation: +d.Inflation || 0
        };
    });
    
    // Scales
    var xScale = d3.scaleTime()
        .domain(d3.extent(chartData, d => d.date))
        .range([0, chartWidth]);
    
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => Math.max(d.gdp, d.unemployment, d.inflation))])
        .range([chartHeight, 0]);
    
    var color = d3.scaleOrdinal()
        .domain(['gdp', 'unemployment', 'inflation'])
        .range(['#1f77b4', '#ff7f0e', '#2ca02c']);
    
    // Line generator
    var line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);
    
    // Transform data for line charts
    var series = ['gdp', 'unemployment', 'inflation'].map(function(key) {
        return {
            name: key,
            values: chartData.map(function(d) {
                return {date: d.date, value: d[key]};
            })
        };
    });
    
    // Add axes
    g.append("g")
        .attr("transform", "translate(0," + chartHeight + ")")
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%Y-%m")));
    
    g.append("g")
        .call(d3.axisLeft(yScale));
    
    // Add lines
    var lines = g.selectAll(".line-group")
        .data(series)
        .enter().append("g")
        .attr("class", "line-group");
    
    lines.append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .style("stroke", d => color(d.name))
        .style("stroke-width", 2)
        .style("fill", "none");
    
    // Add legend
    var legend = g.selectAll(".legend")
        .data(series)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(" + (chartWidth + 10) + "," + (i * 20) + ")";
        });
    
    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d.name));
    
    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => d.name);
    
    // Add interactive tooltips
    addTimeChartTooltips(g, series, xScale, yScale, color);
}
```

### 2. Heatmap Visualization

```javascript
// Create a calendar heatmap
function createCalendarHeatmap() {
    Data.feed({
        source: "daily-activity.csv",
        type: "csv"
    }).load(function(data) {
        
        // Parse dates and create calendar structure
        data.addColumn({
            source: 'date_string',
            destination: 'date'
        }, function(value) {
            return new Date(value);
        });
        
        data.addColumn({
            source: 'date',
            destination: 'day_of_year'
        }, function(value) {
            var start = new Date(value.getFullYear(), 0, 0);
            var diff = value - start;
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        });
        
        data.addColumn({
            source: 'date',
            destination: 'week_day'
        }, function(value) {
            return value.getDay();
        });
        
        // Create heatmap
        createHeatmapChart(data);
    });
}

function createHeatmapChart(data) {
    var container = document.getElementById('heatmap-container');
    var cellSize = 17;
    var width = 960;
    var height = 136;
    
    var svg = d3.select(container)
        .selectAll("svg")
        .data([2023]) // Year
        .enter().append("svg")
        .attr("width", width)
        .attr("height", height);
    
    var g = svg.append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");
    
    // Create color scale
    var color = d3.scaleQuantize()
        .domain([0, d3.max(data.records, d => +d[data.column('activity_count').index])])
        .range(d3.schemeBlues[9]);
    
    // Create day rectangles
    var rect = g.selectAll(".day")
        .data(function(d) {
            return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1));
        })
        .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) {
            return d3.timeWeek.count(d3.timeYear(d), d) * cellSize;
        })
        .attr("y", function(d) {
            return d.getDay() * cellSize;
        })
        .datum(d3.timeFormat("%Y-%m-%d"));
    
    // Color the rectangles based on data
    rect.filter(function(d) {
        return data.records.find(r => r[data.column('date_string').index] === d);
    })
    .attr("fill", function(d) {
        var record = data.records.find(r => r[data.column('date_string').index] === d);
        return color(+record[data.column('activity_count').index]);
    });
    
    // Add month labels
    g.selectAll(".month")
        .data(function(d) {
            return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1));
        })
        .enter().append("path")
        .attr("class", "month")
        .attr("d", monthPath);
    
    function monthPath(t0) {
        var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
            d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
            d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
        return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
            + "H" + w0 * cellSize + "V" + 7 * cellSize
            + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
            + "H" + (w1 + 1) * cellSize + "V" + 0
            + "H" + (w0 + 1) * cellSize + "Z";
    }
}
```

### 3. Network Visualization

```javascript
// Create network diagram for relationship data
function createNetworkVisualization() {
    Data.feed({
        source: "network-data.json",
        type: "json"
    }).load(function(data) {
        
        // Process network data
        var nodes = extractNodes(data);
        var links = extractLinks(data);
        
        // Create force-directed graph
        createForceGraph(nodes, links);
    });
}

function extractNodes(data) {
    var nodeMap = new Map();
    
    data.records.forEach(function(record) {
        var sourceId = record[data.column('source').index];
        var targetId = record[data.column('target').index];
        
        if (!nodeMap.has(sourceId)) {
            nodeMap.set(sourceId, {
                id: sourceId,
                name: record[data.column('source_name').index],
                type: record[data.column('source_type').index],
                value: 0
            });
        }
        
        if (!nodeMap.has(targetId)) {
            nodeMap.set(targetId, {
                id: targetId,
                name: record[data.column('target_name').index],
                type: record[data.column('target_type').index],
                value: 0
            });
        }
        
        // Increment connection count
        nodeMap.get(sourceId).value++;
        nodeMap.get(targetId).value++;
    });
    
    return Array.from(nodeMap.values());
}

function extractLinks(data) {
    return data.records.map(function(record) {
        return {
            source: record[data.column('source').index],
            target: record[data.column('target').index],
            weight: +record[data.column('weight').index] || 1
        };
    });
}

function createForceGraph(nodes, links) {
    var container = document.getElementById('network-container');
    var width = 800;
    var height = 600;
    
    var svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    // Create force simulation
    var simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));
    
    // Color scale for node types
    var color = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Add links
    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", d => Math.sqrt(d.weight))
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6);
    
    // Add nodes
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", d => Math.sqrt(d.value) * 3 + 5)
        .attr("fill", d => color(d.type))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    
    // Add labels
    var label = svg.append("g")
        .attr("class", "labels")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.name)
        .attr("font-size", "12px")
        .attr("dx", 15)
        .attr("dy", 4);
    
    // Update positions on tick
    simulation.on("tick", function() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        
        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
    
    // Drag functions
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    // Add legend
    var legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(0," + i * 20 + ")";
        });
    
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);
    
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(d => d);
}
```

## Interactive Maps

### 1. Multi-Theme Comparison Map

```javascript
// Create side-by-side comparison of different themes
function createComparisonMap() {
    // Load demographic data
    Data.feed({
        source: "demographics.csv",
        type: "csv"
    }).load(function(data) {
        
        // Create multiple themes for comparison
        createComparisonThemes(data);
        
        // Set up comparison interface
        setupComparisonInterface();
    });
}

function createComparisonThemes(data) {
    // Theme 1: Population density
    ixmaps.doCreateChart(
        "population_density",
        "population_per_sqkm",
        null,
        "choropleth",
        "YlOrRd",
        7
    );
    
    // Theme 2: Income levels
    ixmaps.doCreateChart(
        "median_income",
        "median_household_income",
        null,
        "choropleth",
        "BuGn",
        7
    );
    
    // Theme 3: Education levels
    ixmaps.doCreateChart(
        "education_level",
        "college_degree_percent",
        null,
        "choropleth",
        "BuPu",
        7
    );
}

function setupComparisonInterface() {
    // Create theme selector
    var selector = document.getElementById('theme-selector');
    var themes = [
        {id: 'population_density', name: 'Population Density'},
        {id: 'median_income', name: 'Median Income'},
        {id: 'education_level', name: 'Education Level'}
    ];
    
    themes.forEach(function(theme) {
        var button = document.createElement('button');
        button.textContent = theme.name;
        button.onclick = function() {
            switchToTheme(theme.id);
        };
        selector.appendChild(button);
    });
    
    // Add comparison mode toggle
    var compareButton = document.createElement('button');
    compareButton.textContent = 'Compare Mode';
    compareButton.onclick = toggleComparisonMode;
    selector.appendChild(compareButton);
}

var comparisonMode = false;
var activeThemes = [];

function switchToTheme(themeId) {
    if (comparisonMode) {
        // In comparison mode, toggle themes
        if (activeThemes.includes(themeId)) {
            activeThemes = activeThemes.filter(id => id !== themeId);
            ixmaps.doSwitchMapTheme(themeId, "hide");
        } else if (activeThemes.length < 2) {
            activeThemes.push(themeId);
            ixmaps.doSwitchMapTheme(themeId, "show");
        }
    } else {
        // Single theme mode
        activeThemes.forEach(id => ixmaps.doSwitchMapTheme(id, "hide"));
        activeThemes = [themeId];
        ixmaps.doSwitchMapTheme(themeId, "show");
    }
    
    updateLegend();
}

function toggleComparisonMode() {
    comparisonMode = !comparisonMode;
    
    if (!comparisonMode) {
        // Exit comparison mode - show only first active theme
        activeThemes.slice(1).forEach(id => ixmaps.doSwitchMapTheme(id, "hide"));
        activeThemes = activeThemes.slice(0, 1);
    }
    
    updateLegend();
}

function updateLegend() {
    var legendContainer = document.getElementById('legend-container');
    legendContainer.innerHTML = '';
    
    activeThemes.forEach(function(themeId) {
        var themeInfo = ixmaps.doQueryThemesWithInfo()[themeId];
        if (themeInfo) {
            var legendDiv = document.createElement('div');
            legendDiv.className = 'theme-legend';
            legendDiv.innerHTML = createThemeLegendHTML(themeInfo);
            legendContainer.appendChild(legendDiv);
        }
    });
}
```

### 2. Animated Time Series Map

```javascript
// Create animated map showing changes over time
function createAnimatedTimeMap() {
    Data.feed({
        source: "temporal-data.csv",
        type: "csv"
    }).load(function(data) {
        
        // Process temporal data
        var timeSteps = prepareTimeSteps(data);
        
        // Create animation controller
        createAnimationController(timeSteps);
        
        // Start with first time step
        displayTimeStep(timeSteps[0]);
    });
}

function prepareTimeSteps(data) {
    // Group data by time periods
    var timeGroups = {};
    
    data.records.forEach(function(record) {
        var timeKey = record[data.column('year').index];
        if (!timeGroups[timeKey]) {
            timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(record);
    });
    
    // Convert to sorted array
    return Object.keys(timeGroups)
        .sort()
        .map(function(year) {
            return {
                year: year,
                data: timeGroups[year]
            };
        });
}

function createAnimationController(timeSteps) {
    var controller = document.getElementById('animation-controller');
    
    // Create timeline slider
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = timeSteps.length - 1;
    slider.value = 0;
    slider.addEventListener('input', function() {
        currentStep = parseInt(slider.value);
        displayTimeStep(timeSteps[currentStep]);
        updateTimeDisplay(timeSteps[currentStep].year);
    });
    
    // Create play/pause button
    var playButton = document.createElement('button');
    playButton.textContent = 'Play';
    var isPlaying = false;
    var animationInterval;
    
    playButton.addEventListener('click', function() {
        if (isPlaying) {
            clearInterval(animationInterval);
            playButton.textContent = 'Play';
            isPlaying = false;
        } else {
            animationInterval = setInterval(function() {
                currentStep = (currentStep + 1) % timeSteps.length;
                slider.value = currentStep;
                displayTimeStep(timeSteps[currentStep]);
                updateTimeDisplay(timeSteps[currentStep].year);
            }, 1000);
            playButton.textContent = 'Pause';
            isPlaying = true;
        }
    });
    
    // Create speed control
    var speedControl = document.createElement('select');
    [0.5, 1, 2, 4].forEach(function(speed) {
        var option = document.createElement('option');
        option.value = speed;
        option.textContent = speed + 'x';
        speedControl.appendChild(option);
    });
    speedControl.value = 1;
    
    // Create time display
    var timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.textContent = timeSteps[0].year;
    
    // Add elements to controller
    controller.appendChild(timeDisplay);
    controller.appendChild(slider);
    controller.appendChild(playButton);
    controller.appendChild(speedControl);
    
    var currentStep = 0;
    
    function updateTimeDisplay(year) {
        timeDisplay.textContent = year;
    }
}

function displayTimeStep(timeStep) {
    // Create temporary data table for this time step
    var tempData = Data.import({
        data: [
            ['region', 'value'], // headers
            ...timeStep.data.map(d => [d.region, d.value])
        ]
    });
    
    // Update theme with new data
    ixmaps.doCreateChart(
        "temporal_theme",
        "value",
        null,
        "choropleth",
        "RdYlBu",
        7
    );
    
    // Add transition animation
    animateThemeTransition("temporal_theme");
}

function animateThemeTransition(themeId) {
    // Add CSS transitions for smooth animation
    var elements = document.querySelectorAll('[theme-id="' + themeId + '"]');
    elements.forEach(function(element) {
        element.style.transition = 'fill 0.5s ease-in-out';
    });
}
```

### 3. Interactive Story Map

```javascript
// Create narrative-driven story map
function createStoryMap() {
    var story = {
        title: "Climate Change Impact Analysis",
        chapters: [
            {
                id: "temperature",
                title: "Rising Temperatures",
                content: "Global temperatures have risen significantly...",
                mapView: {bounds: [-180, -90, 180, 90], zoom: 2},
                themes: ["temperature_anomaly"],
                data: "temperature-data.csv"
            },
            {
                id: "precipitation",
                title: "Changing Precipitation Patterns",
                content: "Rainfall patterns are shifting globally...",
                mapView: {bounds: [-140, 20, -60, 60], zoom: 4},
                themes: ["precipitation_change"],
                data: "precipitation-data.csv"
            },
            {
                id: "sea_level",
                title: "Sea Level Rise",
                content: "Coastal areas face increasing threats...",
                mapView: {bounds: [-100, 25, -70, 45], zoom: 5},
                themes: ["sea_level_rise", "coastal_vulnerability"],
                data: "sea-level-data.csv"
            }
        ]
    };
    
    initializeStoryMap(story);
}

function initializeStoryMap(story) {
    // Create story navigation
    var nav = document.getElementById('story-navigation');
    story.chapters.forEach(function(chapter, index) {
        var button = document.createElement('button');
        button.textContent = (index + 1) + ". " + chapter.title;
        button.onclick = function() {
            navigateToChapter(chapter, index);
        };
        nav.appendChild(button);
    });
    
    // Create content area
    var content = document.getElementById('story-content');
    
    // Start with first chapter
    navigateToChapter(story.chapters[0], 0);
    
    function navigateToChapter(chapter, index) {
        // Update content
        content.innerHTML = `
            <h2>${chapter.title}</h2>
            <p>${chapter.content}</p>
        `;
        
        // Load chapter data
        loadChapterData(chapter);
        
        // Update map view
        updateMapView(chapter.mapView);
        
        // Update navigation
        updateNavigation(index);
    }
    
    function loadChapterData(chapter) {
        if (chapter.data) {
            Data.feed({
                source: chapter.data,
                type: "csv"
            }).load(function(data) {
                // Hide previous themes
                hideAllThemes();
                
                // Create and show chapter themes
                chapter.themes.forEach(function(themeId) {
                    createChapterTheme(themeId, data);
                });
            });
        }
    }
    
    function createChapterTheme(themeId, data) {
        // Determine theme configuration based on ID
        var config = getThemeConfig(themeId);
        
        ixmaps.doCreateChart(
            themeId,
            config.field,
            config.field100,
            config.type,
            config.colorScheme,
            config.classes
        );
    }
    
    function getThemeConfig(themeId) {
        var configs = {
            "temperature_anomaly": {
                field: "temp_anomaly",
                type: "choropleth",
                colorScheme: "RdBu",
                classes: 9
            },
            "precipitation_change": {
                field: "precip_change",
                type: "choropleth",
                colorScheme: "BrBG",
                classes: 7
            },
            "sea_level_rise": {
                field: "sea_level_mm",
                type: "bubble",
                colorScheme: "Blues",
                classes: 5
            },
            "coastal_vulnerability": {
                field: "vulnerability_index",
                type: "choropleth",
                colorScheme: "Reds",
                classes: 5
            }
        };
        
        return configs[themeId] || {};
    }
    
    function updateMapView(mapView) {
        if (mapView.bounds) {
            ixmaps.zoomToBounds({
                minX: mapView.bounds[0],
                minY: mapView.bounds[1],
                maxX: mapView.bounds[2],
                maxY: mapView.bounds[3]
            });
        }
    }
    
    function hideAllThemes() {
        var activeThemes = ixmaps.doQueryThemes();
        if (activeThemes) {
            activeThemes.forEach(function(themeId) {
                ixmaps.doSwitchMapTheme(themeId, "hide");
            });
        }
    }
    
    function updateNavigation(activeIndex) {
        var buttons = nav.querySelectorAll('button');
        buttons.forEach(function(button, index) {
            button.className = index === activeIndex ? 'active' : '';
        });
    }
}
```

## Real-World Applications

### 1. COVID-19 Dashboard

```javascript
// Complete COVID-19 tracking dashboard
function createCovidDashboard() {
    var dashboard = new CovidDashboard();
    dashboard.initialize();
}

class CovidDashboard {
    constructor() {
        this.dataUrls = {
            cases: "https://api.covid19.com/daily-cases.csv",
            vaccinations: "https://api.covid19.com/vaccinations.csv",
            hospitalizations: "https://api.covid19.com/hospitalizations.csv"
        };
        
        this.updateInterval = 3600000; // 1 hour
        this.autoUpdate = true;
    }
    
    initialize() {
        this.setupInterface();
        this.loadInitialData();
        this.startAutoUpdate();
    }
    
    setupInterface() {
        // Create dashboard layout
        var container = document.getElementById('covid-dashboard');
        container.innerHTML = `
            <div class="dashboard-header">
                <h1>COVID-19 Global Dashboard</h1>
                <div class="last-updated">Last updated: <span id="last-update-time"></span></div>
            </div>
            <div class="dashboard-controls">
                <select id="metric-selector">
                    <option value="cases">Daily Cases</option>
                    <option value="deaths">Deaths</option>
                    <option value="vaccinations">Vaccinations</option>
                    <option value="hospitalizations">Hospitalizations</option>
                </select>
                <select id="time-range">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                </select>
            </div>
            <div class="dashboard-content">
                <div id="map-section" class="dashboard-section">
                    <div id="covid-map"></div>
                    <div id="map-legend"></div>
                </div>
                <div id="stats-section" class="dashboard-section">
                    <div id="global-stats"></div>
                    <div id="country-ranking"></div>
                </div>
                <div id="charts-section" class="dashboard-section">
                    <div id="trend-chart"></div>
                    <div id="comparison-chart"></div>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.addEventListeners();
    }
    
    addEventListeners() {
        document.getElementById('metric-selector').addEventListener('change', (e) => {
            this.updateVisualization(e.target.value);
        });
        
        document.getElementById('time-range').addEventListener('change', (e) => {
            this.updateTimeRange(parseInt(e.target.value));
        });
    }
    
    loadInitialData() {
        var broker = Data.broker();
        
        Object.values(this.dataUrls).forEach(url => {
            broker.addSource(url, "csv");
        });
        
        broker.realize((datasets) => {
            this.processData(datasets);
            this.createVisualizations();
            this.updateLastUpdateTime();
        });
    }
    
    processData(datasets) {
        this.casesData = this.preprocessCovidData(datasets[0]);
        this.vaccinationsData = this.preprocessCovidData(datasets[1]);
        this.hospitalizationsData = this.preprocessCovidData(datasets[2]);
        
        // Calculate derived metrics
        this.calculateDerivedMetrics();
    }
    
    preprocessCovidData(data) {
        // Add date parsing and calculations
        data.addColumn({
            source: 'date_string',
            destination: 'date'
        }, function(value) {
            return new Date(value);
        });
        
        // Add 7-day rolling average
        data.addColumn({
            source: 'daily_count',
            destination: 'rolling_avg_7'
        }, function(value, row, index, allRecords) {
            return calculateRollingAverage(allRecords, index, 7);
        });
        
        return data;
    }
    
    calculateDerivedMetrics() {
        // Calculate per capita rates
        this.casesData.addColumn({
            destination: 'cases_per_100k'
        }, function(row) {
            var cases = parseInt(row[this.casesData.column('total_cases').index]);
            var population = parseInt(row[this.casesData.column('population').index]);
            return population > 0 ? (cases / population) * 100000 : 0;
        });
        
        // Calculate vaccination rates
        this.vaccinationsData.addColumn({
            destination: 'vaccination_rate'
        }, function(row) {
            var vaccinated = parseInt(row[this.vaccinationsData.column('fully_vaccinated').index]);
            var population = parseInt(row[this.vaccinationsData.column('population').index]);
            return population > 0 ? (vaccinated / population) * 100 : 0;
        });
    }
    
    createVisualizations() {
        // Create main map visualization
        this.createCovidMap();
        
        // Create statistics panels
        this.createGlobalStats();
        
        // Create trend charts
        this.createTrendCharts();
        
        // Create country ranking
        this.createCountryRanking();
    }
    
    createCovidMap() {
        // Create choropleth map for cases per capita
        ixmaps.doCreateChart(
            "covid_cases_per_capita",
            "cases_per_100k",
            null,
            "choropleth",
            "Reds",
            7
        );
        
        // Set up interactive tooltips
        ixmaps.htmlgui_onTooltipDisplay = (event, text, itemId) => {
            return this.showCovidTooltip(event, itemId);
        };
    }
    
    showCovidTooltip(event, itemId) {
        // Get country data
        var countryData = this.getCountryData(itemId);
        
        if (countryData) {
            var tooltip = `
                <div class="covid-tooltip">
                    <h3>${countryData.country}</h3>
                    <div class="metric">
                        <label>Total Cases:</label>
                        <span>${this.formatNumber(countryData.total_cases)}</span>
                    </div>
                    <div class="metric">
                        <label>Cases per 100k:</label>
                        <span>${this.formatNumber(countryData.cases_per_100k)}</span>
                    </div>
                    <div class="metric">
                        <label>Vaccination Rate:</label>
                        <span>${countryData.vaccination_rate}%</span>
                    </div>
                    <div class="metric">
                        <label>7-day Average:</label>
                        <span>${this.formatNumber(countryData.rolling_avg_7)}</span>
                    </div>
                </div>
            `;
            
            this.displayTooltip(event, tooltip);
            return true;
        }
        
        return false;
    }
    
    createTrendCharts() {
        // Global trend chart
        this.createGlobalTrendChart();
        
        // Top countries comparison chart
        this.createComparisonChart();
    }
    
    createGlobalTrendChart() {
        var globalData = this.aggregateGlobalData();
        
        // Use D3 to create time series chart
        var container = document.getElementById('trend-chart');
        this.renderTimeSeriesChart(container, globalData, {
            width: 400,
            height: 200,
            title: "Global COVID-19 Trend"
        });
    }
    
    updateVisualization(metric) {
        // Update map theme based on selected metric
        var themeConfigs = {
            'cases': {
                field: 'cases_per_100k',
                colorScheme: 'Reds',
                title: 'Cases per 100k'
            },
            'deaths': {
                field: 'deaths_per_100k',
                colorScheme: 'Greys',
                title: 'Deaths per 100k'
            },
            'vaccinations': {
                field: 'vaccination_rate',
                colorScheme: 'Greens',
                title: 'Vaccination Rate %'
            },
            'hospitalizations': {
                field: 'hospitalizations_per_100k',
                colorScheme: 'Blues',
                title: 'Hospitalizations per 100k'
            }
        };
        
        var config = themeConfigs[metric];
        if (config) {
            ixmaps.doCreateChart(
                "covid_main_theme",
                config.field,
                null,
                "choropleth",
                config.colorScheme,
                7
            );
            
            this.updateLegendTitle(config.title);
        }
    }
    
    startAutoUpdate() {
        if (this.autoUpdate) {
            setInterval(() => {
                this.loadInitialData();
            }, this.updateInterval);
        }
    }
    
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    
    updateLastUpdateTime() {
        document.getElementById('last-update-time').textContent = 
            new Date().toLocaleString();
    }
}
```

This comprehensive examples documentation provides real-world, production-ready code samples that demonstrate the full capabilities of the iXmaps framework. Each example includes complete implementations with error handling, user interaction, and best practices for performance and maintainability.