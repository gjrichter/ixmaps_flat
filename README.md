# iXmaps Framework - Complete Documentation

A comprehensive JavaScript framework for creating interactive web maps with advanced data visualization capabilities.

## 📚 Documentation Index

### Quick Start
- **[Getting Started Guide](GETTING_STARTED.md)** - Installation, setup, and first steps
- **[Basic Examples](GETTING_STARTED.md#your-first-data-visualization)** - Simple tutorials to get you up and running

### Complete Reference
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference for all components
- **[Advanced Examples](EXAMPLES.md)** - Real-world applications and complex implementations

## 🚀 Framework Overview

The iXmaps framework consists of four main components:

### 1. **Data.js Library** 
Powerful data processing engine supporting multiple formats:
- **Supported Formats**: CSV, JSON, GeoJSON, KML, RSS, JSONstat, TopoJSON
- **Data Transformation**: Filtering, pivoting, aggregation, calculated columns
- **Multi-source Loading**: Combine data from multiple sources with broker pattern
- **Real-time Updates**: Built-in support for live data feeds

### 2. **iXmaps Core**
SVG-based interactive mapping framework:
- **Theme System**: Create dynamic visualizations with choropleth, bubble, and custom charts
- **Interactive Features**: Zoom, pan, search, tooltips, legends
- **Multi-layer Support**: Combine geographic and data layers
- **Performance Optimized**: Efficient rendering for large datasets

### 3. **UI Components**
Rich HTML interface components:
- **Tooltip System**: Basic and advanced templated tooltips
- **Legend Components**: Automatic legend generation for themes and layers
- **Search Interface**: Normal and advanced search capabilities
- **Data Visualization**: Lists, facets, and interactive controls

### 4. **Chart Extensions**
D3.js-based visualization components:
- **Built-in Charts**: Pinnacle, arrow, and lollipop charts
- **Custom Charts**: Framework for creating custom D3 visualizations
- **Integration**: Seamless integration with map themes

## 📖 Documentation Sections

### [Getting Started Guide](GETTING_STARTED.md)
Perfect for beginners and new users:
- Installation and setup instructions
- Basic configuration examples
- Your first data visualization
- Common issues and solutions
- Performance optimization tips

### [Complete API Documentation](API_DOCUMENTATION.md)
Comprehensive reference covering:

#### Data.js Library API
- `Data.Feed` - Loading external data sources
- `Data.Table` - Data table manipulation and transformation
- `Data.Column` - Column-specific operations
- `Data.Broker` - Multi-source data loading
- Factory methods and utilities

#### iXmaps Core API
- Map loading and configuration
- Theme management and creation
- Data querying and filtering
- Chart creation and customization
- Search functionality
- Navigation controls

#### UI Components API
- HTML GUI initialization
- Tooltip system (basic and advanced)
- Legend components (theme and layer)
- Data visualization components
- Utility functions (formatting, colors, storage)

#### Chart Components API
- D3.js chart extensions
- Custom chart creation
- Integration patterns

### [Advanced Examples](EXAMPLES.md)
Real-world implementations including:

#### Data Loading Examples
- Multi-source CSV processing
- Real-time data updates
- Complex GeoJSON handling

#### Visualization Examples
- Multi-series time charts
- Calendar heatmaps
- Network diagrams

#### Interactive Maps
- Multi-theme comparison maps
- Animated time series
- Story-driven narratives

#### Real-World Applications
- COVID-19 dashboard (complete implementation)
- Climate change analysis
- Economic indicator mapping

## 🛠 Key Features

### Data Processing
```javascript
// Load and transform data in one chain
Data.feed({source: "data.csv", type: "csv"})
    .load(function(data) {
        data.addColumn({destination: 'calculated'}, function(row) {
            return row[0] * row[1]; // Calculate new values
        })
        .pivot({lead: 'region', cols: 'category'})
        .sort('total', 'DOWN');
    });
```

### Interactive Mapping
```javascript
// Create interactive choropleth map
ixmaps.doCreateChart(
    "population_density",    // theme ID
    "density_per_km2",      // data field
    null,                   // normalization field
    "choropleth",           // chart type
    "YlOrRd",              // color scheme
    7                       // number of classes
);
```

### Advanced Visualizations
```javascript
// Multi-source real-time dashboard
var broker = Data.broker()
    .addSource("live-data.json", "json")
    .addSource("reference.csv", "csv")
    .realize(function(datasets) {
        createDashboard(datasets);
    });
```

## 📊 Supported Data Formats

| Format | Description | Example Use Case |
|--------|-------------|------------------|
| **CSV** | Comma-separated values | Statistical data, survey results |
| **JSON** | JavaScript Object Notation | API responses, structured data |
| **GeoJSON** | Geographic JSON | Geographic boundaries, features |
| **KML** | Keyhole Markup Language | GPS data, geographic annotations |
| **RSS** | Rich Site Summary | News feeds, blog updates |
| **JSONstat** | Statistical JSON | Official statistics, census data |
| **TopoJSON** | Topological JSON | Optimized geographic data |

## 🎯 Visualization Types

### Map-based Visualizations
- **Choropleth Maps**: Color-coded regions based on data values
- **Bubble Charts**: Proportional circles showing quantities
- **Heat Maps**: Density-based visualizations
- **Flow Maps**: Directional data visualization
- **Multi-layer Maps**: Combined geographic and data layers

### Chart Components
- **Time Series**: Temporal data analysis
- **Comparative Charts**: Side-by-side comparisons
- **Network Diagrams**: Relationship visualization
- **Custom D3 Charts**: Unlimited visualization possibilities

## 🔧 Browser Compatibility

- **Modern Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **SVG Support**: Required for map rendering
- **ES5 Compatible**: Works with older browsers with polyfills
- **Mobile Responsive**: Touch-enabled interactions

## 📦 Dependencies

### Required
- **Core Framework**: Self-contained (no external dependencies for basic functionality)

### Optional (for enhanced features)
- **D3.js**: For advanced charting components
- **jQuery**: For enhanced DOM manipulation (recommended)
- **Mustache.js**: For advanced tooltip templating
- **Turf.js**: For geographic calculations

## 🚀 Quick Start Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My iXmaps Application</title>
    <script src="data.js/data.js"></script>
    <script src="ui/js/htmlgui.js"></script>
</head>
<body>
    <div id="map-container" style="width: 100%; height: 600px;"></div>
    
    <script>
        // Configure map
        ixmaps.setMapFeatures("featurescaling:dynamic;dynamiclayer:true");
        
        // Load and visualize data
        Data.feed({source: "sample-data.csv", type: "csv"})
            .load(function(data) {
                ixmaps.doCreateChart(
                    "my_theme",
                    "population",
                    null,
                    "choropleth",
                    "Blues",
                    5
                );
            });
    </script>
</body>
</html>
```

## 📈 Performance Tips

### Data Optimization
- Enable caching for static datasets
- Use appropriate data formats (TopoJSON for large geographic data)
- Implement pagination for large datasets

### Rendering Optimization
- Use appropriate map features for your use case
- Implement lazy loading for complex visualizations
- Optimize color schemes and class counts

### Memory Management
- Clean up event listeners when done
- Remove unused themes and data references
- Use efficient data structures for large datasets

## 🤝 Contributing

This documentation covers a comprehensive JavaScript mapping framework. To extend or modify:

1. **Fork the repository** and create feature branches
2. **Follow the existing API patterns** for consistency
3. **Add comprehensive documentation** for new features
4. **Include examples** demonstrating usage
5. **Test thoroughly** across different browsers and data types

## 📄 License

The iXmaps framework is distributed under the MIT license, providing maximum flexibility for both open source and commercial use.

## 🔗 Additional Resources

- **[GitHub Repository](.)** - Source code and examples
- **[API Reference](API_DOCUMENTATION.md)** - Complete function reference
- **[Examples Collection](EXAMPLES.md)** - Real-world implementations
- **[Getting Started](GETTING_STARTED.md)** - Step-by-step tutorials

---

**Ready to create amazing interactive maps?** Start with the [Getting Started Guide](GETTING_STARTED.md) and explore the [Examples](EXAMPLES.md) to see what's possible!
