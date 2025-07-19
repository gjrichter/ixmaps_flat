# Getting Started with iXmaps Framework

## Quick Start Guide

The iXmaps framework is a powerful JavaScript library for creating interactive web maps with data visualization capabilities. This guide will help you get started quickly.

## Installation

### Option 1: Direct File Inclusion

Include the required JavaScript files in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My iXmaps Application</title>
    <!-- Core Data.js library -->
    <script src="data.js/data.js"></script>
    
    <!-- iXmaps core library -->
    <script src="ui/js/htmlgui.js"></script>
    
    <!-- Optional: UI components -->
    <script src="ui/js/htmlgui_query.js"></script>
    <script src="ui/js/tools/tooltip.js"></script>
    <script src="ui/js/tools/legend.js"></script>
    
    <!-- Optional: Chart components -->
    <script src="usercharts/d3/chart.js"></script>
    
    <!-- D3.js (required for charts) -->
    <script src="https://d3js.org/d3.v6.min.js"></script>
    
    <!-- jQuery (optional but recommended) -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <div id="map-container"></div>
    <div id="legend-container"></div>
</body>
</html>
```

### Option 2: Module Import

If using a module system:

```javascript
// Import core components
import Data from './data.js/data.js';
import ixmaps from './ui/js/htmlgui.js';

// Import additional components as needed
import './ui/js/tools/tooltip.js';
import './ui/js/tools/legend.js';
```

## Basic Setup

### 1. Initialize the Map Container

Create a basic HTML structure for your map:

```html
<div id="mapcontainer" style="width: 100%; height: 600px;">
    <div id="map" style="width: 100%; height: 100%;"></div>
    <div id="legend" style="position: absolute; top: 10px; right: 10px;"></div>
    <div id="tooltip" style="position: absolute; display: none;"></div>
</div>
```

### 2. Configure Map Settings

Set up basic map configuration:

```javascript
// Configure map features
ixmaps.setMapFeatures("featurescaling:dynamic;dynamiclayer:true;fastpan:true");

// Set map root paths
ixmaps.dispatch = {
    svgRoot: "./maps/svg/maps/",
    appRoot: "app/"
};
```

### 3. Load Your First Map

```javascript
// Load a basic world map
ixmaps.loadMap("https://your-domain.com/maps/world.svg", function() {
    console.log("Map loaded successfully!");
});
```

## Your First Data Visualization

### Step 1: Prepare Your Data

```javascript
// Sample data - can be from CSV, JSON, or any supported format
var sampleData = [
    ["Country", "Population", "GDP"],
    ["USA", "331000000", "21430000"],
    ["China", "1440000000", "14340000"],
    ["Japan", "126000000", "5082000"],
    ["Germany", "83000000", "3846000"]
];

// Import data into Data.js
var dataTable = Data.import({
    data: sampleData,
    complete: function(table) {
        console.log("Data imported:", table.table.records, "records");
        createVisualization(table);
    }
});
```

### Step 2: Create a Simple Visualization

```javascript
function createVisualization(data) {
    // Create a bubble chart showing population vs GDP
    ixmaps.doCreateChart(
        "population_gdp",      // theme ID
        "Population",          // data field
        null,                  // no normalization field
        "bubble",              // chart type
        "Blues",               // color scheme
        5                      // number of classes
    );
    
    // Enable tooltips
    ixmaps.htmlgui_onTooltipDisplay = function(event, text, itemId) {
        var tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = text;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        tooltip.style.display = 'block';
        return true;
    };
    
    ixmaps.htmlgui_onTooltipDelete = function() {
        document.getElementById('tooltip').style.display = 'none';
        return true;
    };
}
```

## Loading External Data

### CSV Data Example

```javascript
// Load CSV data from URL
Data.feed({
    source: "https://example.com/world-population.csv",
    type: "csv"
}).load(function(data) {
    
    // Process the loaded data
    console.log("Loaded", data.table.records, "records");
    console.log("Fields:", data.fields.map(f => f.id));
    
    // Add a calculated field
    data.addColumn({
        source: 'population',
        destination: 'population_millions'
    }, function(value) {
        return Math.round(parseInt(value) / 1000000);
    });
    
    // Create visualization
    createPopulationMap(data);
    
}).error(function(error) {
    console.error("Failed to load data:", error);
});
```

### GeoJSON Data Example

```javascript
// Load GeoJSON geographic data
Data.feed({
    source: "countries.geojson",
    type: "geojson"
}).load(function(geoData) {
    
    // GeoJSON data is automatically processed
    console.log("Loaded geographic features:", geoData.table.records);
    
    // Create choropleth map
    ixmaps.doCreateChart(
        "countries_choropleth",
        "area_sqkm",
        null,
        "choropleth",
        "Greens",
        7
    );
    
});
```

## Data Processing Examples

### Filtering Data

```javascript
// Filter data based on conditions
var filteredData = data.filter(function(row) {
    var population = parseInt(row[data.column('population').index]);
    return population > 50000000; // Countries with >50M population
});

console.log("Large countries:", filteredData.table.records);
```

### Creating Pivot Tables

```javascript
// Group data by region and calculate totals
var regionSummary = data.pivot({
    lead: 'region',           // Group by region
    cols: 'development_level', // Split by development level
    sum: ['population', 'gdp'], // Sum these fields
    calc: 'sum'               // Calculation method
});

console.log("Regional summary:", regionSummary.json());
```

### Sorting and Transformation

```javascript
// Sort by population descending
data.sort('population', 'DOWN');

// Add percentage calculations
data.addColumn({
    destination: 'gdp_per_capita'
}, function(row) {
    var gdp = parseFloat(row[data.column('gdp').index]);
    var pop = parseFloat(row[data.column('population').index]);
    return Math.round(gdp / pop * 1000000); // GDP per capita
});
```

## Interactive Features

### Search Functionality

```javascript
// Initialize search interface
ixmaps.InitNormalSearch();

// Programmatic search
ixmaps.doSearchMap("United States", "contains", "countries_theme");

// Advanced search with multiple criteria
ixmaps.InitAdvancedSearch("countries_theme");
```

### Theme Management

```javascript
// Toggle theme visibility
ixmaps.doSwitchMapTheme("population_theme", "toggle");

// Query active themes
var activeThemes = ixmaps.doQueryThemes();
console.log("Active themes:", activeThemes);

// Get theme information
var themeInfo = ixmaps.doQueryThemesWithInfo();
console.log("Theme details:", themeInfo);
```

### Dynamic Theme Updates

```javascript
// Change theme parameters dynamically
ixmaps.changeThemeDynamic("population_theme", "scale", "2.0");

// Update color scheme
ixmaps.changeThemeDynamic("population_theme", "colorscheme", "Reds");
```

## Styling and Customization

### Custom CSS

```css
/* Map container styling */
#mapcontainer {
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Tooltip styling */
#tooltip {
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    max-width: 200px;
    z-index: 1000;
}

/* Legend styling */
#legend {
    background: white;
    padding: 15px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
}

/* Custom theme colors */
.custom-bubble {
    stroke: #333;
    stroke-width: 1px;
    opacity: 0.8;
}

.custom-bubble:hover {
    opacity: 1.0;
    stroke-width: 2px;
}
```

### Custom Tooltip Templates

```javascript
// Use Mustache templates for rich tooltips
var tooltipTemplate = `
<div class="country-info">
    <h3>{{name}}</h3>
    <div class="stats">
        <div class="stat">
            <label>Population:</label>
            <span>{{population_formatted}}</span>
        </div>
        <div class="stat">
            <label>GDP:</label>
            <span>${{gdp_formatted}}</span>
        </div>
        <div class="stat">
            <label>GDP per Capita:</label>
            <span>${{gdp_per_capita}}</span>
        </div>
    </div>
</div>
`;

// Apply template to tooltip display
ixmaps.htmlgui_onTooltipDisplay = function(event, data, itemId) {
    var rendered = Mustache.render(tooltipTemplate, data);
    // Display rendered HTML
    return true;
};
```

## Performance Optimization

### Data Caching

```javascript
// Enable caching for large datasets
Data.feed({
    source: "large-dataset.csv",
    type: "csv",
    cache: true  // Enable caching
}).load(function(data) {
    // Process cached data
});
```

### Efficient Map Features

```javascript
// Optimize for large datasets
ixmaps.setMapFeatures([
    "featurescaling:false",      // Disable scaling for performance
    "dynamiclayer:delayed",      // Delayed layer updates
    "fastpan:true",              // Fast panning
    "clipmap:dynamic"            // Dynamic clipping
].join(";"));
```

### Memory Management

```javascript
// Clean up resources when done
function cleanup() {
    // Remove event listeners
    ixmaps.htmlgui_onTooltipDisplay = null;
    ixmaps.htmlgui_onItemClick = null;
    
    // Clear data references
    dataTable = null;
    
    // Remove themes
    ixmaps.doSwitchMapTheme("my_theme", "hide");
}

// Call cleanup when page unloads
window.addEventListener('beforeunload', cleanup);
```

## Error Handling

### Data Loading Errors

```javascript
Data.feed({
    source: "data.csv",
    type: "csv"
}).load(function(data) {
    // Success handler
    processData(data);
}).error(function(error) {
    // Error handler
    console.error("Data loading failed:", error);
    
    // Show user-friendly message
    showErrorMessage("Failed to load data. Please try again.");
    
    // Fallback to default data
    loadDefaultData();
});
```

### Map Loading Errors

```javascript
function loadMapWithFallback(primaryUrl, fallbackUrl) {
    ixmaps.loadMap(primaryUrl, function() {
        console.log("Primary map loaded");
    }).catch(function(error) {
        console.warn("Primary map failed, trying fallback:", error);
        ixmaps.loadMap(fallbackUrl, function() {
            console.log("Fallback map loaded");
        });
    });
}
```

### Validation

```javascript
function validateData(data) {
    if (!data || !data.table || data.table.records === 0) {
        throw new Error("No data available");
    }
    
    // Check required fields
    var requiredFields = ['name', 'value'];
    requiredFields.forEach(function(field) {
        if (!data.column(field)) {
            throw new Error("Required field missing: " + field);
        }
    });
    
    return true;
}
```

## Next Steps

1. **Explore Advanced Features**: Check out the [Complete API Documentation](API_DOCUMENTATION.md) for detailed information about all available functions and options.

2. **Custom Charts**: Learn how to create custom D3.js chart components by examining the existing chart implementations in the `usercharts/d3/` directory.

3. **Theme Development**: Study the theme system to create custom visualization types and color schemes.

4. **Integration**: Learn how to integrate iXmaps with popular frameworks like React, Vue.js, or Angular.

5. **Performance Tuning**: Optimize your applications for large datasets and complex visualizations.

## Common Issues and Solutions

### Issue: Map Not Loading
```javascript
// Check if SVG path is correct
console.log("SVG Root:", ixmaps.dispatch.svgRoot);

// Verify CORS settings for external maps
// Add this to server headers: Access-Control-Allow-Origin: *
```

### Issue: Data Not Displaying
```javascript
// Verify data format
console.log("Data fields:", data.fields);
console.log("Sample record:", data.records[0]);

// Check theme creation
var themes = ixmaps.doQueryThemes();
console.log("Available themes:", themes);
```

### Issue: Tooltips Not Working
```javascript
// Ensure tooltip functions are properly assigned
if (typeof ixmaps.htmlgui_onTooltipDisplay !== 'function') {
    console.error("Tooltip handler not assigned");
}

// Check for conflicts with other libraries
// Make sure jQuery and other dependencies are loaded
```

This guide provides a solid foundation for getting started with the iXmaps framework. For more advanced usage and detailed API reference, consult the comprehensive API documentation.