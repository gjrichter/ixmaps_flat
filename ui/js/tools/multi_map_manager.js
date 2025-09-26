/**
 * ixmaps Multi-Map Manager
 * Utility functions for managing multiple map instances
 */

ixmaps.multiMapManager = ixmaps.multiMapManager || {};

/**
 * Multi-Map Manager Class
 */
ixmaps.multiMapManager.MapManager = function() {
    this.maps = {};
    this.mapConfigs = {};
    this.defaultConfig = {
        mapService: "leaflet_vt",
        maptype: "Stamen - toner-lite",
        width: "100%",
        height: "400px",
        controls: "small",
        mode: "nolegend"
    };
};

ixmaps.multiMapManager.MapManager.prototype = {
    
    /**
     * Create a new map instance
     * @param {String} mapName - Unique name for the map
     * @param {String} containerId - Container element ID
     * @param {Object} config - Map configuration
     * @param {Function} callback - Callback when map is ready
     */
    createMap: function(mapName, containerId, config, callback) {
        if (this.maps[mapName]) {
            console.warn(`Map '${mapName}' already exists`);
            return this.maps[mapName];
        }
        
        // Merge with default config
        const finalConfig = Object.assign({}, this.defaultConfig, config, {
            mapName: mapName,
            divId: containerId
        });
        
        // Store config
        this.mapConfigs[mapName] = finalConfig;
        
        // Create map using ixmaps.embed
        ixmaps.embed(containerId, finalConfig, (mapApi) => {
            this.maps[mapName] = mapApi;
            
            // Register with global registry
            ixmaps.registerMapInstance(mapName, mapApi, finalConfig);
            
            if (callback) {
                callback(mapApi);
            }
        });
        
        return this.maps[mapName];
    },
    
    /**
     * Get a map instance by name
     * @param {String} mapName - Name of the map
     * @return {Object} Map API instance or null
     */
    getMap: function(mapName) {
        return this.maps[mapName] || null;
    },
    
    /**
     * Get all map instances
     * @return {Object} Object containing all map instances
     */
    getAllMaps: function() {
        return this.maps;
    },
    
    /**
     * Remove a map instance
     * @param {String} mapName - Name of the map to remove
     */
    removeMap: function(mapName) {
        if (this.maps[mapName]) {
            // Remove from global registry
            ixmaps.removeMapInstance(mapName);
            
            // Remove from local storage
            delete this.maps[mapName];
            delete this.mapConfigs[mapName];
            
            // Remove DOM element
            const mapConfig = this.mapConfigs[mapName];
            const container = mapConfig ? document.getElementById(mapConfig.divId) : null;
            if (container) {
                container.remove();
            }
            
            console.log(`Map '${mapName}' removed`);
            return true;
        }
        return false;
    },
    
    /**
     * Remove all map instances
     */
    removeAllMaps: function() {
        const mapNames = Object.keys(this.maps);
        mapNames.forEach(mapName => {
            this.removeMap(mapName);
        });
    },
    
    /**
     * Synchronize all maps to the same view
     * @param {String} sourceMapName - Map to use as reference (optional)
     */
    syncMaps: function(sourceMapName) {
        const mapNames = Object.keys(this.maps);
        if (mapNames.length < 2) {
            console.warn('Need at least 2 maps to sync');
            return;
        }
        
        // Use first map as source if none specified
        const sourceMap = sourceMapName ? this.maps[sourceMapName] : this.maps[mapNames[0]];
        if (!sourceMap) {
            console.error('Source map not found');
            return;
        }
        
        const center = sourceMap.getCenter();
        const zoom = sourceMap.getZoom();
        
        mapNames.forEach(mapName => {
            if (mapName !== sourceMapName) {
                const map = this.maps[mapName];
                if (map) {
                    map.setView(center, zoom);
                }
            }
        });
        
        console.log('All maps synchronized');
    },
    
    /**
     * Set the same map type for all maps
     * @param {String} mapType - Map type to set
     */
    setMapTypeForAll: function(mapType) {
        Object.keys(this.maps).forEach(mapName => {
            const map = this.maps[mapName];
            if (map) {
                map.setMapType(mapType);
            }
        });
    },
    
    /**
     * Get map statistics
     * @return {Object} Statistics about all maps
     */
    getStats: function() {
        const mapNames = Object.keys(this.maps);
        const configNames = Object.keys(this.mapConfigs);
        
        return {
            activeMaps: mapNames.length,
            configuredMaps: configNames.length,
            mapNames: mapNames,
            configNames: configNames
        };
    },
    
    /**
     * Create a map grid layout
     * @param {String} containerId - Container element ID
     * @param {Array} mapConfigs - Array of map configurations
     * @param {Object} gridOptions - Grid layout options
     */
    createMapGrid: function(containerId, mapConfigs, gridOptions) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container '${containerId}' not found`);
            return;
        }
        
        const defaultGridOptions = {
            columns: 2,
            gap: '10px',
            height: '400px'
        };
        
        const options = Object.assign({}, defaultGridOptions, gridOptions);
        
        // Set grid CSS
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${options.columns}, 1fr)`;
        container.style.gap = options.gap;
        
        // Create map containers
        mapConfigs.forEach((config, index) => {
            const mapName = config.mapName || `map_${index}`;
            const mapId = `ixmap_${mapName}`;
            
            // Create map container
            const mapContainer = document.createElement('div');
            mapContainer.id = mapId;
            mapContainer.style.height = options.height;
            mapContainer.style.border = '1px solid #ccc';
            mapContainer.style.borderRadius = '4px';
            
            container.appendChild(mapContainer);
            
            // Create the map
            this.createMap(mapName, mapId, config);
        });
    }
};

/**
 * Create a global map manager instance
 */
ixmaps.mapManager = new ixmaps.multiMapManager.MapManager();

/**
 * Utility functions for backward compatibility
 */
ixmaps.createMultiMap = function(mapName, containerId, config, callback) {
    return ixmaps.mapManager.createMap(mapName, containerId, config, callback);
};

ixmaps.getMultiMap = function(mapName) {
    return ixmaps.mapManager.getMap(mapName);
};

ixmaps.removeMultiMap = function(mapName) {
    return ixmaps.mapManager.removeMap(mapName);
};

ixmaps.syncMultiMaps = function(sourceMapName) {
    return ixmaps.mapManager.syncMaps(sourceMapName);
};
