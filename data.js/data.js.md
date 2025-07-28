# Data.js Library Documentation

## Overview

`data.js` is a comprehensive JavaScript library for loading, parsing, selection, transforming, and caching data tables. It provides a fluent API for working with various data sources including CSV, JSON, GeoJSON, KML, and RSS formats.

**Version:** 1.51  
**Author:** Guenter Richter  
**License:** MIT / CC BY SA  
**Copyright:** (c) Guenter Richter

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Supported Data Formats](#supported-data-formats)
3. [Core Classes](#core-classes)
4. [Data Loading Methods](#data-loading-methods)
5. [Data.Table Class](#datatable-class)
6. [Data.Column Class](#datacolumn-class)
7. [Data.Broker Class](#databroker-class)
8. [Data.Merger Class](#datamerger-class)
9. [Utility Functions](#utility-functions)
10. [iXmaps Integration](#ixmaps-integration)
11. [Examples](#examples)
12. [Error Handling](#error-handling)

## Installation & Setup

The library is designed to work in browser environments. Include it in your HTML:

```html
<script src="data.js"></script>
```

## Supported Data Formats

### CSV (Comma-Separated Values)
- **Description**: Tabular data in plain text format
- **Features**: Automatic parsing, header detection, custom delimiters
- **Example**: `"name,age,city\nJohn,25,New York\nJane,30,Los Angeles"`
- **Use Cases**: Spreadsheet data, database exports, simple tabular data

### JSON (JavaScript Object Notation)
- **Description**: Lightweight data interchange format
- **Features**: Nested objects, arrays, automatic type conversion
- **Example**: `{"name": "John", "age": 25, "city": "New York"}`
- **Use Cases**: API responses, configuration files, complex data structures

### GeoJSON
- **Description**: JSON format for geographic data
- **Features**: Point, LineString, Polygon geometries, properties
- **Example**: `{"type": "Feature", "geometry": {"type": "Point", "coordinates": [longitude, latitude]}}`
- **Use Cases**: Mapping applications, geographic analysis, spatial data

### KML (Keyhole Markup Language)
- **Description**: XML-based format for geographic data
- **Features**: Placemarks, paths, polygons, metadata
- **Example**: `<Placemark><Point><coordinates>-122.082,37.421</coordinates></Point></Placemark>`
- **Use Cases**: Google Earth integration, GPS data, geographic visualization

### RSS (Really Simple Syndication)
- **Description**: XML format for web content syndication
- **Features**: Feed parsing, metadata extraction, content aggregation
- **Example**: `<rss><channel><item><title>News Title</title></item></channel></rss>`
- **Use Cases**: News feeds, blog content, content aggregation

### TopoJSON
- **Description**: Topology-based JSON format for geographic data
- **Features**: Shared boundaries, reduced file size, topology preservation
- **Example**: `{"type": "Topology", "objects": {...}, "arcs": [...]}`
- **Use Cases**: Complex geographic visualizations, efficient map rendering

## Core Classes

---

### Data Object
The main namespace containing all data processing functionality.

---

### Data.Object
Base class for data objects with configuration options.

```javascript
Data.Object = function (options) {
    // Constructor implementation
}
```

**Purpose**: Provides foundation for all data objects with common configuration handling.

---

### Data.Import
Handles importing JavaScript objects into the data system.

```javascript
Data.Import = function (options) {
    // Constructor implementation
}
```

**Purpose**: Converts JavaScript objects and arrays into Data.Table format for processing.

---

### Data.Feed
Handles loading data from various sources (URLs, files, etc.).

```javascript
Data.Feed = function (options) {
    // Constructor implementation
}
```

**Purpose**: Manages data loading from external sources with automatic format detection and parsing.

---

## Data Loading Methods

### Data.feed()
Loads data from a URL source.

```javascript
Data.feed(options)
```

**Parameters:**
- `options` {Object} - Configuration object containing:
  - `source` {string} - URL of the data source
  - `type` {string} - Data type ('csv', 'json', 'geojson', 'kml', 'rss')

**Returns:** {Data.Feed} - Feed object for chaining

**Example:**
```javascript
var myfeed = Data.feed({
    "source": "https://example.com/data.csv",
    "type": "csv"
}).load(function(mydata) {
    // Process loaded data
});
```

### Data.import()
Imports JavaScript objects directly.

```javascript
Data.import(options)
```

**Parameters:**
- `options` {Object} - Configuration object

**Returns:** {Data.Import} - Import object for chaining

### Data.object()
Creates a new data object.

```javascript
Data.object(options)
```

**Parameters:**
- `options` {Object} - Configuration object

**Returns:** {Data.Object} - Object instance

---

## Data.Table Class

The core class for data manipulation and transformation. This is the primary interface for working with tabular data.

### Constructor

```javascript
Data.Table = function (table)
```

**Parameters:**
- `table` {Object} - Optional table object with structure:
  - `table` {Object} - Metadata (records, fields count)
  - `fields` {Array} - Column definitions
  - `records` {Array} - Data rows

### Methods

#### getArray()
Converts the table to a 2D array format.

```javascript
getArray()
```

**Returns:** {Array} - 2D array where first row contains column names

#### setArray()
Sets table data from a 2D array.

```javascript
setArray(dataA)
```

**Parameters:**
- `dataA` {Array} - 2D array where first row contains column names

**Returns:** {Data.Table} - Self for chaining

#### revert()
Reverses the order of rows in the table.

```javascript
revert()
```

**Returns:** {Data.Table} - Reverted table

#### reverse()
Reverses the order of rows in the table (alias for revert).

```javascript
reverse()
```

**Returns:** {Data.Table} - Reversed table

#### addColumn()
Adds a new column to the table.

```javascript
addColumn(options, callback)
```

**Parameters:**
- `options` {Object} - Column configuration:
  - `source` {string} - Source column name
  - `destination` {string} - New column name
- `callback` {function} - Function to transform values

**Returns:** {Data.Table} - Self for chaining

**Example:**
```javascript
mydata.addColumn({
    'source': 'created_at',
    'destination': 'date'
}, function(value) {
    var d = new Date(value);
    return String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear());
});
```

#### column()
Gets a column object for manipulation.

```javascript
column(szColumn)
```

**Parameters:**
- `szColumn` {string} - Column name

**Returns:** {Data.Column} - Column object

#### select()
Filters the table based on selection criteria.

```javascript
select(szSelection)
```

**Parameters:**
- `szSelection` {string} - Selection criteria

**Returns:** {Data.Table} - Filtered table

#### aggregate()
Performs aggregation operations on columns.

```javascript
aggregate(szColumn, szAggregation)
```

**Parameters:**
- `szColumn` {string} - Column to aggregate
- `szAggregation` {string} - Aggregation type

**Returns:** {Data.Table} - Aggregated table

#### pivot()
Creates a pivot table.

```javascript
pivot(options)
```

**Parameters:**
- `options` {Object} - Pivot configuration:
  - `lead` {string} - Lead column
  - `keep` {Array} - Columns to keep
  - `cols` {string} - Column to pivot on

**Returns:** {Data.Table} - Pivot table

**Example:**
```javascript
var pivot = mydata.pivot({
    "lead": 'date',
    "keep": ['created_at'],
    "cols": 'state'
});
```

#### subtable()
Creates a subset of the table.

```javascript
subtable(options)
```

**Parameters:**
- `options` {Object} - Subtable configuration

**Returns:** {Data.Table} - Subset table

#### addTimeColumns()
Adds time-based columns to the table.

```javascript
addTimeColumns(options)
```

**Parameters:**
- `options` {Object} - Time column configuration

**Returns:** {Data.Table} - Table with time columns

---

## Data.Column Class

Represents a single column in a data table. Provides methods for column-specific operations and transformations.

### Constructor

```javascript
Data.Column = function ()
```

### Methods

#### values()
Gets all values in the column.

```javascript
values()
```

**Returns:** {Array} - Array of column values

#### uniqueValues()
Gets unique values in the column.

```javascript
uniqueValues()
```

**Returns:** {Array} - Array of unique column values

#### map()
Transforms column values using a callback function.

```javascript
map(callback)
```

**Parameters:**
- `callback` {function} - Function to transform values

**Returns:** {Data.Column} - Self for chaining

**Example:**
```javascript
mydata.column('timestamp').map(function(value) {
    var d = new Date(value);
    return String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear());
});
```

#### rename()
Renames the column.

```javascript
rename(szName)
```

**Parameters:**
- `szName` {string} - New column name

**Returns:** {Data.Column} - Self for chaining

#### remove()
Removes the column from the table.

```javascript
remove()
```

**Returns:** {Data.Column} - Self for chaining

---

## Data.Broker Class

Handles multiple data sources and provides unified access. Useful for managing complex data workflows with multiple sources.

### Constructor

```javascript
Data.Broker = function (options)
```

### Methods

#### parseDefinition()
Parses broker definition.

```javascript
parseDefinition(definition)
```

**Parameters:**
- `definition` {Object} - Broker definition

#### getData()
Retrieves data from the broker.

```javascript
getData(query)
```

**Parameters:**
- `query` {Object} - Query parameters

#### setData()
Sets data in the broker.

```javascript
setData(data)
```

**Parameters:**
- `data` {Object} - Data to set

### Data.broker()
Factory function for creating broker instances.

```javascript
Data.broker()
```

**Returns:** {Data.Broker} - New broker instance

---

## Data.Merger Class

Handles merging multiple data sources into unified datasets. Useful for combining data from different sources or formats.

### Constructor

```javascript
Data.Merger = function (options)
```

### Data.merger()
Factory function for creating merger instances.

```javascript
Data.merger()
```

**Returns:** {Data.Merger} - New merger instance

---

## Utility Functions

### _LOG()
Logs messages with timestamps.

```javascript
_LOG(szLog)
```

**Parameters:**
- `szLog` {string} - Message to log

### __isArray()
Tests if an object is an array.

```javascript
__isArray(obj)
```

**Parameters:**
- `obj` {any} - Object to test

**Returns:** {boolean} - True if object is an array

### __toArray()
Ensures an object is an array.

```javascript
__toArray(obj)
```

**Parameters:**
- `obj` {any} - Object to convert

**Returns:** {Array} - Array representation

### __onlyUnique()
Filters unique values in arrays.

```javascript
__onlyUnique(value, index, self)
```

**Parameters:**
- `value` {any} - Array value
- `index` {number} - Array index
- `self` {Array} - Array reference

**Returns:** {boolean} - True if value is unique

### __getNestedPaths()
Gets nested object paths.

```javascript
__getNestedPaths(dataItem, currentPath)
```

**Parameters:**
- `dataItem` {Object} - Data item
- `currentPath` {string} - Current path (default: "")

### __extractValuesRecursive()
Extracts values recursively from objects.

```javascript
__extractValuesRecursive(dataItem, schemaItem)
```

**Parameters:**
- `dataItem` {Object} - Data item
- `schemaItem` {Object} - Schema item

### __findAllArraysInJson()
Finds all arrays in JSON objects.

```javascript
__findAllArraysInJson(jsonObject)
```

**Parameters:**
- `jsonObject` {Object} - JSON object to search

### __myNumber()
Converts value to number.

```javascript
__myNumber(value)
```

**Parameters:**
- `value` {any} - Value to convert

**Returns:** {number} - Numeric value

### __scanValue()
Scans and processes values.

```javascript
__scanValue(nValue)
```

**Parameters:**
- `nValue` {any} - Value to scan

---

## iXmaps Integration

### Overview
`data.js` is specifically designed to integrate with the iXmaps visualization platform, providing powerful data manipulation capabilities within iXmaps theme definitions and map configurations.

### Data Loading in iXmaps Themes

#### Basic Integration
```javascript
// In iXmaps theme definition
var theme = {
    data: {
        source: "https://example.com/data.csv",
        type: "csv",
        onLoad: function(data) {
            // Process data for visualization
            return data.pivot({
                "lead": "region",
                "cols": "category"
            });
        }
    },
    visualization: {
        // iXmaps visualization configuration
    }
};
```

#### Advanced Data Processing
```javascript
var theme = {
    data: {
        source: "https://example.com/earthquakes.csv",
        type: "csv",
        onLoad: function(data) {
            // Add time-based columns
            data.addColumn({
                'source': 'timestamp',
                'destination': 'date'
            }, function(value) {
                var d = new Date(value);
                return d.getFullYear() + "-" + (d.getMonth() + 1);
            });
            
            // Filter recent data
            var recentData = data.select("date >= '2023-01'");
            
            // Create pivot for visualization
            return recentData.pivot({
                "lead": "region",
                "cols": "magnitude",
                "keep": ["date", "coordinates"]
            });
        }
    }
};
```

### Dynamic Data Manipulation

#### Real-time Data Processing
```javascript
var theme = {
    data: {
        broker: {
            sources: [
                { url: "https://api.example.com/live-data", type: "json" },
                { url: "https://api.example.com/historical-data", type: "csv" }
            ],
            merge: function(dataArray) {
                // Combine multiple data sources
                var merged = Data.merger().merge(dataArray);
                return merged.pivot({
                    "lead": "time",
                    "cols": "metric"
                });
            }
        }
    }
};
```

#### Conditional Data Processing
```javascript
var theme = {
    data: {
        source: "https://example.com/dataset.csv",
        type: "csv",
        onLoad: function(data, context) {
            // Context-aware processing
            if (context.zoomLevel > 5) {
                // High zoom: detailed data
                return data.select("detail_level = 'high'");
            } else {
                // Low zoom: aggregated data
                return data.aggregate("value", "sum")
                    .pivot({
                        "lead": "region",
                        "cols": "category"
                    });
            }
        }
    }
};
```

### Theme Definition Integration

#### Complete Theme Example
```javascript
var earthquakeTheme = {
    name: "Earthquake Visualization",
    description: "Real-time earthquake data with magnitude-based styling",
    
    data: {
        source: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.csv",
        type: "csv",
        refreshInterval: 300000, // 5 minutes
        onLoad: function(data) {
            // Process earthquake data
            data.addColumn({
                'source': 'time',
                'destination': 'date'
            }, function(value) {
                return new Date(value).toLocaleDateString();
            });
            
            // Add magnitude categories
            data.addColumn({
                'source': 'mag',
                'destination': 'magnitude_category'
            }, function(value) {
                var mag = parseFloat(value);
                if (mag < 2.0) return "Minor";
                if (mag < 4.0) return "Light";
                if (mag < 5.0) return "Moderate";
                if (mag < 6.0) return "Strong";
                return "Major";
            });
            
            return data;
        }
    },
    
    visualization: {
        type: "point",
        style: {
            radius: function(feature) {
                var mag = feature.properties.mag;
                return Math.max(2, mag * 3);
            },
            color: function(feature) {
                var category = feature.properties.magnitude_category;
                var colors = {
                    "Minor": "#90EE90",
                    "Light": "#FFFF00",
                    "Moderate": "#FFA500",
                    "Strong": "#FF4500",
                    "Major": "#FF0000"
                };
                return colors[category] || "#CCCCCC";
            }
        }
    }
};
```

### Data Transformation in Themes

#### Time-based Aggregation
```javascript
var timeSeriesTheme = {
    data: {
        source: "https://example.com/time-series.csv",
        type: "csv",
        onLoad: function(data) {
            // Add time columns for different granularities
            data.addTimeColumns({
                source: "timestamp",
                columns: ["year", "month", "week", "day", "hour"]
            });
            
            // Create time-based pivot tables
            var dailyData = data.pivot({
                "lead": "day",
                "cols": "metric",
                "keep": ["year", "month"]
            });
            
            return dailyData;
        }
    }
};
```

#### Geographic Data Processing
```javascript
var geoTheme = {
    data: {
        source: "https://example.com/geo-data.geojson",
        type: "geojson",
        onLoad: function(data) {
            // Extract properties for visualization
            var properties = data.column("properties").values();
            
            // Create summary statistics
            var summary = data.aggregate("value", "mean")
                .pivot({
                    "lead": "region",
                    "cols": "category"
                });
            
            return summary;
        }
    }
};
```

### Best Practices for iXmaps Integration

1. **Performance Optimization**
   - Use appropriate data filtering before visualization
   - Implement data caching for frequently accessed datasets
   - Consider data aggregation for large datasets

2. **Error Handling**
   - Implement robust error handling for data loading failures
   - Provide fallback data or default visualizations
   - Log data processing errors for debugging

3. **Dynamic Updates**
   - Use refresh intervals for real-time data
   - Implement incremental data updates
   - Handle data source changes gracefully

4. **Memory Management**
   - Clean up large datasets when not needed
   - Use streaming for very large datasets
   - Implement data pagination for extensive datasets

---

## Examples

### Basic Data Loading

```javascript
// Load CSV data
var myfeed = Data.feed({
    "source": "https://raw.githubusercontent.com/emergenzeHack/terremotocentro/master/_data/issues.csv",
    "type": "csv"
}).load(function(mydata) {
    // Process the loaded data
    console.log("Data loaded:", mydata.records.length, "records");
}).error(function(e) {
    alert("Data.feed error: " + e);
});
```

### Data Transformation

```javascript
// Add time-based columns
mydata.addColumn({
    'source': 'created_at',
    'destination': 'date'
}, function(value) {
    var d = new Date(value);
    return String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear());
});

// Get column values
var hoursA = mydata.column("hour").values();

// Create pivot table
var pivot = mydata.pivot({
    "lead": 'date',
    "keep": ['created_at'],
    "cols": 'state'
});

// Reverse data order
pivot = pivot.revert();
```

### Column Manipulation

```javascript
// Transform column values
mydata.column('timestamp').map(function(value) {
    var d = new Date(value);
    return String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear());
});

// Rename column
mydata.column('timestamp').rename('time');

// Get unique values
var uniqueStates = mydata.column('state').uniqueValues();
```

---

## Error Handling

The library provides error handling through callback functions:

```javascript
Data.feed(options)
    .load(function(data) {
        // Success callback
        console.log("Data loaded successfully");
    })
    .error(function(error) {
        // Error callback
        console.error("Error loading data:", error);
    });
```

## Browser Compatibility

The library is designed to work in modern browsers and requires:
- ES5+ support
- jQuery (for AJAX operations)
- Papa Parse (for CSV parsing)

## Performance Considerations

- Large datasets should be processed in chunks
- Use appropriate data types for better memory usage
- Consider caching frequently accessed data
- Use column operations instead of row-by-row processing when possible

## License

This library is licensed under MIT and CC BY SA licenses. See the header comments in the source code for full license information. 