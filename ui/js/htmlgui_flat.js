/**********************************************************************
	 htmlgui_api.js

$Comment: provides api functions to HTML pages, that embed ixmaps maps
$Source : htmlgui_api.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2011/10/29 $
$Author: guenter richter $
$Id: htmlgui_api.js 1 2011-10-29 10:51:41Z Guenter Richter $map

Copyright (c) Guenter Richter
$Log: htmlgui_api.js,v $
**********************************************************************/

/** 
 * @fileoverview This file provides iXmaps interface functions for HTML Pages that embed ixmaps maps<br>
 * @example 
 *
 * 1. mode: embed the map by a dedicated frame and adress by the frame (and map) id
 *
 * <!DOCTYPE html>
 * <html>
 *   <body>
 *
 *     ...
 *     <iframe id="map" src="http://...map_source...">
 *     ...
 * 
 *     <script type="text/javascript" src = "../../ui/js/htmlgui_api.js" > </script>
 *
 *     <script type="text/javascript" charset="utf-8">
 *
 *       // wait for map ready
 *       // ----------------------------
 *       ixmaps.waitForMap("map",function() {
 *
 *         ixmaps.setView("map",[42.79540065303723,13.20831298828125],9);
 *
 *         ixmaps.newTheme("map","Totale complessivo",{  
 *           layer: "com2011_s",
 *           field: "Totale complessivo",
 *           style: {
 *             type: "CHOROPLETH|EQUIDISTANT",
 *             colorscheme: [  "5","#FFFDD8","#B5284B","2colors","#FCBA6C" ],
 *             dbtable: "themeDataObj csv url(http://mysite/mydata/data.csv)",
 *             lookupfield: "comune"
 *             },"clear"
 *           });
 *       });
 *
 *     </script>
 *   </body>
 * </html>
 *
 * @example
 *
 * 2. mode: embed the map by ixmaps api function and adress by the returned map handle
 *
 * <!DOCTYPE html>
 * <html>
 *   <body>
 *     <div id="map_div"></div>
 * 
 *     <script type="text/javascript" src = "../../ui/js/htmlgui_api.js" > </script>
 *     <script type="text/javascript" charset="utf-8">
 *
 *     ixmaps.embedMap("map_div",
 *       { 
 *          mapName:    "map", 
 *          mapService: "leaflet",
 *          mapType:    "OpenStreetMap - FR"
 *       },
 *       function(map) {
 *
 *         map.setView([42.79540065303723,13.20831298828125],9);
 *
 *         map.newTheme("Totale complessivo",
 *           {  
 *           layer: "com2011_s",
 *           field: "Totale complessivo",
 *           style: {
 *             type: "CHOROPLETH|EQUIDISTANT",
 *             colorscheme: [  "5","#FFFDD8","#B5284B","2colors","#FCBA6C" ],
 *             dbtable: "themeDataObj csv url(http://mysite/mydata/data.csv)",
 *             lookupfield: "comune"
 *             }
 *           },"clear");
 *         }
 *       );
 *
 *     </script>
 *   </body>
 * </html>
 *
 * @author Guenter Richter guenter.richter@medienobjekte.de
 * @version 1.0 
 * @copyright CC BY SA
 * @license MIT
 */

/** 
 * @namespace ixmaps
 */

(function (window, document, undefined) {

    var ixmaps = {
        version: "1.0",
        JSON_Schema: "https://gjrichter.github.io/ixmaps/schema/ixmaps/v1.json"
    };

    function expose() {
        var oldIxmaps = window.ixmaps;

        ixmaps.noConflict = function () {
            window.ixmaps = oldIxmaps;
            return this;
        };

        window.ixmaps = ixmaps;
    }

    // define Data for Node module pattern loaders, including Browserify
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = ixmaps;

        // define Data as an AMD module
    } else if (typeof define === 'function' && define.amd) {
        define(ixmaps);
    }

    // define Data as a global variable, saving the original Data to restore later if needed
    if (typeof window !== 'undefined') {
        expose();
    }


    // List of file URLs and their expected types
    const fileUrls = [
        {
            url: 'ui/html/assets/css/icomoon.css',
            type: 'css'
        },
        {
            url: 'ui/html/assets/css/font-awesome.min.css',
            type: 'css'
        },
        {
            url: 'ui/libs/jquery/ui/css/smoothness/jquery-ui-1.8.16.custom.css',
            type: 'css'
        },
        {
            url: 'ui/css/jquery-ui.css',
            type: 'css'
        },
        {
            url: 'ui/css/custom.css',
            type: 'css'
        },
        {
            url: 'ui/css/messagebox.css',
            type: 'css'
        },
        {
            url: 'ui/css/bootstrap.css',
            type: 'css'
        },
        {
            url: 'ui/css/legend.css',
            type: 'css'
        },
        {
            url: 'ui/css/main.css',
            type: 'css'
        },
        {
            url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
            type: 'css'
        },
        {
            url: 'ui/libs/leaflet-gesture-handling/leaflet-gesture-handling.min.css',
            type: 'css'
        },
        {
            url: 'ui/css/ixmaps.css',
            type: 'css'
        },

        {
            url: 'ui/libs/jquery/jquery-1.7.1.min.js',
            type: 'js'
        },
        {
            url: 'ui/libs/jquery/ui/js/jquery-ui-1.8.16.custom.min.js',
            type: 'js'
        },
        {
            url: 'ui/libs/getUrlParam/js/jquery.getUrlParam.js',
            type: 'js'
        },
        {
            url: 'ui/libs/modernizr/js/testsvg.js',
            type: 'js'
        },
        /**
        {
            url: 'https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.min.js',
            type: 'js'
        },
        **/
        {
            url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
            type: 'js'
        },
        {
            url: 'https://cdn.maptiler.com/maptiler-sdk-js/v1.1.1/maptiler-sdk.umd.js',
            type: 'js'
        },
        {
            url: 'https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css',
            type: 'css'
        },
        {
            url: 'https://cdn.maptiler.com/leaflet-maptilersdk/v1.0.0/leaflet-maptilersdk.js',
            type: 'js'
        },
        {
            url: 'ui/libs/messagebox.js',
            type: 'js'
        },
        {
            url: 'ui/js/htmlgui.js',
            type: 'js'
        },
        {
            url: 'ui/js/htmlgui_sync.js',
            type: 'js'
        },
        {
            url: 'ui/js/htmlgui_sync_Leaflet_VT.js',
            type: 'js'
        },
        {
            url: 'ui/js/htmlgui_dialog.js',
            type: 'js'
        },
        {
            url: 'ui/js/htmlgui_story.js',
            type: 'js'
        },
        {
            url: '../data.min.js/data.js',
            type: 'js'
        },
        {
            url: 'ui/js/tools/legend.js',
            type: 'js'
        },
        {
            url: 'ui/js/tools/layer_legend.js',
            type: 'js'
        },
        {
            url: 'ui/libs/leaflet-gesture-handling/leaflet-gesture-handling.min.js',
            type: 'js'
        },

        {
            url: 'ui/html/mappage.html',
            type: 'html'
        },
        
        {
            url: 'ui/resources/images/ixmaps_logo.png',
            type: 'shortcut'
        },

        {
            url: 'https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js',
            type: 'js'
        }

            //{ url: 'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.min.js', type: 'js' },
            //{ url: 'https://unpkg.com/fzstd', type: 'js' },
            //{ url: 'https://cdn.jsdelivr.net/npm/fzstd/umd/index.js', type: 'js' }

        ];

    /**
     * Loads a resource (file) from a given URL.
     *
     * @async
     * @param {string} url - The URL of the resource to load.
     * @param {string} type - The type of the resource (e.g., 'json', 'text', 'js', 'css', 'html', 'blob', 'shortcut').
     * @returns {Promise<any>} A promise that resolves with the loaded resource data or void.
     * @throws {Error} Throws an error if the HTTP request fails or if an unsupported file type is provided.
     */
    async function loadResource(url, type, target) {

        if (!url.match(/http/)) {
            url = ixmaps.szResourceBase + url;
        }

        console.log(url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }

        switch (type) {
            case 'json':
                return response.json();
            case 'text':
                return response.text();
            case 'blob':
                return response.blob();
            case 'js':
                return response.text(); // no need to eval here
            case 'css':
                const css = await response.text();
                const style = document.createElement('style');
                style.innerHTML = css;
                document.head.appendChild(style);
                return; // no need to return css content
            case 'html':
                const html = await response.text();
                document.getElementById(target).innerHTML = html;
                return;
            case 'shortcut':
                const blob = await response.blob();
                const iconUrl = URL.createObjectURL(blob);
                let link = document.querySelector("link[rel='shortcut icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'shortcut icon';
                    document.head.appendChild(link);
                }
                link.href = iconUrl;
                return;
            default:
                throw new Error('Unsupported file type');
        }
    }

    /**
     * Loads multiple resources from a list of URLs.
     *
     * @async
     * @param {Array<{url: string, type: string}>} urls - An array of objects, each containing a 'url' and a 'type'.
     * @param {function} [callback] - An optional callback function to be executed after all resources are loaded successfully.
     * @returns {Promise<void>} A promise that resolves when all resources are loaded and processed.
     * @throws {Error} Throws an error if any resource fails to load.
     */
    async function loadResources(urls, target, callback, opt, callback2) {
        try {
            const fetchPromises = urls.map(({
                url,
                type
            }) => loadResource(url, type, target));
            const files = await Promise.all(fetchPromises);

            for (const file of files) {
                if (typeof file === 'string') {
                    eval(file); // Execute only JavaScript code.
                }
            }

            console.log('All resources loaded successfully');
            if (callback) {
                callback(opt, callback2);
            }
        } catch (error) {
            console.error('Error loading resources:', error);
        }
    }
    
    ixmaps.loadResources = function(urls, target, callback, opt, callback2){
        return loadResources(urls, target, callback, opt, callback2);
    };
    
    /**
     * Initializes the loaded UI by parameter.
     *
     * This function configures and styles the map UI using options gives as parameter
     * legend position, on map tools, ...
     * @param {object} opt - a JSON object with parameters.
     * @returns void
    */
    const __config_map_ui = function (opt) {

        // -----------------
        // map/theme legend
        // -----------------

        $("#map-overlay").css("width", window.innerWidth + "px");
        $("#map-overlay").css("height", window.innerHeight + "px");
        $("#map-overlay").css("pointer-events", "none");

        if (opt.align) {
            if (opt.align.match(/left/)) {
                ixmaps.legendAlign = "left";
                $(".map-legend").attr("data-align", "left");
                $(".map-legend").css("text-align", "left");
                var szLeft = opt.align.split("left")[0] || "4%";
                $(".map-legend").css("left", szLeft);
                $(".map-legend").css("top", "12px");
                $(".title-field").css("left", "100px");
            } else
            if (opt.align.match(/right/)) {
                ixmaps.legendAlign = "right";
                $(".map-legend").attr("data-align", "right");
                $(".map-legend").css("text-align", "left");
                var szRight = opt.align.split("right")[0] || "25px";
                $(".map-legend").css("right", szRight);
                $(".title-field").css("right", "100px");
            } else
            if ((opt.align == "center") ||
                (opt.align == "top")) {
                $("#map-legend").appendTo("#map-header");
                $("#map-header").show();
                $("#ixmap").css("top", "75px");
                ixmaps.legendAlign = "center";
                $(".map-legend").attr("data-align", "right");
                $(".map-legend").css("text-align", "center");
                $(".map-legend").css("font-size", "0.7em");
                $(".map-legend").css("margin-top", "-15px");
                $(".map-legend").css("min-height", "77px");
                $(".map-legend").css("width", "100%");
                $(".map-legend").css("max-width", "100%");
                $(".map-legend").css("left", "0px");
                $(".map-legend").css("opacity", "1");
            } else
            if (opt.align == "bottom") {
                $("#map-legend").appendTo("#map-header");
                $("#map-header").show();
                $("#ixmap").css("top", "0px");
                ixmaps.legendAlign = "center";
                $(".map-legend").attr("data-align", "right");
                $(".map-legend").css("text-align", "center");
                $(".map-legend").css("font-size", "0.7em");
                $(".map-legend").css("width", "100%");
                $(".map-legend").css("max-width", "100%");
                $(".map-legend").css("position", "absolute");
                $(".map-legend").css("left", "0px");
                $(".map-legend").css("top", "720px");

                // GR 13/12/2023 HTML color maptype -> map background color 
                //$(".map-legend").css("background", "rgba(255,255,255,0.5)");
                //var szBackgroundcolor = decodeURIComponent($(document).getUrlParam('maptype'));
                //if (szBackgroundcolor && (szBackgroundcolor.charAt(0) == '#')) {
                //    $("body").css("background", decodeURIComponent($(document).getUrlParam('maptype')));
                //}

                $("#onmapbuttondiv").css("left", "");
                $("#onmapbuttondiv").css("right", "60px");
                $(".title-field").css("right", "100px");
            }
        } else {
            $(".map-legend").css("right", "25px");
            $(".title-field").css("left", "100px");
        }
        
        // -------------
        // context menu
        // -------------

        document.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            e.stopPropagation();
            $("#contextmenu")[0].style.left = e.pageX - 20 + 'px';
            $("#contextmenu")[0].style.top = e.pageY - 20 + 'px';
            $("#contextmenu").show();
            return true;
        });

        var __contextMenuTrigger = null;
        __contextmenuOver = function(el) {
            clearTimeout(__contextMenuTrigger);
            __contextMenuTrigger = true;
        }

        __contextmenuOut = function(el) {
            __contextMenuTrigger = setTimeout("$('#contextmenu').hide()", 100);
        }

    }

    /**
     * Initializes and loads the ixmaps map application.
     *
     * This function sets up the map configuration, including the map service, type, SVG map,
     * map size, controls, and initial view. It also defines event handlers and themes for the map.
     */
    const __load_map = function (opt, callback) {

        ixmaps.legendState = 1;
        ixmaps.fMapControls = true;
        let szControls = "small";
        let szSvgLegendFlag = "nolegend";
        let szHTMLLegendFlag = "1";

        // GR 12.02.2015 define fallback default map, used if parameter SVGGIS is empty  
        let szDefaultMap = "https://s3.eu-west-1.amazonaws.com/exp.ixmaps.com/flat/ixmaps/maps/svg/maps/generic/mercator.svg";

        let szMap = null;
        szMap = (szMap && (szMap != "null")) ? szMap : szDefaultMap;

        map = new ixmaps.map("ixmap", {
            mapService: opt.mapService || "leaflet_vt",
            maptype: opt.maptype || opt.mapType || "Stamen - toner-lite",
            svg: szMap,
            mapsize: "fullscreen",
            footer: ixmaps.footer || 0,
            mode: szSvgLegendFlag,
            controls: szControls,
            silent: opt.silent || true
        });
        var oldReady = ixmaps.onMapReady;
        console.log(ixmaps);
        ixmaps.onMapReady = function (szMap) {
            callback(new ixmaps.mapApi(szMap));
        };

        ixmaps.date = null;
        ixmaps.parent = null;

        // set sync mode ?
        // --------------------
        ixmaps.fSyncMap = true;
        ixmaps.setAutoSwitchInfo(true);

        // show/hide toolsbar elements
        //__switchBannerElements();
        //setTimeout("__switchBannerElements()", 5000);
        htmlMap_enableScrollWheelZoom();

        // configure and style the map UI
        // ------------------------------
        __config_map_ui(opt);
    };




    // generate iframe and embed a map
    // --------------------------------------
    /**
     * embed
     * @param {String} szTargetDiv the id of the <div> to host the map
     * @param {Object} opt a JSON object that describes the map source  
     * @param {Function} fCallBack the function to call, if the map is loaded
     * @return void
     * @example
     *
     * <!DOCTYPE html>
     * <html>
     *   <body>
     *     <div id="map_div"></div>
     *   </body>
     * 
     *     <script type="text/javascript" src = "../../ui/js/htmlgui_api.js" > </script>
     *     <script type="text/javascript" charset="utf-8">
     *
     *     ixmaps.embedMap("map_div",
     *       { 
     *          mapName:    "map", 
     *          mapService: "leaflet",
     *          mapType:    "OpenStreetMap - FR"
     *       }
     *     ); 
     *     </script>
     * </html>
     */

    ixmaps.embed = function (szTargetDiv, opt, callback) {

        console.log("ixmaps.embed() ---->");

        ixmaps.szResourceBase = "../../";

        let scriptsA = document.querySelectorAll("script");
        for (var i in scriptsA) {
            console.log(scriptsA[i].getAttribute);
            let scr = scriptsA[i].getAttribute("src");
            if (scr && scr.match(/htmlgui_flat.js/)) {
                ixmaps.szResourceBase = (scr.split("ui/js/htmlgui_flat.js")[0]);
                break;
            }
        }

        if (opt.mapCdn) {
            ixmaps.szResourceBase = opt.mapCdn;
        }

        var target = window.document.getElementById(szTargetDiv);
        var szName = encodeURIComponent(opt.mapName || opt.name || "map" + String(Math.random()).split(".")[1]);
        var szBasemap = encodeURIComponent(opt.mapService || opt.basemap || "leaflet");
        var szMapType = encodeURIComponent(opt.mapType || opt.maptype || "CartoDB - Positron");

        // Call the function with the list of file URLs and types
        loadResources(fileUrls, szTargetDiv, __load_map, opt, callback);

        return target;
    }

    /**
     * the ixmaps.themeApi class
     * provides methods to manipulate realized map themes
     * @class It realizes an object to hold a theme handle
     * @constructor
     * @param {String} [szMap] the name of the map, to define if more than one map present
     * @param {String} [szTheme] the theme id, to define if more than one theme present
     * @return A new ixmaps.themeApi object
     */

    ixmaps.themeApi = function (szMap, szTheme) {
        this.szMap = szMap || null;
        this.szTheme = szTheme || null;
        this.obj = ixmaps.getThemeObj(szMap, szTheme) || null;
    };
    ixmaps.themeApi.prototype = {

        /**
         * change Style 
         * @param {String} szStyle a style definition string (see <a href="http://public.ixmaps.com.s3-website-eu-west-1.amazonaws.com/docs/ixmaps-doc-themes-1.html" target="_blank">documentation</a>)
         * @param {String} szFlag the style change method ('set' or 'factor' or 'remove' - see api doc)
         * @example ixmaps.map().theme().changeStyle("opacity:0.5","factor");
         * @example ixmaps.map("map1").theme().changeStyle("type:AGGREGATE","add");
         * @return void
         **/
        changeStyle: function (szStyle, szFlag) {
            ixmaps.changeThemeStyle(this.szMap, this.szTheme, szStyle, szFlag);
        },
        /**
         * mark/highlight theme class
         * @param {Number} nClass the number of the class to mark/highlight
         * @example ixmaps.map().theme().markClass(1);
         * @return void
         **/
        markClass: function (nClass) {
            ixmaps.markThemeClass(this.szMap, this.szTheme, nClass);
        },
        /**
         * unmark theme class
         * @param {Number} nClass the number of the class to un mark
         * @example ixmaps.map().theme().unmarkClass(1);
         * @return void
         **/
        unmarkClass: function (nClass) {
            ixmaps.unmarkThemeClass(this.szMap, this.szTheme, nClass);
        },
        /**
         * show theme
         * @example ixmaps.map().theme().show();
         * @return void
         **/
        show: function () {
            ixmaps.showTheme(this.szMap, this.szTheme);
        },
        /**
         * hide theme
         * @example ixmaps.map().theme().show();
         * @return void
         **/
        hide: function () {
            ixmaps.hideTheme(this.szMap, this.szTheme);
        },
        /**
         * toggle theme
         * @example ixmaps.map().theme().toggle();
         * @return void
         **/
        toggle: function () {
            ixmaps.toggleTheme(this.szMap, this.szTheme);
        },
        /**
         * remove theme
         * @example ixmaps.map().theme().remove();
         * @return void
         **/
        remove: function () {
            ixmaps.removeTheme(this.szMap, this.szTheme);
        },
        /**
         * replace theme
         * @example ixmaps.map().theme().replace(newTheme);
         * @return void
         **/
        replace: function (theme, flag) {
            ixmaps.removeTheme(this.szMap, this.szTheme);
            ixmaps.newTheme(this.szMap, "layer", theme, flag);
        }
    };

    /**
     * the ixmaps.mapApi class.  
     * provides methods to handle maps
     * @class It realizes an object to hold a map handle
     * @constructor
     * @param {String} [szMap] the name of the map, to define if more than one map present
     * @return A new ixmaps.themeApi object
     */
    ixmaps.mapApi = function (szMap) {
        this.szMap = szMap || null;
    };
    ixmaps.mapApi.prototype = {

        setMapTypeId: function (szMapTypeId) {
            ixmaps.setMapTypeId(this.szMap, szMapTypeId);
            return this;
        },
        setMapType: function (szMapTypeId) {
            ixmaps.setMapTypeId(this.szMap, szMapTypeId);
            return this;
        },
        mapType: function (szMapTypeId) {
            ixmaps.setMapTypeId(this.szMap, szMapTypeId);
            return this;
        },
        setBasemapOpacity: function (nOpacity, szMode) {
            ixmaps.setBasemapOpacity(nOpacity, szMode);
            return this;
        },

        loadMap: function (szUrl) {
            ixmaps.loadMap(this.szMap, szUrl);
            return this;
        },

        setBounds: function (bounds) {
            ixmaps.setBounds(this.szMap, bounds);
            return this;
        },

        setView: function (center, zoom) {
            ixmaps.setView(this.szMap, center, zoom);
            return this;
        },
        view: function (center, zoom) {
            ixmaps.setView(center, zoom);
            return this;
        },

        flyTo: function (center, zoom) {
            ixmaps.flyTo(this.szMap, center, zoom);
            return this;
        },

        setScaleParam: function (szParam) {
            ixmaps.setScaleParam(this.szMap, szParam);
            return this;
        },

        setMapFeatures: function (szFeatures) {
            ixmaps.setMapFeatures(szFeatures);
            return this;
        },

        setOptions: function (options) {
            ixmaps.setOptions(this.szMap, options);
            return this;
        },
        options: function (options) {
            ixmaps.setOptions(options);
            return this;
        },

        attribution: function (attribution) {
            ixmaps.setAttribution(attribution);
            return this;
        },

        legend: function (legend) {
            ixmaps.setLegend(legend);
            return this;
        },

        about: function (about) {
            ixmaps.setAbout(about);
            return this;
        },

        title: function (szTitle) {
            ixmaps.embeddedApiA[this.szMap].setTitle(szTitle);
            return this;
        },

        setExternalData: function (data, options) {
            ixmaps.setExternalData(data, options);
            return this;
        },
        setData: function (data, options) {
            ixmaps.setExternalData(data, options);
            return this;
        },
        data: function (data, options) {
            ixmaps.setExternalData(data, options);
            return this;
        },


        setLocalString: function (szGlobal, szLocal) {
            ixmaps.setLocal(szGlobal, szLocal);
            return this;
        },
        setLocal: function (szGlobal, szLocal) {
            ixmaps.setLocal(szGlobal, szLocal);
            return this;
        },
        localize: function (szGlobal, szLocal) {
            ixmaps.setLocal(szGlobal, szLocal);
            return this;
        },
        local: function (szGlobal, szLocal) {
            ixmaps.setLocal(szGlobal, szLocal);
            return this;
        },


        newTheme: function (title, theme, flag) {
            ixmaps.newTheme(title, theme, flag);
            return this;
        },
        addTheme: function (title, theme, flag) {
            ixmaps.newTheme(title, theme, flag);
            return this;
        },
        layer: function (theme, flag) {
            ixmaps.newTheme("layer", theme, flag);
            return this;
        },
        add: function (theme, flag) {
            ixmaps.newTheme("layer", theme, flag);
            return this;
        },


        changeThemeStyle: function (szTheme, style, flag) {
            ixmaps.changeThemeStyle(szTheme, style, flag);
            return this;
        },

        removeTheme: function (szTheme) {
            ixmaps.removeTheme(szTheme);
            return this;
        },
        remove: function (szTheme) {
            ixmaps.removeTheme(szTheme);
            return this;
        },

        replace: function (szTheme, theme, flag) {
            ixmaps.replaceTheme(szTheme, theme, flag);
            return this;
        },

        show: function (szTheme) {
            ixmaps.showTheme(szTheme);
            return this;
        },

        hide: function (szTheme) {
            ixmaps.hideTheme(szTheme);
            return this;
        },

        getLayer: function () {
            return ixmaps.getLayer(this.szMap);
        },

        getLayerDependency: function () {
            return ixmaps.getLayerDependency(this.szMap);
        },

        getTileInfo: function () {
            return ixmaps.getTileInfo(this.szMap);
        },

        switchLayer: function (szLayerName, fState) {
            ixmaps.switchLayer(szLayerName, fState);
            return this;
        },


        loadProject: function (szUrl, szFlag) {
            ixmaps.loadProject(szUrl, szFlag);
            return this;
        },
        project: function (szUrl, szFlag) {
            ixmaps.loadProject(szUrl, szFlag);
            return this;
        },

        setProject: function (szProject) {
            ixmaps.setProject(szProject);
            return this;
        },

        getProjectString: function () {
            return ixmaps.getProjectString(this.szMap);
        },


        loadSidebar: function (szUrl) {
            ixmaps.loadSidebar(szUrl);
            return this;
        },

        getData: function (szItem) {
            return ixmaps.getData(szItem);
        },

        require: function (szUrl) {
            ixmaps.require(szUrl);
            return this;
        },


        theme: function (szTheme, flag) {
            if (typeof (szTheme) == "object") {
                ixmaps.newTheme("layer", szTheme, flag);
                return this;
            } else {
                return new ixmaps.themeApi(szTheme);
            }
        },
        themes: function () {
            return ixmaps.getThemes(this.szMap);
        },
        getThemes: function () {
            return ixmaps.getThemes(this.szMap);
        },
        stopThemes: function () {
            return ixmaps.stopThemes(this.szMap);
        },
        startThemes: function () {
            return ixmaps.startThemes(this.szMap);
        },
        stop: function () {
            return ixmaps.stopThemes(this.szMap);
        },
        start: function () {
            return ixmaps.startThemes(this.szMap);
        },
        message: function (szMessage, nTimeout) {
            ixmaps.setMessage(szMessage, nTimeout);
            return this;
        }
    };

    /**
     * ixmaps.themeConstruct  
     * @class It realizes an object to create a theme JSON 
     * @constructor
     * @param {Object} [map] a map object to define the theme for
     * @return A new ixmaps.themeConstruct object
     */

    ixmaps.themeConstruct = function (szMap, szLayer) {
        this.szMap = szMap;
        this.def = {};
        this.def.layer = szLayer || "generic";
        this.def.data = {};
        this.def.style = {
            type: "CHART|DOT",
            lookupfield: "geometry"
        };
        this.def.field = "$item$";
    };
    ixmaps.themeConstruct.prototype = {
        data: function (dataObj, szType, szName) {
            var szName = szName || "DBTABLE" + Math.floor(Math.random() * 100000000);
            this.def.data.name = szName;
            if (dataObj) {
                if (typeof (dataObj) == "string") {
                    if (szType == "ext") {
                        this.def.data.ext = dataObj;
                        this.def.data.type = szType;
                    } else {
                        this.def.data.url = dataObj;
                        this.def.data.type = szType;
                    }
                } else {
                    if (szType) {
                        this.def.data.obj = dataObj;
                        this.def.data.szType = szType;
                    } else {
                        for (var i in dataObj) {
                            this.def.data[i] = dataObj[i];
                        }
                    }

                    if (dataObj.name) {
                        this.def.data.name = dataObj.name;
                    }
                    if (dataObj.url) {
                        this.def.data.type = szType || dataObj.type;
                        if (this.def.data.type && (this.def.data.type == "ext")) {
                            this.def.data.ext = dataObj.url;
                        } else {
                            this.def.data.url = dataObj.url;
                        }
                    } else
                    if (dataObj.ext) {
                        this.def.data.ext = dataObj.ext;
                        this.def.data.type = szType || dataObj.type || "ext";
                    } else
                    if (dataObj.query) {
                        this.def.data.query = dataObj.query;
                        this.def.data.type = szType || dataObj.type || "ext";
                    } else {
                        this.def.data.type = szType || dataObj.type;
                        //ixmaps.setData(dataObj,{type:szType,name:szName});
                    }

                }
            } else {
                this.def.data.type = szType || "ext";
            }
            if (this.def.data.type && this.def.data.type.match(/geojson|topojson/i)) {
                this.def.style.lookupfield = "geometry";
                this.def.style.type = "FEATURES|NOLEGEND";
            }
            return this;
        },
        process: function (szProcess) {
            this.def.data.process = szProcess;
            return this;
        },
        query: function (szQuery) {
            this.def.data.query = szQuery;
            alert("hi");
            return this;
        },
        field: function (szName) {
            this.def.field = szName;
            return this;
        },
        field100: function (szName) {
            this.def.field100 = szName;
            return this;
        },
        lookup: function (szName) {
            this.def.style.lookupfield = szName;
            return this;
        },
        geo: function (szName) {
            this.def.style.lookupfield = szName;
            return this;
        },
        binding: function (bObj) {
            this.def.binding = this.def.binding || {};
            for (var i in bObj) {
                this.def.binding[i] = bObj[i];
            }
            return this;
        },
        encoding: function (bObj) {
            this.def.binding = this.def.binding || {};
            for (var i in bObj) {
                this.def.binding[i] = bObj[i].field || bObj[i];
            }
            return this;
        },
        filter: function (szFilter) {
            this.def.style = this.def.style || {};
            this.def.style.filter = szFilter;
            return this;
        },
        type: function (szType) {
            this.def.style.type = szType;
            return this;
        },
        style: function (styleObj) {
            this.def.style = this.def.style || {};
            for (var i in styleObj) {
                this.def.style[i] = styleObj[i];
            }
            return this;
        },
        meta: function (styleObj) {
            this.def.meta = this.def.meta || {};
            for (var i in styleObj) {
                this.def.meta[i] = styleObj[i];
            }
            return this;
        },
        title: function (szTitle) {
            this.def.style.title = szTitle;
            return this;
        },

        // get the theme definition object (JSON)

        definition: function () {
            return this.def;
        },
        define: function () {
            return this.def;
        },
        json: function () {
            return this.def;
        }

    };

    /**
     * ixmaps.map 
     * get an ixmaps.mapApi instance
     * @param {String} [szMap] a map name to get the handle from
     * @return A new ixmaps.mapApi instance
     */
    ixmaps.api = function (szMap) {
        return new ixmaps.mapApi(szMap);
    };


    /**
     * ixmaps.theme 
     * get an ixmaps.themeConstructer instance
     * @param {String} [szLayer] the name of a layer to define or to refer
     * @return A new ixmaps.themeConstruct instance
     */
    ixmaps.theme = function (szLayer) {
        return new ixmaps.themeConstruct(this.szMap, szLayer);
    }

    /**
     * ixmaps.layer 
     * get an ixmaps.themeConstructer instance
     * @param {String} [szLayer] the name of a layer to define or to refer
     * @return A new ixmaps.themeConstruct instance
     */
    ixmaps.layer = function (szLayer, callback) {
        if (callback) {
            var layer = new ixmaps.themeConstruct(this.szMap, szLayer);
            callback(layer);
            return layer.json();
        }
        return new ixmaps.themeConstruct(this.szMap, szLayer);
    }

        // -------------------------------------------
        // search tool 
        // ------------------------------------------- 

        ixmaps.search = ixmaps.search || {};

        ixmaps.search.show = function(fFlag) {
            $("#switchsearchbutton").show();
            $("#switchsearchbutton").button().click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(".search-container").css('top', $("#switchsearchbutton").offset().top);
                $(".search-container").css('left', $("#switchsearchbutton").offset().left);
                $("#switchsearchbutton").hide();
                $(".search-container").show().animate({
                    width: "400px"
                }, 500);
                $(".search-box").show();
            });
            $(".search-container").click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                $(".search-container").animate({
                    width: "0px"
                }, 500);
                $(".search-container").hide();
                $(".search-box").val("");
                $("#switchsearchbutton").show();
            });
            $(".search-box").click(function(e) {
                e.stopPropagation();
            });
            setTimeout('$("#onmapbuttondiv").show();', 1000);
        };

        ixmaps.search.positionResultList = function(input) {
            $('.result-list').css({
                width: input.outerWidth(),
                top: input.offset().top + input.outerHeight(),
                left: input.offset().left
            });
        };

        ixmaps.search.showQueryMessage = function() {
            $('.result-list').empty();
            this.positionResultList($('.search-box'));
            var itemObject = $('<div class="result-item" title="searching"><em>searching ...</em></div>');
            $('.result-list').append(itemObject);
            $('.result-list').show();
        };

        ixmaps.search.renderResults = function(result) {
            $('.result-list').empty();
            this.positionResultList($('.search-box'));
            if (!result) {
                var itemObject = $('<div class="result-item" title="not found"><em>' + $('.search-box').val() +
                    '</em> not found!</div>');
                $('.result-list').append(itemObject);
                $('.result-list').show();
                return;
            }
            var i = 0;
            result.forEach(function(item) {
                if (++i < 10) {
                    var itemStr = '<div class="result-item" title="' + item.display_name + '">' + item.display_name + '</div>';
                    var itemObject = $(itemStr);
                    itemObject.data(item);
                    $('.result-list').append(itemObject);
                }
            });
            $('.result-list').show();
        };

        ixmaps.search.renderMap = function(data) {

            ixmaps.search.result = data;

            var x = (Number(data.boundingbox[0]) + Number(data.boundingbox[1])) / 2;
            var y = (Number(data.boundingbox[2]) + Number(data.boundingbox[3])) / 2;

            if (data.class == "place") {
                ixmaps.setView([x, y], 13);
            } else {
                ixmaps.setBounds([Number(data.boundingbox[0]), Number(data.boundingbox[2]), Number(data.boundingbox[1]), Number(
                    data.boundingbox[3])]);
            }

            var __szBookmark = "map.Api.doZoomMapToGeoBounds(" + data.boundingbox[0] + "," + data.boundingbox[2] + "," + data.boundingbox[
                1] + "," + data.boundingbox[3] + ");";
            setTimeout("ixmaps.execBookmark('" + __szBookmark + "')", 100);

            $('.search-box').val(data.display_name.replace(data.address.hamlet + ', ', ''));
        };

        ixmaps.search.szSearchSuffix = "";
        ixmaps.search.queryNominatim = function() {
            ixmaps.search.lastSearch = $('.search-box').val();
            // GR 15.11.2022 nominatim URL changed, suffix not any longer possible
            //var query = encodeURIComponent($('.search-box').val() + ((this.szSearchSuffix.length > 1) ? ("," + this.szSearchSuffix) :
            //	""));
            var query = encodeURIComponent($('.search-box').val());
            $('.error').hide();
            $('.result-list').empty().hide();

            this.showQueryMessage();

            $.ajax({
                url: "https://nominatim.openstreetmap.org/search?key=9VpTwb1ib382pomWexOxmr2J67UtDJKN&q=" + query +
                    "&format=json&addressdetails=1",
                success: function(result) {
                    if (result.length) {
                        ixmaps.search.renderResults(result);
                    } else {
                        ixmaps.search.renderResults(null);
                        $('.error').show();
                    }
                }
            });
        };

        ixmaps.search.selectResult = function(item) {
            $('.result-item').removeClass('selected');
            item.addClass('selected');
        };

        ixmaps.search.renderMapFromResult = function() {
            var target = $('.result-item.selected');
            ixmaps.search.renderMap(target.data());
            $('.result-list').empty().hide();
        };

        $('.result-list')
            .on('click', '.result-item', ixmaps.search.renderMapFromResult)
            .on('mouseenter', '.result-item', function(e) {
                $(e.currentTarget).addClass('selected');
            })
            .on('mouseleave', '.result-item', function(e) {
                $(e.currentTarget).removeClass('selected');
            });

        $(document).on('keydown', '.search-box', function(e) {
            var pressed = e.which;
            var keys = {
                enter: 13,
                up: 38,
                down: 40
            };
            if (pressed === keys.enter) {
                $('.result-item.selected').length ? ixmaps.search.renderMapFromResult() : ixmaps.search.queryNominatim();
            } else if (pressed === keys.up) {
                if (!$('.result-item.selected').length || $('.result-item.selected').is(':first-child')) {
                    // Choose last
                    ixmaps.search.selectResult($('.result-item:last-child'));
                } else {
                    // Choose prev item
                    ixmaps.search.selectResult($('.result-item.selected').prev());
                }
            } else if (pressed === keys.down) {
                if (!$('.result-item.selected').length || $('.result-item.selected').is(':last-child')) {
                    // Choose first 
                    ixmaps.search.selectResult($('.result-item:first-child'));
                } else {
                    // Choose next item
                    ixmaps.search.selectResult($('.result-item.selected').next());
                }
            } else {
                if ($('.result-item').length) {
                    $('.result-list').empty().hide();
                }
            }
        });

        var __queryNominatimTimeout = null;

        $(document).on('keyup', '.search-box', function(e) {
            var pressed = e.which;
            var keys = {
                enter: 13,
                up: 38,
                down: 40
            };
            if (pressed !== keys.enter) {
                if (__queryNominatimTimeout) {
                    clearTimeout(__queryNominatimTimeout);
                }
                __queryNominatimTimeout = setTimeout("ixmaps.search.queryNominatim()", 500);
            }
        });

        $(document).on('blur', '.search-box', function() {
            if ($('.result-item').length) {
                setTimeout("$('.result-list').empty().hide();", 500);
            }
        });


        $(document).on('click', '.search-btn', ixmaps.search.queryNominatim);


        // ------------------------------------------- 
        // END search tool 
        // ------------------------------------------- 






}(window, document));
// .............................................................................
// EOF
// .............................................................................
