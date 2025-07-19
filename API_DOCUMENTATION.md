# iXmaps Framework - Complete API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Data.js Library](#datajs-library)
3. [iXmaps Core API](#ixmaps-core-api)
4. [UI Components](#ui-components)
5. [Chart Components](#chart-components)
6. [Utilities](#utilities)
7. [Examples](#examples)

## Overview

The iXmaps framework is a comprehensive JavaScript library for creating interactive web maps with data visualization capabilities. It consists of several main components:

- **Data.js**: A powerful data processing library for loading, parsing, and transforming various data sources (CSV, JSON, GeoJSON, KML, RSS)
- **iXmaps Core**: SVG-based mapping framework with theming, querying, and visualization capabilities
- **UI Components**: HTML interface components for map interaction, legends, tooltips, and controls
- **Chart Components**: D3.js-based charting extensions for data visualization

---

## Data.js Library

### Core Classes

#### Data.Feed

The primary class for loading external data sources.

```javascript
/**
 * Creates a new Data.Feed instance for loading external data
 * @param {Object} options - Configuration options
 * @param {string} options.source - URL or path to data source
 * @param {string} options.type - Data type: 'csv', 'json', 'geojson', 'kml', 'rss', 'jsonstat', 'topojson'
 * @param {boolean} [options.cache=true] - Whether to cache the data
 * @param {Object} [options.parser] - Parser-specific options
 * @constructor
 */
Data.Feed = function(options)
```

**Methods:**

```javascript
/**
 * Load data with success callback
 * @param {Function} callback - Success callback function receiving Data.Table
 * @returns {Data.Feed} - Returns self for chaining
 */
.load(callback)

/**
 * Set error callback
 * @param {Function} callback - Error callback function
 * @returns {Data.Feed} - Returns self for chaining
 */
.error(callback)

/**
 * Create a data broker for loading multiple sources
 * @param {Object} options - Broker configuration
 * @returns {Data.Broker} - New broker instance
 */
.broker(options)
```

**Example:**
```javascript
// Load CSV data
var feed = Data.feed({
    source: "https://example.com/data.csv",
    type: "csv"
}).load(function(dataTable) {
    // Process loaded data
    console.log("Loaded", dataTable.table.records, "records");
    
    // Add calculated column
    dataTable.addColumn({
        source: 'timestamp',
        destination: 'date'
    }, function(value) {
        return new Date(value).toLocaleDateString();
    });
    
    // Create pivot table
    var pivot = dataTable.pivot({
        lead: 'date',
        cols: 'category',
        sum: ['amount']
    });
    
}).error(function(error) {
    console.error("Data loading failed:", error);
});
```

#### Data.Table

Represents a data table with transformation capabilities.

```javascript
/**
 * Creates a new Data.Table instance
 * @param {Object} [table] - Existing table data
 * @constructor
 */
Data.Table = function(table)
```

**Properties:**
- `table.records` - Number of records
- `table.fields` - Number of fields
- `fields` - Array of field definitions
- `records` - Array of data rows

**Methods:**

```javascript
/**
 * Add a new column with optional transformation function
 * @param {Object} options - Column configuration
 * @param {string} [options.source] - Source column name
 * @param {string} options.destination - Destination column name
 * @param {Function} [transform] - Transformation function
 * @returns {Data.Table} - Returns self for chaining
 */
.addColumn(options, transform)

/**
 * Get a column by name
 * @param {string} name - Column name
 * @returns {Data.Column|null} - Column object or null
 */
.column(name)

/**
 * Create pivot table
 * @param {Object} options - Pivot configuration
 * @param {string|Array} options.lead - Row grouping column(s)
 * @param {string|Array} [options.cols] - Column grouping field(s)
 * @param {Array} [options.sum] - Fields to sum
 * @param {Array} [options.keep] - Fields to keep unchanged
 * @param {string} [options.calc] - Calculation method: 'sum', 'mean'
 * @returns {Data.Table} - New pivot table
 */
.pivot(options)

/**
 * Filter records based on condition
 * @param {Function} condition - Filter function
 * @returns {Data.Table} - New filtered table
 */
.filter(condition)

/**
 * Sort table by column
 * @param {string} column - Column name to sort by
 * @param {string} [direction] - 'UP' or 'DOWN'
 * @returns {Data.Table} - Returns self for chaining
 */
.sort(column, direction)

/**
 * Reverse record order
 * @returns {Data.Table} - Returns self for chaining
 */
.revert()

/**
 * Get table as JSON array
 * @returns {Array} - Array of objects
 */
.json()

/**
 * Get table as 2D array
 * @returns {Array} - Array of arrays
 */
.getArray()
```

**Example:**
```javascript
// Transform and analyze data
var processedData = dataTable
    .addColumn({destination: 'year'}, function(row) {
        return new Date(row[0]).getFullYear();
    })
    .filter(function(row) {
        return parseInt(row[1]) > 100; // Filter by value > 100
    })
    .sort('year', 'UP')
    .pivot({
        lead: 'year',
        cols: 'category',
        sum: ['amount', 'count']
    });
```

#### Data.Column

Represents a single column with value manipulation methods.

```javascript
/**
 * Get all values in the column
 * @returns {Array} - Array of column values
 */
.values()

/**
 * Apply transformation to all values
 * @param {Function} transform - Transformation function
 * @returns {Data.Column} - Returns self for chaining
 */
.map(transform)

/**
 * Rename the column
 * @param {string} newName - New column name
 * @returns {Data.Column} - Returns self for chaining
 */
.rename(newName)
```

#### Data.Broker

For loading and combining multiple data sources.

```javascript
/**
 * Creates a new Data.Broker instance
 * @param {Object} options - Broker configuration
 * @constructor
 */
Data.Broker = function(options)

/**
 * Add a data source to the broker
 * @param {string} url - Data source URL
 * @param {string} type - Data type
 * @returns {Data.Broker} - Returns self for chaining
 */
.addSource(url, type)

/**
 * Realize all data loading with callback
 * @param {Function} callback - Success callback
 * @returns {Data.Broker} - Returns self for chaining
 */
.realize(callback)
```

### Factory Methods

```javascript
/**
 * Create a new data feed
 * @param {Object} options - Feed options
 * @returns {Data.Feed} - New feed instance
 */
Data.feed(options)

/**
 * Import JavaScript object as data
 * @param {Object} options - Import options
 * @returns {Data.Table} - Data table
 */
Data.import(options)

/**
 * Create a data broker
 * @returns {Data.Broker} - New broker instance
 */
Data.broker()

/**
 * Create a data merger
 * @returns {Data.Merger} - New merger instance
 */
Data.merger()
```

---

## iXmaps Core API

### Map Control

#### Map Loading and Configuration

```javascript
/**
 * Set map features and behavior
 * @param {string} features - Feature configuration string
 * Format: "feature1:value1;feature2:value2"
 * Features: featurescaling, dynamiclabel, dynamiclayer, dynamictiles, 
 *          discardtiles, loadmultitiles, fastpan, clipmap, checklabeloverlap
 */
ixmaps.setMapFeatures(features)

/**
 * Get current map features
 * @returns {string} - Current features string
 */
ixmaps.getMapFeatures()

/**
 * Load SVG map from URL
 * @param {string} url - Map SVG URL
 * @param {Function} [callback] - Success callback
 */
ixmaps.loadMap(url, callback)
```

#### Theme Management

```javascript
/**
 * Switch map theme on/off
 * @param {string} themeId - Theme identifier
 * @param {string} [flag] - 'toggle', 'show', 'hide'
 * @returns {boolean} - Success status
 */
ixmaps.doSwitchMapTheme(themeId, flag)

/**
 * Get active theme
 * @returns {string|null} - Active theme ID
 */
ixmaps.doQueryActiveTheme()

/**
 * Get all available themes
 * @returns {Array|null} - Array of theme IDs
 */
ixmaps.doQueryThemes()

/**
 * Get themes with detailed information
 * @returns {Object|null} - Themes object with metadata
 */
ixmaps.doQueryThemesWithInfo()

/**
 * Get themes that have selections
 * @returns {Array|null} - Array of theme IDs with selections
 */
ixmaps.doQueryThemesWithSelection()
```

#### Data Querying

```javascript
/**
 * Get fields of a theme
 * @param {string} themeId - Theme identifier
 * @returns {Array} - Array of field names
 */
ixmaps.doQueryFields(themeId)

/**
 * Get unique values of a field in a theme
 * @param {string} themeId - Theme identifier
 * @param {string} fieldName - Field name
 * @param {number} [maxCount] - Maximum number of values
 * @returns {Array} - Array of unique values
 */
ixmaps.doQueryValues(themeId, fieldName, maxCount)

/**
 * Get selection values of a theme
 * @param {string} themeId - Theme identifier
 * @param {number} [maxCount] - Maximum number of values
 * @returns {Array} - Array of selected values
 */
ixmaps.doQuerySelectionValues(themeId, maxCount)
```

#### Chart Creation

```javascript
/**
 * Create a chart theme
 * @param {string} themeId - Theme identifier
 * @param {string} fieldName - Data field
 * @param {string} [field100] - Normalization field for percentages
 * @param {string} type - Chart type: 'column', 'bar', 'pie', 'bubble', etc.
 * @param {string} [colorScheme] - Color scheme name
 * @param {number} [classes] - Number of color classes
 * @returns {boolean} - Success status
 */
ixmaps.doCreateChart(themeId, fieldName, field100, type, colorScheme, classes)

/**
 * Create chart with current UI settings
 * @returns {boolean} - Success status
 */
ixmaps.createChart()
```

#### Search Functionality

```javascript
/**
 * Initialize normal search interface
 */
ixmaps.InitNormalSearch()

/**
 * Initialize advanced search for theme
 * @param {string} themeId - Theme identifier
 */
ixmaps.InitAdvancedSearch(themeId)

/**
 * Search map with query
 * @param {string} query - Search query
 * @param {string} [method] - Search method
 * @param {string} [themeId] - Target theme
 * @returns {boolean} - Success status
 */
ixmaps.doSearchMap(query, method, themeId)

/**
 * Perform advanced search
 * @param {string} query - Advanced search query
 * @param {string} themeId - Target theme
 * @returns {boolean} - Success status
 */
ixmaps.doAdvancedSearchMap(query, themeId)

/**
 * Go to search result by index
 * @param {number} index - Result index
 * @param {string} [mode] - Display mode
 * @param {number} [zoom] - Zoom level
 */
ixmaps.gotoSearchMapResult(index, mode, zoom)
```

### Map Navigation

```javascript
/**
 * Zoom to specific level
 * @param {number} level - Zoom level
 */
ixmaps.zoomTo(level)

/**
 * Pan map by offset
 * @param {number} x - X offset
 * @param {number} y - Y offset
 */
ixmaps.panBy(x, y)

/**
 * Zoom to bounding box
 * @param {Object} bounds - Bounding box {minX, minY, maxX, maxY}
 */
ixmaps.zoomToBounds(bounds)

/**
 * Get current map bounds
 * @returns {Object} - Current bounds object
 */
ixmaps.getBounds()
```

---

## UI Components

### HTML GUI Core

```javascript
/**
 * HTML GUI namespace containing map interface functions
 * @namespace ixmaps.htmlgui
 */
```

#### Initialization Functions

```javascript
/**
 * Initialize chart interface for theme
 * @param {string} themeId - Theme identifier
 */
ixmaps.InitChart(themeId)

/**
 * Initialize chart fields selection
 * @param {string} themeId - Theme identifier
 */
ixmaps.InitChartFields(themeId)

/**
 * Initialize chart values selection
 */
ixmaps.InitChartValues()

/**
 * Initialize advanced search fields
 * @param {string} themeId - Theme identifier
 */
ixmaps.InitAdvancedSearchFields(themeId)

/**
 * Initialize advanced search values
 */
ixmaps.InitAdvancedSearchValues()
```

### Tooltip System

#### Basic Tooltips

```javascript
/**
 * Display tooltip
 * @param {Event} event - Mouse event
 * @param {string} text - Tooltip text or HTML
 * @param {string} [itemId] - SVG item ID
 * @returns {boolean} - Success status
 */
ixmaps.htmlgui_onTooltipDisplay(event, text, itemId)

/**
 * Delete current tooltip
 * @returns {boolean} - Success status
 */
ixmaps.htmlgui_onTooltipDelete()

/**
 * Handle item mouseover
 * @param {Event} event - Mouse event
 * @param {string} itemId - SVG item ID
 * @param {Object} [shape] - Shape object
 * @returns {boolean} - Success status
 */
ixmaps.htmlgui_onItemOver(event, itemId, shape)

/**
 * Handle item click
 * @param {Event} event - Mouse event
 * @param {string} itemId - SVG item ID
 * @param {Object} [shape] - Shape object
 * @returns {boolean} - Success status
 */
ixmaps.htmlgui_onItemClick(event, itemId, shape)
```

#### Advanced Tooltips (Mustache Templates)

```javascript
/**
 * Display templated tooltip
 * @param {Event} event - Mouse event
 * @param {string} template - Mustache template string
 * @param {string} itemId - SVG item ID
 * @returns {boolean} - Success status
 */
ixmaps.htmlgui_onTooltipDisplay(event, template, itemId)
```

### Legend Components

#### Theme Legends

```javascript
/**
 * Toggle value display for theme
 * @param {string} themeId - Theme identifier
 */
ixmaps.toggleValueDisplay(themeId)

/**
 * Change theme dynamic parameters
 * @param {string} themeId - Theme identifier
 * @param {string} parameter - Parameter name
 * @param {string} factor - Factor value
 */
ixmaps.changeThemeDynamic(themeId, parameter, factor)

/**
 * Callback when new theme is created
 * @param {string} themeId - Theme identifier
 */
ixmaps.htmlgui_onNewTheme(themeId)

/**
 * Callback when theme is drawn
 * @param {string} themeId - Theme identifier
 */
ixmaps.htmlgui_onDrawTheme(themeId)

/**
 * Callback when theme is removed
 * @param {string} themeId - Theme identifier
 */
ixmaps.htmlgui_onRemoveTheme(themeId)

/**
 * Create chart menu HTML
 * @param {string} themeId - Theme identifier
 * @returns {string} - HTML string for chart menu
 */
ixmaps.makeChartMenueHTML(themeId)
```

#### Layer Legends

```javascript
/**
 * Switch layer visibility
 * @param {HTMLElement} element - Calling element
 * @param {string} layerName - Layer name
 */
ixmaps.__switchLayer(element, layerName)

/**
 * Switch master layer visibility
 * @param {HTMLElement} element - Calling element
 * @param {string} layerName - Layer name
 */
ixmaps.__switchMasterLayer(element, layerName)

/**
 * Get layer legend SVG
 * @param {string} layerName - Layer name
 * @param {string} categoryName - Category name
 * @param {string} fill - Fill color
 * @param {string} stroke - Stroke color
 * @returns {string} - SVG string for legend
 */
ixmaps.__getLayerLegendSVG(layerName, categoryName, fill, stroke)

/**
 * Create layer legend
 * @param {number} [maxHeight] - Maximum legend height
 * @returns {string} - HTML string for layer legend
 */
ixmaps.makeLayerLegend(maxHeight)
```

### Data Visualization Components

#### List Components

```javascript
/**
 * Create item list from data
 * @param {string} filter - Filter criteria
 * @param {string} targetDiv - Target div ID
 * @param {string} itemId - Item identifier
 */
ixmaps.data.makeItemList(filter, targetDiv, itemId)

/**
 * Create item list with charts
 * @param {string} filter - Filter criteria
 * @param {string} targetDiv - Target div ID
 * @param {string} itemId - Item identifier
 */
ixmaps.data.makeItemList_charts(filter, targetDiv, itemId)

/**
 * Draw chart for specific item
 * @param {string} itemId - Item identifier
 * @param {number} index - Chart index
 * @param {Array} itemIds - Array of item IDs
 * @param {string} [flag] - Display flag
 */
ixmaps.data.drawChart(itemId, index, itemIds, flag)
```

#### Facet Components

```javascript
/**
 * Get facets for data filtering
 * @param {string} filter - Filter criteria
 * @param {string} targetDiv - Target div ID
 * @param {Array} fields - Array of field names
 * @param {string} itemId - Item identifier
 * @param {string} mapId - Map identifier
 * @param {boolean} flag - Processing flag
 */
ixmaps.data.getFacets(filter, targetDiv, fields, itemId, mapId, flag)

/**
 * Show facets in interface
 * @param {string} filter - Filter criteria
 * @param {string} targetDiv - Target div ID
 * @param {Array} facets - Facets array
 */
ixmaps.data.showFacets(filter, targetDiv, facets)

/**
 * Create facets interface
 * @param {string} filter - Filter criteria
 * @param {string} targetDiv - Target div ID
 */
ixmaps.data.makeFacets(filter, targetDiv)
```

### Utility Functions

#### Formatting

```javascript
/**
 * Format numeric value
 * @param {number} value - Number to format
 * @param {number} [precision] - Decimal precision
 * @param {string} [flag] - Formatting flag ('CEIL', 'FLOOR')
 * @returns {string} - Formatted value
 */
ixmaps.formatValue(value, precision, flag)

/**
 * Auto-format value with best precision
 * @param {number} value - Number to format
 * @returns {string} - Formatted value
 */
ixmaps.bestFormatValue(value)

/**
 * Internal formatting function
 * @param {number} value - Number to format
 * @param {number} precision - Decimal precision
 * @param {string} flag - Formatting flag
 * @returns {string} - Formatted value
 */
ixmaps.__formatValue(value, precision, flag)
```

#### Color Schemes

```javascript
/**
 * Get color swatches
 * @param {string} colorSelect - Color selection
 * @param {string} [flag] - Processing flag
 * @returns {Array} - Array of color swatches
 */
ixmaps.getColorSwatches(colorSelect, flag)

/**
 * Set colors for selection
 * @param {string} colorSelect - Color selection
 * @param {string} [flag] - Processing flag
 * @param {number} [maxLen] - Maximum length
 */
ixmaps.setColors(colorSelect, flag, maxLen)

/**
 * Get colors array
 * @param {string} colorSelect - Color selection
 * @returns {Array} - Array of colors
 */
ixmaps.getColors(colorSelect)

/**
 * Get colors from color scheme
 * @param {string} schemeName - Color scheme name
 * @returns {Array} - Array of colors
 */
ixmaps.getColorsFromColorScheme(schemeName)
```

#### Storage

```javascript
/**
 * Store object in browser storage
 * @param {string} key - Storage key
 * @param {Object} object - Object to store
 */
ixmaps.storeObject(key, object)

/**
 * Get stored object from browser storage
 * @param {string} key - Storage key
 * @returns {Object|null} - Retrieved object or null
 */
ixmaps.getStoredObject(key)

/**
 * Set application ID for storage namespace
 * @param {string} appId - Application identifier
 */
ixmaps.setAppId(appId)
```

---

## Chart Components

### D3.js Chart Extensions

#### Pinnacle Chart

```javascript
/**
 * Initialize pinnacle chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @param {string} args.target - Target element ID
 * @param {Array} args.data - Chart data
 * @param {Object} [args.style] - Chart styling options
 */
ixmaps.pinnacleChart_init(svgDoc, args)

/**
 * Create pinnacle chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @returns {Object} - Chart object
 */
ixmaps.pinnacleChart(svgDoc, args)
```

#### Arrow Chart

```javascript
/**
 * Initialize arrow chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @param {string} args.target - Target element ID
 * @param {Array} args.data - Chart data
 * @param {Object} [args.style] - Chart styling options
 */
ixmaps.arrowChart_init(svgDoc, args)

/**
 * Create arrow chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @returns {Object} - Chart object
 */
ixmaps.arrowChart(svgDoc, args)
```

#### Lollipop Chart

```javascript
/**
 * Initialize lollipop chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @param {string} args.target - Target element ID
 * @param {Array} args.data - Chart data
 * @param {Object} [args.style] - Chart styling options
 */
ixmaps.lolliChart_init(svgDoc, args)

/**
 * Create lollipop chart
 * @param {SVGDocument} svgDoc - SVG document
 * @param {Object} args - Chart arguments
 * @returns {Object} - Chart object
 */
ixmaps.lolliChart(svgDoc, args)
```

---

## Examples

### Complete Data Processing Example

```javascript
// Load and process earthquake data
var earthquakeData = Data.feed({
    source: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.csv",
    type: "csv"
}).load(function(data) {
    
    // Add calculated fields
    data.addColumn({
        source: 'time',
        destination: 'date'
    }, function(value) {
        return new Date(value).toLocaleDateString();
    });
    
    data.addColumn({
        source: 'mag',
        destination: 'magnitude_category'
    }, function(value) {
        var mag = parseFloat(value);
        if (mag < 2) return 'Minor';
        if (mag < 4) return 'Light';
        if (mag < 5) return 'Moderate';
        if (mag < 6) return 'Strong';
        return 'Major';
    });
    
    // Create daily magnitude summary
    var dailySummary = data.pivot({
        lead: 'date',
        cols: 'magnitude_category',
        sum: ['mag'],
        calc: 'mean'
    });
    
    // Filter significant earthquakes
    var significantQuakes = data.filter(function(row) {
        return parseFloat(row[data.column('mag').index]) >= 4.0;
    });
    
    console.log("Daily earthquake summary:", dailySummary.json());
    console.log("Significant earthquakes:", significantQuakes.table.records);
    
}).error(function(error) {
    console.error("Failed to load earthquake data:", error);
});
```

### Interactive Map with Custom Theme

```javascript
// Initialize map with earthquake visualization
ixmaps.setMapFeatures("featurescaling:dynamic;dynamiclayer:true;fastpan:true");

// Load earthquake data and create map theme
var mapConfig = {
    source: "earthquake_data.geojson",
    type: "geojson"
};

Data.feed(mapConfig).load(function(geoData) {
    
    // Create magnitude-based bubble chart theme
    ixmaps.doCreateChart(
        "earthquake_magnitude",  // theme ID
        "mag",                   // magnitude field
        null,                    // no normalization
        "bubble",                // chart type
        "Reds",                  // color scheme
        5                        // number of classes
    );
    
    // Initialize search for earthquake data
    ixmaps.InitAdvancedSearch("earthquake_magnitude");
    
    // Set up tooltip template
    var tooltipTemplate = `
        <div class="earthquake-tooltip">
            <h3>Earthquake Event</h3>
            <p><strong>Magnitude:</strong> {{mag}}</p>
            <p><strong>Location:</strong> {{place}}</p>
            <p><strong>Time:</strong> {{time}}</p>
            <p><strong>Depth:</strong> {{depth}} km</p>
        </div>
    `;
    
    // Enable interactive tooltips
    ixmaps.htmlgui_onTooltipDisplay = function(event, text, itemId) {
        // Custom tooltip handling
        return true;
    };
    
});
```

### Multi-Source Data Visualization

```javascript
// Load multiple data sources for comprehensive analysis
var dataBroker = Data.broker()
    .addSource("population.csv", "csv")
    .addSource("economic_data.json", "json")
    .addSource("geographic_boundaries.geojson", "geojson")
    .realize(function(combinedData) {
        
        // Process each data source
        var population = combinedData[0];
        var economics = combinedData[1];
        var boundaries = combinedData[2];
        
        // Create correlation analysis
        population.addColumn({
            destination: 'gdp_per_capita'
        }, function(row) {
            var regionId = row[population.column('region_id').index];
            var economicRow = economics.records.find(function(eRow) {
                return eRow[economics.column('region_id').index] === regionId;
            });
            return economicRow ? economicRow[economics.column('gdp').index] : 0;
        });
        
        // Create choropleth map
        ixmaps.doCreateChart(
            "gdp_choropleth",
            "gdp_per_capita",
            null,
            "choropleth",
            "YlOrRd",
            7
        );
        
        // Add interactive legend
        ixmaps.htmlgui_onDrawTheme("gdp_choropleth");
        
        // Create data facets for filtering
        ixmaps.data.getFacets(
            "region_type,population_density",
            "facet-container",
            ["region_type", "population_density"],
            "gdp_choropleth",
            "main-map",
            true
        );
        
    });
```

### Custom Chart Component

```javascript
// Create custom D3 chart extension
ixmaps.customLineChart = function(svgDoc, args) {
    
    var data = args.data;
    var target = svgDoc.getElementById(args.target);
    var width = args.style.width || 300;
    var height = args.style.height || 200;
    
    // D3 chart implementation
    var svg = d3.select(target)
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    
    var x = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, width]);
    
    var y = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return d.y; }))
        .range([height, 0]);
    
    var line = d3.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });
    
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", args.style.stroke || "#333")
        .style("fill", "none");
    
    return {
        update: function(newData) {
            // Update chart with new data
        },
        destroy: function() {
            svg.remove();
        }
    };
};

// Use custom chart
ixmaps.customLineChart(document, {
    target: "chart-container",
    data: timeSeriesData,
    style: {
        width: 400,
        height: 250,
        stroke: "#2E8B57"
    }
});
```

---

## Configuration Options

### Data Loading Options

```javascript
var dataOptions = {
    source: "data.csv",           // Data source URL
    type: "csv",                  // Data type
    cache: true,                  // Enable caching
    parser: {                     // Parser-specific options
        header: true,             // CSV has header row
        delimiter: ",",           // CSV delimiter
        skipEmptyLines: true      // Skip empty lines
    }
};
```

### Map Configuration

```javascript
var mapFeatures = [
    "featurescaling:dynamic",     // Scale features with zoom
    "dynamiclayer:true",          // Dynamic layer switching
    "dynamictiles:true",          // Dynamic tile loading
    "fastpan:true",               // Fast panning
    "clipmap:true",               // Clip map to bounds
    "checklabeloverlap:true"      // Check label overlap
].join(";");

ixmaps.setMapFeatures(mapFeatures);
```

### Theme Configuration

```javascript
var themeConfig = {
    id: "population_density",
    field: "density",
    type: "choropleth",
    colorScheme: "Blues",
    classes: 7,
    range: {
        min: 0,
        max: 1000
    },
    style: {
        strokeWidth: 0.5,
        strokeColor: "#ffffff"
    }
};
```

This comprehensive documentation covers all major APIs, components, and usage patterns in the iXmaps framework. Each section includes detailed function signatures, parameters, return values, and practical examples.