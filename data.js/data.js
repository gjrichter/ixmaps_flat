/**********************************************************************
data.js

$Comment: provides JavaScript for loading, parsing, selection, transforming and caching data tables
$Source :data.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2016/26/09 $
$Author: guenter richter $
$Id:data.js 1 2016-26-09 10:30:35Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:data.js,v $
**********************************************************************/

/** 
 * @fileoverview
 * provides an object and methods to load, parse and process various data sources.<br>
 * The <b>sources</b> may be of the following type: <b>csv</b>, <b>json</b>, <b>geojson</b>, <b>kml</b> e <b>rss</b>.<br>
 * The <b>methods</b> to load data are: 
 * <ul><li>Data.<b>feed()</b> to load from url</li>
 * <li>Data.<b>import()</b> to import javascript objects and</li>
 * <li>Data.<b>broker()</b> to load more than one source</li></ul>
 * The loaded data is stored in a Table object which gives the user the methods to transform the data.<br>
 * The format of the data of a Table object is jsonDB, the same format used internaly by iXmaps.
 * @example 
 *
 *  // define data source
 *  var szUrl = "https://raw.githubusercontent.com/emergenzeHack/terremotocentro/master/_data/issues.csv";
 *
 *  // load data from feed
 *  var myfeed = Data.feed({"source":szUrl,"type":"csv"}).load(function(mydata){
 *
 *      // on data load succeeds, process the loaded data via mydata object
 *      // create new columns 'date' and 'hour' from one timestamp column
 *      // we need them to create pivot tables 
 *      // ---------------------------------------------------------------
 *      mydata.addColumn({'source':'created_at','destination':'date'},function(value){
 *          var d = new Date(__normalizeTime(value));
 *          return( String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear()) );
 *      });
 *
 *      // get the hours
 *      // -----------------------------------------
 *      var hoursA = mydata.column("hour").values();
 *
 *      // do something ... 
 *
 *      // make a pivot table from the values in column 'state'
 *      // ----------------------------------------------------
 *      var pivot = mydata.pivot({ "lead":	'date',
 *                                 "keep":  ['created_at'],	
 *                                 "cols":	'state' 
 *                               });
 *
 *      // invert data table (let the last record be the first)
 *      // ----------------------------------------------
 *      pivot = pivot.revert();
 *
 *      // make chart with 2 curves, total and closed issues
 *      // -------------------------------------------------
 *      var set1  = pivot.column("Total").values();
 *      var set2  = pivot.column("closed").values();
 *
 *     ....
 * }).error(function(e){
 *      alert("Data.feed error: " + e);
 * });
 *
 * @author Guenter Richter guenter.richter@medienobjekte.de
 * @version 1.51 
 * @copyright CC BY SA
 * @license MIT
 */

(function (window, document, undefined) {

    // write to console with time in sec : millisec
    //
    const _log_start_time = new Date();
    _LOG = function (szLog) {
        var time = ((new Date()) - _log_start_time) / 1000;
        console.log("_LOG: time[sec.ms] " + time + "\n" + szLog);
    };

    // force string arrays 

    /**
     * test if object is array 
     * @param obj the object to test
     * @returns true/false
     * @type {boolean}
     */
    __isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    /**
     * make sure, object is type array 
     * @param obj the object to transform
     * @returns array
     * @type {Array}
     */
    __toArray = function (obj) {
        if (!obj || typeof (obj) == 'undefined') {
            return [];
        } else
        if (__isArray(obj)) {
            return obj;
        } else {
            return (String(obj).match(/\|/)) ? String(obj).split('|') : String(obj).split(',');
        }
    };

    /**
     * get array with unique values
     * by filter function 
     * @returns array
     * @type {Array}
     */
    __onlyUnique = function (value, index, self) {
        return self.indexOf(value) === index;
    };

    /** 
     * @namespace 
     */

    var Data = {
        version: "1.52",
        errors: []
    };

    function expose() {
        const oldData = window.Data;

        Data.noConflict = function () {
            window.Data = oldData;
            return this;
        };

        window.Data = Data;
    }

    // define Data for Node module pattern loaders, including Browserify
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = Data;

        // define Data as an AMD module
    } else if (typeof define === 'function' && define.amd) {
        define(Data);
    }

    // define Data as a global variable, saving the original Data to restore later if needed
    if (typeof window !== 'undefined') {
        expose();
    }

    /**
     * Create a new Data.Object instance.  
     * @class It realizes an object to load and handle internal (already defined as JavaScript object) data sources (CSV,JSON,...)
     * @constructor
     * @param {Object} options <p>{ <b>source</b>: <em>JavaScript object</em>,
     *								   <table border='0' style='border-left: 1px solid #ddd;'>	
     *								   <tr><th>type</th><th>description</th></tr>
     *								   <tr><td><b>"csv"</b></td><td>the source is 'plain text' formatted as Comma Separated Values<br>delimiter supported: , and ;</td></tr>
     *								   <tr><td><b>"json"</b></td><td>the source is JSON (Javascript Object Notation)</td></tr>
     *								   <tr><td><b>"geojson"</b></td><td>the source is a JSON object formatted in <a href="https://geojson.org/" target="_blank">GeoJson</a></td></tr>
     *								   <tr><td><b>"rss"</b></td><td>the source is an xml rss feed</td></tr>
     *								   <tr><td><b>"kml"</b></td><td>the source is in Keyhole Markup Language</td></tr>
     *								   </table> 
     * @type {Data.Object}
     * @example
     * // load the data table defined by a JSON object named response and get the values of one column 
     *
     * Data.object({"source":response,"type":"json"}).import(function(mydata){
     *     var a = mydata.column("column name").values();
     *     ...
     * });
     * @returns A new Data.Import object
     */

    Data.Object = function (options) {
        this.options = options;
        this.debug = false;
    };

    Data.Object.prototype = {

        /**
         * set data from the specified source and call user function
         * @param {function} function(result) the function to call when data is successfully imported<br>
         * the argument passed is a Data.Table object with the imported data 
         * @type {Data.Object}
         * @returns itself 
         */
        import: function (callback) {

            this.options.success = callback;

            // we create a dummy Data.feed to use its parser
            this.feed = Data.feed({});

            // pass options to the Data.feed
            this.feed.options = this.options;

            // import data and create table, calls the callback when done
            if ((this.options.type == "csv") || (this.options.type == "CSV")) {
                this.feed.__processCSVData(this.options.source, this.options);
            } else
            if ((this.options.type == "rss") || (this.options.type == "RSS")) {
                this.options.format = "xml";
                this.feed.__processRSSData(this.options.source, this.options);
            } else
            if ((this.options.type == "kml") || (this.options.type == "KML")) {
                this.options.format = "xml";
                this.feed.__processKMLData(this.options.source, this.options);
            } else
            if ((this.options.type == "json") || (this.options.type == "JSON") || (this.options.type == "Json")) {
                this.feed.__processJsonData(this.options.source, this.options);
            } else
            if ((this.options.type == "geojson") || (this.options.type == "GEOJSON") || (this.options.type == "GeoJson")) {
                this.feed.__processGeoJsonData(this.options.source, this.options);
            } else
            if ((this.options.type == "topojson") || (this.options.type == "TOPOJSON") || (this.options.type == "TopoJson")) {
                this.feed.__processTopoJsonData(this.options.source, this.options);
            } else
            if ((this.options.type == "jsonDB") || (this.options.type == "JSONDB") || (this.options.type == "JsonDB") ||
                (this.options.type == "jsondb")) {
                this.feed.__processJsonDBData(this.options.source, this.options);
            }
            return this;
        },
        /**
         * error function
         * define a function to handle a loading error
         * @param {function} function(errorText) a user defined function to call when an error occurs
         * @type {Data.Object}
         * @returns itself  
         */
        error: function (callback) {
            this.options.error = callback;
            return this;
        }
    };

    /**
     * Create a new Data.Import instance.  
     * @class It realizes an object to load and handle internal (already defined as JavaScript object) data sources (CSV,JSON,...)
     * @constructor
     * @param {Object} options <p>{ <b>source</b>: <em>JavaScript object</em>,
     *								   <table border='0' style='border-left: 1px solid #ddd;'>	
     *								   <tr><th>type</th><th>description</th></tr>
     *								   <tr><td><b>"csv"</b></td><td>the source is 'plain text' formatted as Comma Separated Values<br>delimiter supported: , and ;</td></tr>
     *								   <tr><td><b>"json"</b></td><td>the source is JSON (Javascript Object Notation)</td></tr>
     *								   <tr><td><b>"geojson"</b></td><td>the source is a JSON object formatted in <a href="https://geojson.org/" target="_blank">GeoJson</a></td></tr>
     *								   <tr><td><b>"topojson"</b></td><td>the source is a JSON object formatted in <a href="https://github.com/topojson/topojson" target="_blank">TopoJson</a></td></tr>
     *								   <tr><td><b>"jsonDB"</b></td><td>the source is a jsonDB table object</td></tr>
     *								   <tr><td><b>"rss"</b></td><td>the source is an xml rss feed</td></tr>
     *								   </table> 
     * @type {Data.Object}
     * @example
     * // load the data table defined by a JSON object named response and get the values of one column 
     *
     * table = Data.import({"source":response,"type":"json"});
     *
     * var a = table.column("column name").values();
     * @returns A new Table object
     */

    Data.Import = function (options) {
        this.options = options;
        this.debug = false;
    };

    /**
     * Create a new Data.Feed instance.  
     * @class It realizes an object to load and handle one data sources
     * @constructor
     * @param {Object} options <p>{ <b>source</b>: <em>url or filename</em>,
     *                                <b>type</b>: <em>see table below</em> }</p>
     *								   <table border='0' style='border-left: 1px solid #ddd;'>	
     *								   <tr><th>type</th><th>description</th></tr>
     *								   <tr><td><b>"csv"</b></td><td>the source is 'plain text' formatted as Comma Separated Values<br>delimiter supported: , and ;</td></tr>
     *								   <tr><td><b>"json"</b></td><td>the source is JSON (Javascript Object Notation)</td></tr>
     *								   <tr><td><b>"JSON-stat"</b></td><td>the source is a JSON object formatted in <a href="https://json-stat.org/JSON-stat" target="_blank">JSON-stat</a></td></tr>
     *								   <tr><td><b>"jsonDB"</b></td><td>the source is in ixmaps internal data table format</td></tr>
     *								   <tr><td><b>"rss"</b></td><td>the source is an xml rss feed</td></tr>
     *								   </table> 
     * @type {Data.Feed}
     * @returns a new Data.Feed object
     * @example
     * var szUrl = "https://raw.githubusercontent.com/emergenzeHack/terremotocentro/master/_data/issues.csv";
     * var myfeed = new Data.Feed("Segnalazioni",{"source":szUrl,"type":"csv"}).load(function(mydata){
     *	
     *    // when the feed is loaded, it calls the function you defined
     *    // with the loaded data as argument; it is a Table object, so you can use its methods
     *    // example: create new columns 'date' and 'hour' from one timestamp column
     *    // ---------------------------------------------------------------
     *    mydata = mydata.addColumn({'source':'created_at','destination':'date'},
     *        function(value){
     *            var d = new Date(__normalizeTime(value));
     *            return( String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear()) );
     *     });
     *  });
     *
     *  // Note: instead of new Data.Feed() you can also use the factory function Data.feed()
     *  var myfeed = Data.feed("Segnalazioni",{"source":szUrl,"type":"csv"}).load(function(mydata){
     *  ...
     *     
     */

    Data.Feed = function (options) {
        this.options = options || {};
        this.debug = false;
        this.options.error = function (e) {
            Data.errors.push(e);
        };
    };

    Data.Feed.prototype = {

        /**
         * load the data from the source specified in the Data.Feed instance and call a user defined callback function on success
         * @param {function} function(data) the function to call when data is successfully loaded<br> it receives a {Data.Table} object with the loaded data
         * @type {Object}
         * @returns the {@link Data.Feed} object
         * @example
         * var szUrl = "https://raw.githubusercontent.com/emergenzeHack/terremotocentro/master/_data/issues.csv";
         * var myfeed = Data.feed({"source":szUrl,"type":"csv"}).load(function(mydata){
         *	...
         *  });
         */
        load: function (callback) {

            this.options.success = callback;

            const option = this.options;
            const szUrl = option.source || option.src || option.url || option.ext;

            if (typeof (option.cache) === 'undefined') {
                option.cache = true;
                if (option.options && typeof (option.options.cache) !== 'undefined') {
                    option.cache = option.options.cache;
                }
            }

            const __this = this;

            if (!szUrl) {
                _alert("Data.feed(...).load(): no source defined !", 2000);
            }

            if ((option.type == "csv") || (option.type == "CSV")) {
                this.__doCSVImport(szUrl, option);
            } else
            if ((option.type == "rss") || (option.type == "RSS")) {
                this.__doRSSImport(szUrl, option);
            } else
            if ((option.type == "kml") || (option.type == "KML")) {
                this.__doKMLImport(szUrl, option);
            } else
            if ((option.type == "json") || (option.type == "JSON") || (option.type == "Json")) {
                this.__doJSONImport(szUrl, option);
            } else
            if ((option.type == "geojson") || (option.type == "GEOJSON") || (option.type == "GeoJson")) {
                this.__doGeoJSONImport(szUrl, option);
            } else
            if ((option.type == "topojson") || (option.type == "TOPOJSON") || (option.type == "TopoJson")) {
                this.__doTopoJSONImport(szUrl, option);
            } else
            if ((option.type == "jsonDB") || (option.type == "JSONDB") || (option.type == "JsonDB") || (option.type == "jsondb")) {
                this.__doJsonDBImport(szUrl, option);
            } else
            if ((option.type == "jsonstat") || (option.type == "jsonStat") || (option.type == "JSONSTAT")) {
                $.getScript("http://json-stat.org/lib/json-stat.js")
                    .done(function (script, textStatus) {
                        __this.__doLoadJSONstat(szUrl, option);
                        return;
                    })
                    .fail(function (jqxhr, settings, exception) {
                        _alert("'" + option.type + "' unknown format !");
                    });
            } else {
                _alert("'" + option.type + "' unknown format !");
            }
            return this;
        },
        /**
         * define a function to handle a loading error
         * @param {function} function(errorText) a user defined function to call when an error occurs
         * @type {Object}
         * @returns the {@link Data.Feed} object
         * @example
         * var myfeed = Data.feed("Segnalazioni",{"source":szUrl,"type":"csv"})
         *
         *              .error(function(e){alert(e);})
         *
         *              .load(function(mydata){
         *	               ...
         *              });
         */
        error: function (callback) {
            this.options.error = callback;
            return this;
        }
    };


    // @section

    // @factory Data.feed(options: Data options)
    // Instantiates a data object to load external data via URL
    // and an object literal with `data options`.
    //

    Data.feed = function (options) {
        return new Data.Feed(options);
    };

    // @factory Data.object(options: Data options)
    // Instantiates a data object
    // and an object literal with `data options`.
    //

    Data.object = function (options) {
        return new Data.Object(options);
    };

    // @factory Data.import(options: Data options)
    // Instantiates a data object to import data into Data
    // and an object literal with `data options`.
    //

    Data.import = function (options) {
        return new Data.Object(options).import().feed.dbtable;
    };


    var ixmaps = ixmaps || {};

    // -----------------------------
    // D A T A    L O A D E R 
    // -----------------------------

    // ---------------------------------
    // J S O N s t a t  
    // ---------------------------------
    /**
     * doLoadJSONstat 
     * reads JSONstat format using JSONstat Javascript
     * parses the data into the map data source
     * @param szUrl JSONstat URL
     * @param opt options
     * @type void
     */
    Data.Feed.prototype.__doLoadJSONstat = function (szUrl, opt) {

        const __this = this;

        JSONstat(szUrl,
            function () {

                const dataA = [];

                // for now we take dimension 0 and 1
                // 0 for the y axis = first column
                // 1 for the x axis = values columns

                // first row = column names
                //
                let row = [this.Dataset(0).Dimension(0).label];
                const index = this.Dataset(0).Dimension(1).id;
                for (let i = 0; i < index.length; i++) {
                    row.push(this.Dataset(0).Dimension(1).Category(index[i]).label);
                }
                dataA.push(row);

                // data rows
                //
                for (let i = 0; i < this.Dataset(0).Dimension(0).length; i++) {
                    row = [];
                    row.push(this.Dataset(0).Dimension(0).Category(this.Dataset(0).Dimension(0).id[i]).label);
                    for (let ii = 0; ii < this.Dataset(0).Dimension(1).length; ii++) {
                        row.push(this.Dataset(0).Data([i, ii]).value);
                    }
                    dataA.push(row);
                }

                // user defined callback
                if (opt.callback) {
                    opt.callback(dataA, opt);
                    return;
                }

                // finish the data table object 
                __this.__createDataTableObject(dataA, opt.type, opt);

            });
    };

    // ---------------------------------
    // J s o n D B 
    // ---------------------------------

    /**
     * doJsonDBImport 
     * reads JsonDB files from URL
     * JsonDB files are regural JavaScript files, the data object is parsed automatically on load 
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__doJsonDBImport = function (szUrl, opt) {

        _LOG("__doJsonDBImport: " + szUrl);
        const __this = this;

        opt.url = szUrl;

        $.getScript(szUrl + ".gz")
            .done(function (script, textStatus) {
                __this.__processJsonDBData(script, opt);
            })
            .fail(function (jqxhr, settings, exception) {
                $.getScript(szUrl)
                    .done(function (script, textStatus) {
                        __this.__processJsonDBData(script, opt);
                    })
                    .fail(function (jqxhr, settings, exception) {
                        if (__this.options.error) {
                            __this.options.error("\"" + szUrl + "\" " + exception);
                        }
                    });
            });
    };

    Data.Feed.prototype.__processJsonDBData = function (script, opt) {

        _LOG("__processJsonDBData:");

        // create data object
        // ------------------
        this.dbtable = new Data.Table();
        let loadedTable = null;
        if (typeof (script) == "string") {
            const name = opt.source.split(/\//).pop().split(/\./)[0];
            loadedTable = (typeof window !== "undefined" ? window[name] : global[name]);
        } else {
            loadedTable = opt.source;
        }

        this.dbtable.table = loadedTable.table;
        this.dbtable.fields = loadedTable.fields;
        this.dbtable.records = loadedTable.records;

        // user defined callback ??
        if (opt.callback) {
            opt.callback(newData, opt);
            return;
        }

        // deploy the object into the map
        // ------------------------------
        if ((typeof (opt) != "undefined") && opt.success) {
            opt.success(this.dbtable);
        }
    };


    // ---------------------------------
    // C S V 
    // ---------------------------------

    /**
     * __doCSVImport 
     * reads CSV files from URL
     * parses the data into the map data source
     * @param szUrl csv file url
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__doCSVImport = function (szUrl, opt) {

        _LOG("__doCSVImport: " + szUrl);
        const __this = this;
        $.ajax({
            type: "GET",
            url: szUrl,
            cache: opt.cache,
            dataType: "text",
            success: function (data) {
                __this.__processCSVData(data, opt);
            },
            error: function (jqxhr, settings, exception) {
                if ((typeof (opt) != "undefined") && opt.error) {
                    opt.error("\"" + szUrl + "\" " + exception);
                }
            }
        });
    };

    /**
     * __processCSVData
     * Parses the loaded CSV text data and creates a data object.
     *
     * @param {string} csv - The CSV text string.
     * @param {Object} opt - Optional options.
     * @param {function} [opt.callback] - A callback function to receive the raw parsed data.
     * @param {Object} [opt.parser] - Papa Parse options.
     * @param {function} [opt.error] - A callback function to handle parsing errors.
     * @param {Object} [opt.options] - Additional options (e.g., name).
     * @param {string} [opt.type] - The data type (e.g., "csv").
     * @returns {boolean} - Returns false if there's an error or a callback is defined.
     */
    Data.Feed.prototype.__processCSVData = function (csv, opt) {
        _LOG("__processCSVData - start");

        // Check if Papa Parse is loaded. If not, load it and retry.
        if (typeof Papa === "undefined") {
            _LOG("__processCSVData:load csv parser!");
            const __this = this;
            $.getScript("https://cdnjs.cloudflare.com/ajax/libs/PapaParse/4.1.2/papaparse.min.js")
                .done(function (script, textStatus) {
                    __this.__processCSVData(csv, opt);
                })
                .fail(function (jqxhr, settings, exception) {
                    _alert("'" + opt.type + "' parser not loaded !");
                    if (opt.error) {
                        opt.error("'" + opt.type + "' parser not loaded !");
                    }
                });
            return false; // Indicates that the function is waiting for the parser to load.
        }

        // Parse the CSV data.
        let parsedData = Papa.parse(csv, opt.parser);
        
        if (parsedData.errors.length){
            _alert("csv parsing error: " + parsedData.errors.map(e=>e.message).join(';'));
            if (opt.error) {
                opt.error("csv parsing error: " + parsedData.errors.map(e=>e.message).join(';'));
            }
            return false;
        }
        let newData = parsedData.data;

        // Check if the parsing resulted in at least two rows.
        if (newData.length < 2 || typeof newData[0] === "undefined" || typeof newData[1] === "undefined") {
            _alert("csv parsing error: insufficient rows in data !");
            if (opt.error) {
                opt.error("csv parsing error: insufficient rows in data !");
            }
            return false;
        }
       
        // Check if delimiter was not set.
        if (!opt.parser || !opt.parser.delimiter) {
             // Check if autodetect delimiter failed.
            if (newData[0].length !== newData[1].length) {
                _LOG("csv parser: autodetect failed");
                const delimiters = [";", ","];
                let success = false;
                for (const delimiter of delimiters) {
                    _LOG(`csv parser: delimiter = ${delimiter}`);
                    newData = Papa.parse(csv, { delimiter }).data;
                    if (newData[0].length === newData[1].length) {
                        success = true;
                        break;
                    }
                    _LOG(`csv parser: delimiter = ${delimiter} failed`);
                }
                if (!success) {
                    _alert("csv parsing error: unable to auto detect delimiter!");
                    if (opt.error) {
                        opt.error("csv parsing error: unable to auto detect delimiter!");
                    }
                    return false;
                }
            }
        }

        // Clean up trailing empty rows and columns.
        if (newData[newData.length - 1].length !== newData[0].length && newData.length > 1) {
            newData.pop();
        }

        // Clean up extra empty columns
        if (newData[0].length - newData[1].length === 1) {
            if (newData[0][newData[0].length - 1].trim() === "") {
                newData[0].pop();
            }
        }

        // User-defined callback with raw data.
        if (opt.callback) {
            opt.callback(newData, opt);
            return false;
        }

        _LOG("__createDataTableObject: " + (opt.options ? " -> " + opt.options.name : ""));
        // Finish and create the data table object.
        this.__createDataTableObject(newData, opt.type, opt);

        return false;
    };

    // ---------------------------------
    // R S S
    // ---------------------------------

    /**
     * __doRSSImport 
     * reads RSS feed from URL
     * parses the data into a table
     * @param szUrl rss feed url
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__doRSSImport = function (szUrl, opt) {

        _LOG("__doRSSImport: " + szUrl);
        const __this = this;

        opt.format = "xml";

        $.ajax({
            type: "GET",
            url: szUrl,
            dataType: "xml",
            success: function (data) {
                __this.__processRSSData(data, opt);
            },
            error: function (jqxhr, settings, exception) {
                if ((typeof (opt) != "undefined") && opt.error) {
                    opt.error(jqxhr, settings, exception);
                }
            }
        });

    };

    /**
     * __processRSSData 
     * parse the loaded RSS xml data and create data object
     * @param the rss object
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__processRSSData = function (data, opt) {

        if (opt.format == "xml") {

            if ($(data).find('rss').length) {
                this.__parseRSSData(data, opt);
            } else
            if ($(data).find('feed').length) {
                _alert("feed not yet supported");
            } else
            if ($(data).find('atom').length) {
                _alert("atom not yet supported");
            }
        }
    };

    /**
     * __parseRSSData 
     * parse the loaded RSS xml data and create data object
     * @param the rss object
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__parseRSSData = function (data, opt) {

        const __this = this;

        if (opt.format == "xml") {

            $(data).find('channel').each(function () {

                const dataA = [];
                let childNamesA = null;

                $(data).find('item').each(function () {

                    // get item fieldnames from the first item of the channel
                    // ------------------------------------------------------
                    if (!childNamesA) {
                        const check = [];
                        childNamesA = [];
                        const childs = $(this).children();
                        for (let i = 0; i < childs.length; i++) {
                            let szNode = $(this).children()[i].nodeName;
                            while (check[szNode]) {
                                szNode += "*";
                            }
                            check[szNode] = szNode;
                            childNamesA[i] = szNode;
                        }

                        dataA.push(childNamesA);
                    }

                    // make one item values
                    const row = [];
                    for (let i = 0; i < childNamesA.length; i++) {
                        if (childNamesA[i] == "enclosure") {
                            row.push(($(this).find(childNamesA[i] + ':first').attr("url")) || "");
                        } else {
                            row.push(($(this).find(childNamesA[i] + ':first').text()) || "");
                        }
                    }
                    dataA.push(row);
                });

                __this.__createDataTableObject(dataA, "rss", opt);

            });
        }
    };

    // ---------------------------------
    // K M L
    // ---------------------------------

    /**
     * __doKMLImport 
     * reads KML feed from URL
     * parses the data into a table
     * @param szUrl kml feed url
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__doKMLImport = function (szUrl, opt) {

        _LOG("__doKMLImport: " + szUrl);
        const __this = this;

        opt.format = "xml";

        $.ajax({
            type: "GET",
            url: szUrl,
            dataType: "xml",
            success: function (data) {
                __this.__processKMLData(data, opt);
            },
            error: function (jqxhr, settings, exception) {
                if ((typeof (opt) != "undefined") && opt.error) {
                    opt.error(jqxhr, settings, exception);
                }
            }
        });

    };

    /**
     * __processKMLData 
     * parse the loaded KML xml data and create data object
     * @param the kml object
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__processKMLData = function (data, opt) {

        if (opt.format == "xml") {

            if ($(data).find('kml').length) {
                this.__parseKMLData(data, opt);
            } else {
                _alert("feed not kml");
            }
        }
    };

    /**
     * __parseRSSData 
     * parse the loaded RSS xml data and create data object
     * @param the rss object
     * @param opt optional options
     * @type void
     */
    Data.Feed.prototype.__parseKMLData = function (data, opt) {

        const __this = this;

        if (opt.format == "xml") {

            const document = $(data).find('Document');

            const dataA = [];
            let childNamesA = null;

            document.find('Placemark').each(function () {

                const xdata = $(this).find('ExtendedData') || $(this);

                // get item fieldnames from the first item of the channel
                // ------------------------------------------------------
                if (!childNamesA) {
                    childNamesA = [];
                    xdata.find('Data').each(function () {
                        childNamesA.push($(this).attr("name"));
                    });
                    if ($(this).find('Point').find('coordinates')) {
                        childNamesA.push('KML.Point');
                    }
                    dataA.push(childNamesA);
                }

                // make one item values
                const row = [];
                xdata.find('Data').each(function () {
                    row.push($(this).find("value").text());
                });
                if ($(this).find('Point').find('coordinates')) {
                    row.push($(this).find('Point').find('coordinates').text());
                }
                dataA.push(row);

            });

            __this.__createDataTableObject(dataA, "kml", opt);

        }
    };

    // ---------------------------------
    // J S O N  
    // ---------------------------------

    /** 
     * __doJSONImport 
     * reads a simple JSON table 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__doJSONImport = function (szUrl, opt) {

        const __this = this;
        $.get(szUrl,
            function (data) {
                __this.__processJsonData(data, opt);
            }).fail(function (e) {
            if ((typeof (opt) != "undefined") && opt.error) {
                opt.error(e);
            }
        });

    };

     /**
     * Generates a list of paths for all leaf nodes in a nested data structure,
     * replicating the traversal and path construction logic of the provided JavaScript code.
     *
     * @param {any} dataItem The current element (object, array, or primitive value) to explore.
     * @param {string} currentPath The accumulated path prefix up to the current element.
     * @returns {string[]} A list of strings, where each string represents a complete path
     *                     to a leaf node in the data structure.
     */
    __getNestedPaths = function(dataItem, currentPath = "") {
        const paths = [];

        // If the current element is an object (but not null and not an array)
        if (typeof dataItem === "object" && dataItem !== null && !Array.isArray(dataItem)) {
            for (const key in dataItem) {
                // Make sure the property is the object's own and not inherited
                if (Object.prototype.hasOwnProperty.call(dataItem, key)) {
                    const value = dataItem[key];
                    // Build the new path by appending the key
                    const newPath = currentPath ? `${currentPath}.${key}` : key;
                    paths.push(...__getNestedPaths(value, newPath));
                }
            }
        }
        // If the current element is an array
        else if (Array.isArray(dataItem)) {
            dataItem.forEach((value, index) => {
                // The original JavaScript code includes array indices in the path.
                // We replicate this behavior by adding the index to the path.
                const newPath = currentPath ? `${currentPath}.${index}` : String(index);
                paths.push(...__getNestedPaths(value, newPath));
            });
        }
        // Base case: the current element is neither an object nor an array, so it's a leaf node.
        // Add the accumulated path to the list.
        else {
            paths.push(currentPath);
        }

        return paths;
    };
   
    /**
     * Recursively extracts "leaf" values from a data element,
     * following the structure defined by a schema element.
     * Handles null values by pushing the string 'null'.
     *
     * @param {any} dataItem The current element from the actual data (e.g., data[i][a]).
     * @param {any} schemaItem The current element from the schema (e.g., data[0][a]).
     * @returns {Array<any>} A list of extracted values.
     */
    __extractValuesRecursive = function(dataItem, schemaItem) {
        let extractedValues = [];

        // Special case: if the data element is null, add the string 'null' as per original logic.
        if (dataItem === null || typeof dataItem === "undefined") {
            extractedValues.push('null');
        }
        // If the schema element is an object (not null, not an array), explore it recursively.
        // Use schemaItem to guide the traversal of properties.
        else if (typeof schemaItem === "object" && schemaItem !== null && !Array.isArray(schemaItem)) {
            for (const key in schemaItem) {
                // Make sure the property is the schema object's own and not inherited.
                if (Object.prototype.hasOwnProperty.call(schemaItem, key)) {
                    // Check if the data element has the corresponding property.
                    // If not, dataItem[key] will be undefined, which will be treated as a primitive.
                    const valueToProcess = Object.prototype.hasOwnProperty.call(dataItem, key) ? dataItem[key] : undefined;
                    extractedValues = extractedValues.concat(__extractValuesRecursive(valueToProcess, schemaItem[key]));
                }
            }
        }
        // If the schema element is an array, explore it recursively.
        // Use schemaItem to guide traversal by index.
        else if (Array.isArray(schemaItem)) {
            // Iterate through indices defined by the schema.
            for (let index = 0; index < schemaItem.length; index++) {
                // Check if the data element has a value at the corresponding index.
                // If not, dataItem[index] will be undefined, which will be treated as a primitive.
                const valueToProcess = index < dataItem.length ? dataItem[index] : undefined;
                extractedValues = extractedValues.concat(__extractValuesRecursive(valueToProcess, schemaItem[index]));
            }
        }
        // Base case: the schema element is neither an object nor an array (i.e., it's a primitive).
        // This means dataItem is the "leaf" value we want to extract.
        else {
            extractedValues.push(dataItem);
        }

        return extractedValues;
    };

    /** 
     * __processJsonData 
     * reads a simple JSON table 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__processJsonData = function (script, opt) {

        let data = null;
        
        if (typeof (script) == "string") {
            try {
                data = JSON.parse(script);
            } catch (e) {
                this.__createDataTableObject([], "json", opt);
            }
        } else {
            data = script;
        }
        this.data = data;

        let dataA = [];
        let row = [];

        // json with structure data.columns[] data.rows[][]
        // -------------------------------------------------
        if (data && data.data && data.data.columns && data.data.rows) {

            const columns = data.data.columns;
            const rows = data.data.rows;

            for (let i = 0, len = columns.length; i < len; i++) {
                row.push(columns[i]);
            }
            dataA.push(row);

            for (let i = 0, len = rows.length; i < len; i++) {
                row = [];
                for (let ii = 0, row0Len = rows[0].length; ii < row0Len; ii++) {
                    row.push(rows[i][ii]);
                }
                dataA.push(row);
            }

            // json without database structure
            // -------------------------------------------------
        } else {
            // if initial data object, take the data within
            if (data && data.data) {
                data = data.data;
            }

           // if initial object is not an array, search the first one 
           if( !Array.isArray(data) ) {
               
                __findAllArraysInJson = function (jsonObject){
                    const arrays = [];
                    function __recurse(obj) {
                    // Check if the current object is an array
                        if (Array.isArray(obj)) {
                            arrays.push(obj);
                        } else if (typeof obj === 'object' && obj !== null) {
                            // If it's an object, iterate over its keys
                            for (const key in obj) {
                                if (obj.hasOwnProperty(key)) {
                                    __recurse(obj[key]); // Recur for each key
                                }
                            }
                        }
                    }
                    __recurse(jsonObject);
                    return arrays;
                }; 
               
                let arrayA = __findAllArraysInJson(data);
                data = arrayA[0];
            }
            
            // was not able to parse json
            // set source as result
            
            if (!data){
                let dataA = [];
                dataA.push(["unknown type"]);
                const scriptA = script.split('\n');
                for (let i = 0, len = scriptA.length; i < len; i++){
                    dataA.push([scriptA[i]]);
                }
                this.__createDataTableObject(dataA, "json", opt); 
                return;
            }
            
            // create first row with field names
            dataA.push(__getNestedPaths(data[0]));

            // create data rows
            for (let i = 0; i < data.length; i++) {
                dataA.push(__extractValuesRecursive(data[i], data[0]));
            }
        }

        // finish the data table object 
        this.__createDataTableObject(dataA, "json", opt);
    };


    // ---------------------------------
    // G E O - J S O N  
    // ---------------------------------

    /** 
     * __doGeoJSONImport 
     * reads a simple JSON table 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__doGeoJSONImport = function (szUrl, opt) {

        const __this = this;
        $.get(szUrl,
            function (data) {
                __this.__processGeoJsonData(data, opt);
            }).fail(function (e) {
            if ((typeof (opt) != "undefined") && opt.error) {
                opt.error(e);
            }
        });

    };
    /** 
     * __processGeoJsonData 
     * reads a simple JSON table 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__processGeoJsonData = function (script, opt) {
        let data = null;

        if (typeof script === "string") {
            try {
                data = JSON.parse(script);
            } catch (e) {
                this.__createDataTableObject([], "json", opt);
                return; // Exit early on parse error
            }
        } else {
            data = script;
        }
        this.data = data;

        const dataA = [];
        const columns = {};

        if (data && data.features && data.features.length) {
            // Collect all unique property keys from all features
            for (const feature of data.features) {
                if (feature.properties) {
                    for (const p in feature.properties) {
                        columns[p] = true;
                    }
                }
            }

            // Create the header row (column names)
            const headerRow = Object.keys(columns);
            headerRow.push("geometry");
            dataA.push(headerRow);

            // Create data rows for each feature
            for (const feature of data.features) {
                const row = [];
                const properties = feature.properties || {}; // Handle cases where properties might be missing

                // Populate data based on the header row order
                for (let p = 0; p < headerRow.length - 1; p++) {
                    const propertyName = headerRow[p];
                    const propertyValue = properties[propertyName];

                    if (typeof propertyValue === "object") {
                        row.push(JSON.stringify(propertyValue));
                    } else {
                        row.push(propertyValue !== undefined ? propertyValue : "");
                    }
                }

                // Add the geometry to the row
                row.push(JSON.stringify(feature.geometry));
                dataA.push(row);
            }
        }

        // Finish the data table object
        this.__createDataTableObject(dataA, "json", opt);
    };

    /** 
     * __processGeoJsonData_expandProperty
     * reads a simple JSON table 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__processGeoJsonData_expandProperty = function (script, opt) {

        let data = null;
        
        if (typeof (script) == "string") {
            try {
                data = JSON.parse(script);
            } catch (e) {
                this.__createDataTableObject([], "json", opt);
            }
        } else {

            data = script;
        }
        this.data = data;

        let dataA = [];
        let row = [];
        const columns = [];

        if (data && data.features && data.features.length) {

            for (let i = 0; i < data.features.length; i++) {
                for (const p in data.features[i].properties) {
                    if (typeof data.features[i].properties[p] === "string" || typeof data.features[i].properties[p] === "number") {
                        columns[p] = true;
                    } else {
                        for (const pp in data.features[i].properties[p]) {
                            columns[p + "." + pp] = true;
                        }
                    }
                }
            }
            for (const p in columns) {
                row.push(p);
            }
            row.push("geometry");
            dataA.push(row);

            for (let i = 0; i < data.features.length; i++) {
                row = [];
                for (let p = 0; p < dataA[0].length - 1; p++) {
                    const xA = dataA[0][p].split(".");
                    if (xA.length >= 2) {
                        row.push(data.features[i].properties[xA[0]][xA[1]] || "");
                    } else {
                        row.push(data.features[i].properties[dataA[0][p]] || "");
                    }
                }
                row.push(JSON.stringify(data.features[i].geometry));
                dataA.push(row);
            }
        }
        // finish the data table object 
        this.__createDataTableObject(dataA, "json", opt);
    };

    // ---------------------------------
    // T O P O - J S O N  
    // ---------------------------------

    /** 
     * __doTopoJSONImport 
     * reads a topojson feed 
     * parses the data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__doTopoJSONImport = function (szUrl, opt) {

        const __this = this;
        $.get(szUrl,
            function (data) {
                __this.__processTopoJsonData(data, opt);
            }).fail(function (e) {
            if ((typeof (opt) != "undefined") && opt.error) {
                opt.error(e);
            }
        });

    };
    /** 
     * __processTopoJsonData 
     * parses topojson data into the map data source
     * @param file filename
     * @param i filenumber
     * @type void
     */
    Data.Feed.prototype.__processTopoJsonData = function (script, opt) {

        if (typeof (topojson) == "undefined") {
            _alert("'" + opt.type + "' parser not loaded !");
            return;
        }
        let data = null;
        if (typeof (script) == "string") {
            try {
                data = JSON.parse(script);
            } catch (e) {
                this.__createDataTableObject([], "json", opt);
            }
        } else {
            data = script;
        }
        this.data = data;

        let topoObject = null;

        // select topojson object by given name
        if (opt.options && opt.options.name && data.objects[opt.options.name]) {
            topoObject = topojson.feature(data, data.objects[opt.options.name]);
        } else
            // or take the first object
            for (var i in data.objects) {
                topoObject = topojson.feature(data, data.objects[i]);
                break;
            }

        for (const i in topoObject.features) {
            topoObject.features[i].properties.id = topoObject.features[i].id;
        }

        this.__processGeoJsonData(topoObject, opt);
    };



    // ---------------------------------
    // C R E A T E   D A T A   T A B L E 
    // ---------------------------------

    /**
     * __createTableDataObject 
     * finally make the data object with the iXmaps data structure
     * @type void
     */
    Data.Feed.prototype.__createDataTableObject = function (dataA, szType, opt) {

        if (dataA) {

            this.dbtable = new Data.Table().setArray(dataA);
            dataA = null;

            if ((typeof (opt) != "undefined") && opt.success) {
                opt.success(this.dbtable);
            } else {
                _LOG("callback to call on succes is 'undefined'!");
            }

            return;
        }
    };

    /**
     * Create a new Data.Table instance.  
     * <p>All data loaded by the methods <b>.feed()</b>, <b>.object()</b> and <b>.broker()</b> is stored in a Table instance.</p>
     * <p>The Table class provides the methods to read and process the data.</p>
     * @class It realizes an object to store <b>data</b> in <b>Data.Table </b>format and<br> provides the <b>methods</b> to load, read and process it
     * @example
     * // the data of the Table object ist stored like this example:
     * {
     *     table : {    
     *               fields:3,
     *              records:2
     *             },
     *    fields : [
     *              {id:"column 1"},
     *              {id:"column 2"},
     *              {id:"column 3"}
     *             ],
     *   records : [
     *              ["value11","value12","value13"],
     *              ["value21","value22","value23"]
     *             ]
     * }
     * @constructor
     * @type {Data.Table}
     * @returns A new Data.Table object<br><br>in the following the methods of the Data.Table to read and process the data
     */

    Data.Table = function (table) {
        if (table) {
            this.table = table.table;
            this.fields = table.fields;
            this.records = table.records;
        } else {
            this.table = {
                records: 0,
                fields: 0
            };
            this.fields = [];
            this.records = [];
        }
    };

    Data.Table.prototype = {

        /**
         * get the data of a Data.Table as 2d array
         * first row are the column names
         * @type {Array}
         * @returns table as array of arrays
         */
        getArray: function () {
            let dataA = [[]];
            for (let i = 0, len = this.fields.length; i < len; i++) {
                dataA[0].push(this.fields[i].id);
            }
            for (let i = 0, len = this.records.length; i < len; i++) {
                dataA.push(this.records[i]);
            }
            return dataA;
        },

        /**
         * set the data of a Data.Table by a given 2d array
         * first row must be the column names
         * @param {Array} dataA a 2 dimensionale array with the table data<br>first row must contain the column names
         * @type {Data.Table}
         * @return itself
         */
        setArray: function (dataA) {
            // first row of data => object.fields
            // ------------
            this.fields = [];
            for (let a = 0, len = dataA[0].length; a < len; a++) {
                this.fields.push({
                    id: (dataA[0][a] || " ").trim(),
                    typ: 0,
                    width: 60,
                    decimals: 0
                });
            }
            // following rows => object.records
            // --------------
            dataA.shift();

            // set records checking length
            this.records = [];
            for (let r = 0, len = dataA.length; r < len; r++) {
                if (dataA[r].length == this.fields.length) {
                    this.records.push(dataA[r]);
                }
            }
            this.table = {
                records: this.records.length,
                fields: this.fields.length
            };
            return this;
        },

        /**
         * revert the rows of a data table
         * @type {Data.Table}
         * @returns the reverted table
         */
        revert: function () {
            let records = [];
            for (let i = this.records.length - 1; i >= 0; i--) {
                records.push(this.records[i]);
            }
            this.records = records;
            return this;
        },

        /**
         * reverse the rows of a data table
         * @type {Data.Table}
         * @return the reversed table
         */
        reverse: function () {
            let records = [];
            for (let i = this.records.length - 1; i >= 0; i--) {
                records.push(this.records[i]);
            }
            this.records = records;
            return this;
        },

        /**
         * get an array of the column names
         * @type {Array}
         * @returns an array with the column names
         */
        columnNames: function () {
            const fieldsA = [];
            for (let i = 0, len = this.fields.length; i < len; i++) {
                fieldsA.push(this.fields[i].id);
            }
            return fieldsA;
        },

        /**
         * get the index of a column by its name<br>
         * useful if you have the values of one data row as array and want to access a column value
         * @param {string} columnName the name of the column
         * @type {number}
         * @return {number} the index of the column or null
         */
        columnIndex: function (szColumn) {
            for (var i in this.fields) {
                if (this.fields[i].id == szColumn) {
                    return i;
                }
            }
            return null;
        },

        /**
         * get a column object for one column from the Data.Table<br>
         * the column object provides methods to read or map the column values
         * @param {string} columnName the name of the column to get a handle to
         * @type {Data.Column}
         * @returns {Data.Column} Data.Column object
         * @example
         * var myfeed = new Data.Feed("Segnalazioni",{"source":szUrl,"type":"csv"}).load(function(mydata){
         *    var dateArray = mydata.column('created_at').values();
         *    ...
         * });
         */
        column: function (szColumn) {
            for (let i in this.fields) {
                if (this.fields[i].id == szColumn) {
                    const column = new Data.Column();
                    column.index = i;
                    column.table = this;
                    return column;
                }
            }
            return null;
        },

        /**
         * get an associative array of the values of two columns like array[String(lookup column value)] = value
         * @param {string} szValue the name of the value column
         * @param {string} szLookup the name of the lookup value column
         * @type {Array}
         * @return {Array} associative array for lookup
         * @example
         * id           nome
         * -------------------------------------------
         * 00000000000  ITALIA
         * 01000000000  PIEMONTE 1
         * 01100000000  PIEMONTE 1 - 01
         * 01110000000  01 TORINO - ZONA STATISTICA 16
         * 01110812620  TORINO - PIEMONTE 1 - 01 - 01
         * 01120000000  02 TORINO - ZONA STATISTICA 38
         * ...
         *
         * // create assoc.array with id ==> nome from camera_geopolitico_italia.csv (id == ELIGENDO_C_UID_CI)
         * var nomeA = camera_geopolitico_italia.lookupArray("nome","id");
         *
         * ['00000000000']="ITALIA";
         * ['01000000000']="PIEMONTE 1";
         * ['01100000000']="PIEMONTE 1 - 01";
         * ['01110000000']="01 TORINO - ZONA STATISTICA 16";
         * ['01110812620']="TORINO - PIEMONTE 1 - 01 - 01";
         * ['01120000000']="02 TORINO - ZONA STATISTICA 38";
         * ...
         *
         */
        lookupArray: function (szValue, szLookup) {

            let calc = "overwrite";

            // GR 06.09.2021 new argument object {}
            if (szValue && szValue.key) {
                calc = szValue.calc || calc;
                szLookup = szValue.key;
                szValue = szValue.value;
            }

            let lookupA = [];
            if (!this.column(szLookup)) {
                alert("'" + szLookup + "' column not found!");
            }
            if (!this.column(szValue)) {
                alert("'" + szValue + "' column not found!");
            }

            const idA = this.column(szLookup).values();
            const valueA = this.column(szValue).values();
            if (calc == "sum") {
                for (let i = 0, len = idA.length; i < len; i++) {
                    lookupA[String(idA[i])] = (lookupA[String(idA[i])] || 0) + valueA[i];
                }
            } else
            if (calc == "max") {
                for (let i = 0, len = idA.length; i < len; i++) {
                    lookupA[String(idA[i])] = Math.max(lookupA[String(idA[i])] || 0, valueA[i]);
                }
            } else {
                for (let i = 0, len = idA.length; i < len; i++) {
                    lookupA[String(idA[i])] = valueA[i];
                }
            }
            return lookupA;
        },

        /**
         * get an associative array of the values of two columns like array[String(lookup column value)] = value
         * in difference to lookupArray, this method creates a concatenated string in case of multiple values
         * only for string values, creates a comma separated risultive string 
         * @param {string} szValue the name of the value column
         * @param {string} szLookup the name of the lookup value column
         * @type {Array}
         * @returns {Array} associative array for lookup
         * @example
         * id           nome
         * -------------------------------------------
         * 00000000000  ITALIA
         * 00000000000  PIEMONTE 1
         * 01100000000  PIEMONTE 1 - 01
         * 01100000000  01 TORINO - ZONA STATISTICA 16
         * 01110812620  TORINO - PIEMONTE 1 - 01 - 01
         * 01120000000  02 TORINO - ZONA STATISTICA 38
         * ...
         *
         * // create assoc.array with id ==> nome from camera_geopolitico_italia.csv (id == ELIGENDO_C_UID_CI)
         * var nomeA = camera_geopolitico_italia.lookupArray("nome","id");
         *
         * ['00000000000']="ITALIA, PIEMONTE 1";
         * ['01100000000']="PIEMONTE 1 - 01, 01 TORINO - ZONA STATISTICA 16";
         * ['01110812620']="TORINO - PIEMONTE 1 - 01 - 01";
         * ['01120000000']="02 TORINO - ZONA STATISTICA 38";
         * ...
         *
         */
        lookupStringArray: function (szValue, szLookup) {

            // GR 06.09.2021 new argument object {}
            if (szValue && szValue.key) {
                szLookup = szValue.key;
                szValue = szValue.value;
            }

            let lookupA = [];
            if (!this.column(szLookup)) {
                alert("'" + szLookup + "' column not found!");
            }
            if (!this.column(szValue)) {
                alert("'" + szValue + "' column not found!");
            }

            const idA = this.column(szLookup).values();
            const valueA = this.column(szValue).values();
            for (let i = 0, len = idA.length; i < len; i++) {
                lookupA[String(idA[i])] = (lookupA[String(idA[i])] ? (lookupA[String(idA[i])] + ", " + valueA[i]) : valueA[i]);
            }
            return lookupA;
        },

        /**
         * get the value of a column cell by the known value of a lookup column
         * @param value the value we know 
         * @param {Object} option a json structure with {value:value column name, lookup:lookup column name} 
         * @type {string}
         * @return the found value 
         */
        lookup: function (value, option) {
            const colValue = option.value;
            const colLookup = option.lookup;
            const sCacheId = colValue + "_" + colLookup;
            if (!(this.lookupsA && this.lookupsA[sCacheId])) {
                this.lookupsA = this.lookupsA || [];
                this.lookupsA[sCacheId] = this.lookupArray(colValue, colLookup);
            }
            return (this.lookupsA[sCacheId][value] || "-");
        },

        /**
         * get a key value array (associative array) with the values of two columns
         * @param {Object} option a json structure with {key:key column name, value:value column name} 
         * @type {Array}
         * @return {Array} associative array with key/value pairs
         * @example
         * id           nome
         * -------------------------------------------
         * 00000000000  ITALIA
         * 01000000000  PIEMONTE 1
         * 01100000000  PIEMONTE 1 - 01
         * 01110000000  01 TORINO - ZONA STATISTICA 16
         * 01110812620  TORINO - PIEMONTE 1 - 01 - 01
         * 01120000000  02 TORINO - ZONA STATISTICA 38
         * ...
         *
         * // create assoc.array with id ==> nome from camera_geopolitico_italia.csv (id == ELIGENDO_C_UID_CI)
         * var nomeA = camera_geopolitico_italia.toKeyValue({key:"id", value:"nome"});
         *
         * ['00000000000']="ITALIA";
         * ['01000000000']="PIEMONTE 1";
         * ['01100000000']="PIEMONTE 1 - 01";
         * ['01110000000']="01 TORINO - ZONA STATISTICA 16";
         * ['01110812620']="TORINO - PIEMONTE 1 - 01 - 01";
         * ['01120000000']="02 TORINO - ZONA STATISTICA 38";
         * ...
         *
         */
        toKeyValue: function (option) {
            return this.lookupArray(option.value, option.key);
        },

        /**
         * creates a new column based on existing ones<br>
         * the values of the new column are defined by a user function, which receives data from the actual row and must returns the new value
         * @param {Object} options the creation parameter
         *								   <table border='0' style='border-left: 1px solid #ddd;'>	
         *								   <tr><th>property</th><th>description</th></tr>
         *								   <tr><td><b>"source"</b></td><td>[optional] the name of the source column </td></tr>
         *								   <tr><td><b>"destination"</b></td><td>the name of the new colmn to create</td></tr>
         *								   </table> 
         * @param {function(currentValue)} function(currentValue) Required: A function to be run for each element in the array
         *								   <br>Function arguments:<br>
         *								   <table border='0' style='border: 1px solid #ddd;margin:0.5em 0em'>	
         *								   <tr><th>argument</th><th>description</th></tr>
         *								   <tr><td>currentValue</td><td>the value of the current source column cell or<br>an array of all values of the current row, if non source column is defined</td></tr>
         *								   </table> 
         *  Must return the values for the new column.<br>
         *  It is called for every row of the table and receives as parameter the value
         *  of the source column, or, if no source column defined, an array of all values of the table row.
         * @type {Data.Table}
         * @returns {Data.Table} the enhanced table
         * @example
         *    mydata = mydata.addColumn({'source':'created_at','destination':'date'},
         *        function(value){
         *            var d = new Date(__normalizeTime(value));
         *            return( String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear()) );
         *     });
         *
         */
        addColumn: function (options, callback) {

            if (!options.destination) {
                alert("'data.addColumn' no destination defined!");
                return null;
            }
            var column = null;
            if (options.source) {
                for (let i = 0, len = this.fields.length; i < len; i++) {
                    if (this.fields[i].id == options.source) {
                        column = i;
                    }
                }
                if (column == null) {
                    alert("'data.addColumn' source column '" + options.source + "' not found!");
                    return null;
                }
            }

            // add new column name
            this.fields.push({
                id: String(options.destination),
                created: true
            });
            this.table.fields++;

            // add new column values
            // ---------------------
            if (callback && (typeof (callback) == "function")) {
                for (let j = 0, len = this.records.length; j < len; j++) {
                    this.records[j].push((column != null) ? callback(this.records[j][column],this.records[j]) : callback(this.records[j]));
                }
            } else
            if (callback && (typeof (callback) == "object")) {
                for (let j = 0, len = this.records.length; j < len; j++) {
                    this.records[j].push(callback[j] || 0);
                }
            } else
            if (options.values && (typeof (options.values) == "object")) {
                for (let j = 0, len = this.records.length; j < len; j++) {
                    this.records[j].push(options.values[j] || 0);
                }
            } else {
                for (let j = 0, len = this.records.length; j < len; j++) {
                    this.records[j].push(0);
                }
            }

            return this;
        },

        /**
         * adds a row to the data<br>
         * the values of columns are defined by a JSON Object, which defines values for selected columns; non defined columns are set to ' '
         * @param {Object} options the creation parameter
         *								   <table border='0' style='border-left: 1px solid #ddd;'>	
         *								   <tr><th>property</th><th>description</th></tr>
         *								   <tr><td><b>"column name"</b></td><td>value</td></tr>
         *								   <tr><td><b>"column name"</b></td><td>value</td></tr>
         *								   </table> 
         * @type {Data.Table}
         * @return {Data.Table} the enhanced table
         * @example
         *    mydata = mydata.addRow({'column 1':'Rossi','column 2':'Aldo'} );
         */
        addRow: function (options) {

            if (!options || (typeof options !== "object")) {
                alert("'data.addRow' no options defined!");
                return null;
            }
            // create new empty row
            var row = [];
            for (let i = 0, len = this.fields.length; i < len; i++) {
                row.push("");
            }
            // set user values
            for (var i in options) {
                if (this.column(i)) {
                    row[this.column(i).index] = options[i];
                } else {
                    alert("'data.addRow' column '" + i + "' not found!");
                }
            }
            // add the new row to the data table
            this.records.push(row);
            this.table.records++;

            return this;
        },

        /**
         * filter rows from a dbtable objects data by callback
         * @param {function} the user defined filter function, must return 0 or 1 
         * @type {Data.Table}
         * @returns {Data.Table}
         * @example
         *    mydata.filter(
         *        function(row){
         *            return( (row[0] == 'filtervalue') ? 1 : 0 );
         *     });
         */
        filter: function (callback) {

            this.selection = new Data.Table();

            for (const j in this.records) {
                if (callback && callback(this.records[j])) {
                    this.selection.records.push(this.records[j]);
                    this.selection.table.records++;
                }
            }
            this.selection.fields = this.fields.slice();
            this.selection.table.fields = this.table.fields;
            return this.selection;
        },

        /**
         * select rows from a dbtable objects data by SQL query
         * @param {string} szSelection the selection query string<br>WHERE "<em>column name</em>" [operator] "<em>selection value</em>" 
         *<table class="w3-table-all notranslate">
         * <tr>
         *    <th style="width:20%">Operator</th>
         *    <th>Description</th>
         *  </tr>
         *  <tr>
         *    <td>=</td>
         *    <td>Equal</td>
         *  </tr>
         *  <tr>
         *    <td>&lt;&gt;</td>
         *    <td>Not equal. <b>Note:</b> In some versions of SQL this operator may be written as !=</td>
         *  </tr>
         *  <tr>
         *    <td>&gt;</td>
         *    <td>Greater than</td>
         *  </tr>
         *  <tr>
         *    <td>&lt;</td>
         *    <td>Less than</td>
         *  </tr>
         *  <tr>
         *    <td>&gt;=</td>
         *    <td>Greater than or equal</td>
         *  </tr>
         *  <tr>
         *   <td>&lt;=</td>
         *   <td>Less than or equal</td>
         * </tr>
         * <tr>
         *   <td>BETWEEN</td>
         *   <td>Between an inclusive range;<br> example: WHERE "<em>column</em>" BETWEEN "<em>value1</em>" AND "<em>value2</em>"</td>
         * </tr>
         * <tr>
         *   <td>LIKE</td>
         *   <td>Search for a pattern</td>
         * </tr>
         * <tr>
         *   <td>NOT</td>
         *   <td>Must not contain pattern</td>
         * </tr>
         *  <tr>
         *    <td>IN</td>
         *   <td>To specify multiple possible values for a column;<br> example: WHERE "<em>column</em>" IN "<em>value1,value2,value3</em>"</td>
         *  </tr>
         *</table>
         * @type {Data.Table}
         * @returns {Data.Table} object with the selection result in dbTable format
         * @example
         * var mydata   =  mydata.select('WHERE description like "montana"');
         * var ageTotal = rawdata.select('WHERE "Age" = "Total" AND "SEX" = "MW" AND "Series" = "Labour force participation rate"');
         * var ageWork  = rawdata.select('WHERE "Age" BETWEEN "18" AND "65"');
         */
        select: function (szSelection) {

            if (szSelection.match(/WHERE/)) {

                // first time ?
                // get query parts

                if (1) {

                    // tokenize
                    // ---------
                    let szTokenA = szSelection.split('WHERE')[1].trim().split(' ');

                    // test for quotes and join the included text parts
                    for (let ii = 0; ii < szTokenA.length; ii++) {
                        if (szTokenA[ii].length) {
                            if ((szTokenA[ii][0] == '"') && (szTokenA[ii][szTokenA[ii].length - 1] != '"')) {
                                do {
                                    szTokenA[ii] = szTokenA[ii] + " " + szTokenA[ii + 1];
                                    szTokenA.splice(ii + 1, 1);
                                }
                                while (szTokenA[ii][szTokenA[ii].length - 1] != '"');
                            }
                            if ((szTokenA[ii][0] == '(') && (szTokenA[ii][szTokenA[ii].length - 1] != ')')) {
                                do {
                                    szTokenA[ii] = szTokenA[ii] + " " + szTokenA[ii + 1];
                                    szTokenA.splice(ii + 1, 1);
                                }
                                while (szTokenA[ii][szTokenA[ii].length - 1] != ')');
                            }
                        } else {
                            szTokenA.splice(ii, 1);
                            ii--;
                        }
                    }
                    this.filterQueryA = [];
                    let filterObj = {};

                    let szCombineOp = "";

                    // make the query object(s)
                    // ------------------------
                    do {
                        let nToken = 0;

                        if (szTokenA.length >= 3) {
                            filterObj = {};
                            filterObj.szSelectionField = szTokenA[0].replace(/("|)/g, "");
                            filterObj.szSelectionOp = szTokenA[1];
                            filterObj.szSelectionValue = szTokenA[2].replace(/("|)/g, "");
                            nToken = 3;
                        }
                        if (filterObj.szSelectionOp == "BETWEEN") {
                            if (szTokenA.length >= 5) {
                                if (szTokenA[3] == "AND") {
                                    filterObj.szSelectionValue2 = szTokenA[4];
                                    nToken = 5;
                                }
                            }
                        }

                        if (nToken) {

                            // get data table column index for query field
                            for (let ii = 0; ii < this.fields.length; ii++) {
                                if (this.fields[ii].id == filterObj.szSelectionField) {
                                    filterObj.nFilterFieldIndex = ii;
                                }
                                // GR 26.12.2019 filter value may be column name (defined by $column name$)
                                if (("$" + this.fields[ii].id + "$") == filterObj.szSelectionValue) {
                                    filterObj.nFilterValueIndex = ii;
                                }
                            }
                            // set query combine operator 
                            filterObj.szCombineOp = szCombineOp;

                            // add the query object
                            this.filterQueryA.push(filterObj);
                            szTokenA.splice(0, nToken);

                        } else {
                            _alert("data.js - selection error - incomplete query!\nquery: " + szSelection);
                            break;
                        }

                        // only 'AND' combination (OR tdb)
                        if (szTokenA.length && (szTokenA[0] == "AND")) {
                            szCombineOp = "AND";
                            szTokenA.splice(0, 1);
                        } else
                        if (szTokenA.length && (szTokenA[0] == "OR")) {
                            szCombineOp = "OR";
                            szTokenA.splice(0, 1);
                        } else {
                            break;
                        }
                    }
                    while (szTokenA.length);

                }

                this.selection = new Data.Table();

                for (let i = 0; i < this.filterQueryA.length; i++) {
                    if (typeof this.filterQueryA[i].nFilterFieldIndex === "undefined") {
                        this.selection.fields = this.fields.slice();
                        this.selection.table.fields = this.table.fields;
                        _LOG("Selection: invalid query: " + szSelection);
                        return this.selection;
                    }
                }

                for (let j = 0, len = this.records.length; j < len; j++) {

                    let allResult = null;

                    for (let i = 0, lenQA = this.filterQueryA.length; i < lenQA; i++) {

                        let result = true;
                        // get the value to test
                        this.__szValue = String(this.records[j][this.filterQueryA[i].nFilterFieldIndex]);
                        this.__szSelectionOp = this.filterQueryA[i].szSelectionOp.toUpperCase();
                        this.__szSelectionValue = this.filterQueryA[i].szSelectionValue;
                        this.__szSelectionValue2 = this.filterQueryA[i].szSelectionValue2;
                        this.__szCombineOp = this.filterQueryA[i].szCombineOp;

                        // GR 26.12.2019 filter value may be column name
                        if (this.filterQueryA[i].nFilterValueIndex != null) {
                            this.__szSelectionValue = String(this.records[j][this.filterQueryA[i].nFilterValueIndex]);
                        }

                        // do the query 
                        // ------------
                        let nValue = __scanValue(this.__szValue);
                        if (this.__szSelectionOp == "=") {
                            if (this.__szSelectionValue == '*') {
                                result = (this.__szValue.replace(/ /g, "") != "");
                            } else {
                                result = ((this.__szValue == this.__szSelectionValue) || (nValue == Number(this.__szSelectionValue)));
                            }
                        } else
                        if (this.__szSelectionOp == "<>") {
                            result = !((this.__szValue == this.__szSelectionValue) || (nValue == Number(this.__szSelectionValue)));
                        } else
                        if (this.__szSelectionOp == ">") {
                            result = (nValue > Number(this.__szSelectionValue));
                        } else
                        if (this.__szSelectionOp == "<") {
                            result = (nValue < Number(this.__szSelectionValue));
                        } else
                        if (this.__szSelectionOp == ">=") {
                            result = (nValue >= Number(this.__szSelectionValue));
                        } else
                        if (this.__szSelectionOp == "<=") {
                            result = (nValue <= Number(this.__szSelectionValue));
                        } else
                        if (this.__szSelectionOp == "LIKE") {
                            if (this.__szSelectionValue == "*") {
                                result = this.__szValue.length;
                            } else {
                                // Escape regex special characters in the value
                                const pattern = this.__szSelectionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(pattern, "i");
                                result = regex.test(this.__szValue);
                            }
                        } else
                        if (this.__szSelectionOp == "NOT") {
                            const pattern = this.__szSelectionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(pattern, "i");
                            result = !regex.test(this.__szValue);
                        } else
                        if (this.__szSelectionOp == "IN") {
                            // Assume values are comma-separated
                            const values = this.__szSelectionValue.split(",").map(v => v.trim());
                            result = values.includes(this.__szValue);
                        } else
                        if ((this.__szSelectionOp == "BETWEEN")) {
                            result = ((nValue >= Number(this.__szSelectionValue)) &&
                                (nValue <= Number(this.__szSelectionValue2)));
                        } else {
                            // default operator
                            const pattern = this.__szSelectionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            const regex = new RegExp(pattern, "i");
                            result = regex.test(this.__szValue);
                        }
                        if (this.__szCombineOp == "AND") {
                            allResult = (allResult && result);
                        } else {
                            allResult = (allResult || result);
                        }
                    }
                    if (allResult) {
                        this.selection.records.push(this.records[j].slice());
                        this.selection.table.records++;
                    }
                }
            }
            this.selection.fields = this.fields.slice();
            this.selection.table.fields = this.table.fields;
            return this.selection;
        },

        /**
         * aggregate the values of one column for the unique values of one or more other columns<br>
         * usefull to transform journals with more than one qualifying column (time, product class, ...)<br>
         * into something like a pivot table 
         * @param {string} valueColumn the value source
         * @param {string} aggregateColumn the aggregation leads; more than one column can be defined with seperator '|'<br>example: "month|type"
         * @type {Data.Table}
         * @returns {Data.Table} object with the aggregation result in dbTable format
         * @example
         *  myData.aggregate("value","month|type");
         *	     
         *  // "value"     : the value source column is named "value"
         *  // "month|type": columns "month" and "type" will lead the aggregation
         * @example
         *  if the source table is like:
         *
         *  "data"     "month" "day" "hour" "operator" "type" "value"
         *  2015/07/15 "jul"   15    03     "everyone" "wood" 15  
         *  2015/07/15 "jul"   15    06     "clerk"    "iron" 25  
         *  2015/07/16 "jul"   16    11     "clerk"    "iron" 32  
         *  2015/07/22 "jul"   16    15     "carp"     "wood" 17  
         *  2015/08/02 "aug"   02    22     "carp"     "wood" 22  
         *  ...
         *
         *  the result will be:
         *
         *  "month" "type" "value"
         *  "jul"   "wood"  32
         *  "jul"   "iron"  57 
         *  "aug"   "wood"  22 
         *
         */
        aggregate: function (szColumn, szAggregate) {

            let mean = false;

            // GR 06.09.2021 new argument object {}
            if (szColumn.lead) {
                mean = (szColumn.calc && (szColumn.calc == "mean"));
                szAggregate = szColumn.lead;
                szColumn = szColumn.column || szColumn.value;
            }

            const szAggregateA = szAggregate.split("|");
            const nAggregateIndexA = [];

            let nValueIndex = null;

            for (let i = 0; i < szAggregateA.length; i++) {
                for (let ii = 0; ii < this.fields.length; ii++) {
                    if (this.fields[ii].id == szAggregateA[i]) {
                        nAggregateIndexA[i] = ii;
                    }
                    if (this.fields[ii].id == szColumn) {
                        nValueIndex = ii;
                    }
                }
            }

            this.aggregation = new Data.Table();

            xRecords = [];
            xCount = [];
            for (let j = 0, len = this.records.length; j < len; j++) {
                xField = "";
                for (let i = 0, lenA = nAggregateIndexA.length; i < lenA; i++) {
                    xField += this.records[j][nAggregateIndexA[i]];
                }
                if (xRecords[xField]) {
                    xRecords[xField][nAggregateIndexA.length] += __scanValue(this.records[j][nValueIndex]);
                    xCount[xField][nAggregateIndexA.length]++;
                } else {
                    xRecords[xField] = [];
                    xRecords[xField][nAggregateIndexA.length] = __scanValue(this.records[j][nValueIndex]);
                    for (let i = 0; i < nAggregateIndexA.length; i++) {
                        xRecords[xField][i] = this.records[j][nAggregateIndexA[i]];
                    }
                    xCount[xField] = [];
                    xCount[xField][nAggregateIndexA.length] = 1;
                }
            }

            for (let j = 0, len = xRecords.length; j < len; j++) {
                if (mean) {
                    xRecords[j][nAggregateIndexA.length] /= xCount[j][nAggregateIndexA.length];
                }
                this.aggregation.records.push(xRecords[j]);
                this.aggregation.table.records++;
            }

            const fields = [];
            for (let i = 0; i < szAggregateA.length; i++) {
                fields[i] = {
                    id: szAggregateA[i]
                };
            }
            fields[szAggregateA.length] = {
                id: szColumn
            };

            this.aggregation.fields = fields;
            this.aggregation.table.fields = fields;

            return this.aggregation;
        },

        /**
         * condense (aggregate) the rows of a table by the unique values of one column <br>
         * sums the numeric values of the rows with the same leed column value<br>
         * don't sum the values of columns defined as 'keep' in the 'option'
         * @param {string} leadColumn the column of the values to make unique
         * @param {Object} option parameter
         * @type {Data.Table}
         * @returns the condensed table
         * @example
         *  data.condense({lead:'name',keep:'codice'});
         *
         *  if the source table is like:
         *
         *  "name"     "codice" "hours"
         *  "everyone" "001"     15  
         *  "clerk"    "002"     25  
         *  "clerk"    "002"     32  
         *  "carp"     "005"     17  
         *  "carp"     "005"     22  
         *  ...
         *
         *  the result will be:
         *
         *  "name"     "codice" "value"
         *  "everyone" "001"     15
         *  "clerk"    "002"     57 
         *  "carp"     "005"     39 
         *
         */
        condense: function (szColumn, option) {

            const uniqueA = {};
            const keepIndexA = [];

            // GR 06.09.2021 new argument object {}
            if (szColumn && szColumn.lead) {
                option = szColumn;
                szColumn = option.lead;
            }

            const uniqueIndex = this.columnIndex(szColumn);

            if (option && option.keep) {
                // option.keep is string
                if (typeof (option.keep) == "string") {
                    keepIndexA[this.columnIndex(option.keep)] = true;
                } else
                    // or array of strings
                    for (i = 0; i < option.keep.length; i++) {
                        keepIndexA[this.columnIndex(option.keep[i])] = true;
                    }
            }
            const __newRecords = [];
            for (let j = 0; j < this.records.length; j++) {
                const szTest = String(this.records[j][uniqueIndex]);
                if (uniqueA[szTest] != null) {
                    const k = uniqueA[szTest];
                    for (let v = 0, len = this.records[j].length; v < len; v++) {
                        if (!keepIndexA[v]) {
                            if (!isNaN(this.records[j][v])) {
                                if (option && option.calc == "max") {
                                    __newRecords[k][v] = Math.max(Number(__newRecords[k][v]), Number(this.records[j][v]));
                                } else {
                                    __newRecords[k][v] = Number(__newRecords[k][v]) + Number(this.records[j][v]);
                                }
                            } else {
                                if (isNaN(this.records[j][v]) && (__newRecords[k][v] != this.records[j][v])) {
                                    let n = parseFloat(String(__newRecords[k][v]).split(" (+")[1]) || 0;
                                    __newRecords[k][v] = String(__newRecords[k][v]).split(" (+")[0] + " (+" + (++n) + ") ";
                                }
                            }
                        }
                    }
                } else {
                    __newRecords.push(this.records[j].slice());
                    uniqueA[szTest] = __newRecords.length - 1;
                }
            }
            
            this.__condense = new Data.Table();
            this.__condense.fields = this.fields;
            this.__condense.table.fields = this.fields;
            this.__condense.records = __newRecords.slice();
            this.__condense.table.records = this.__condense.records.length;

            return this.__condense;
        },

        /**
         * creates a new column based on existing ones<br>
         * the values of the new column are the sum of the source columns
         * @param {Object} options the creation parameter
         *								   <table border='0' style='border-left: 1px solid #ddd;'>	
         *								   <tr><th>property</th><th>description</th></tr>
         *								   <tr><td><b>"source"</b></td><td>the name of the source columns </td></tr>
         *								   <tr><td><b>"destination"</b></td><td>the name of the new colmn to create</td></tr>
         *								   </table> 
         * @type {Data.Table}
         * @returns {Data.Table} the enhanced table
         * @example
         *    mydata = mydata.groupColumns({'source':['col_1','col_2'],'destination':'col_sum'});
         *
         */
        groupColumns: function (options) {

            let sourceA = options.source;
            let iA = [];
            for (let i = 0, len = sourceA.length; i < len; i++) {
                iA[i] = this.column(sourceA[i]).index;
            }
            this.addColumn({
                destination: options.destination
            }, function (row) {
                let value = 0;
                for (let i = 0, len = iA.length; i < len; i++) {
                    value += Number(row[iA[i]]);
                }
                return value;
            });

            return this;
        },

        /**
         * creates a pivot table <br>
         * @param {Object} options the pivot creation parameter
         *<table class="w3-table-all notranslate">
         * <tr>
         *    <th style="width:20%">Property</th>
         *    <th>Description</th>
         *  </tr>
         *  <tr>
         *    <td>lead</td>
         *    <td>the sourcetable field that defines the pivot rows</td>
         *  </tr>
         *  <tr>
         *    <td>keep</td>
         *    <td>columns of the sourcetable to copy into the pivot</td>
         *  </tr>
         *  <tr>
         *    <td>sum</td>
         *    <td>columns of the sourcetable to copy and sum into the pivot</td>
         *  </tr>
         *  <tr>
         *    <td>cols</td>
         *    <td>the sourcetable field that defines the pivot columns (together with 'keep')</td>
         *  </tr>
         *  <tr>
         *    <td>value</td>
         *    <td>the sourcetable field where to get the value to accumulate
         *         if '1', count the cases of the cols topicsthan</td>
         *  </tr>
         *</table>
         * @type {Data.Table}
         * @returns the pivot table
         * @example
         * 
         * // we have a table 'scrutini' with election results like:
         *	
         * assemblea  codice       tipo   tipo_riga  cand_descr_riga  descr_lista              voti   perc    
         * --------------------------------------------------------------------------------------------------
         * Camera     01110812620  Comune CA         ANDREA GIORGIS                            49654  "40,93"
         * Camera     01110812620  Comune LI                          PARTITO DEMOCRATICO      33228  "28,75" 
         * Camera     01110812620  Comune LI                          +EUROPA                  12970  "11,22"
         * Camera     01110812620  Comune LI                          ITALIA EUROPA INSIEME    846    "0,73"
         * Camera     01110812620  Comune LI                          CIVICA POPOLARE LORENZIN 601    "0,52" 
         * ...
         *
         * // --------------------------------------------------------------------------------------------
         * // make pivot table with columns == descr_lista (partiti)  
         * // --------------------------------------------------------------------------------------------
         *
         * var pivot = scrutini.pivot({
         *              "lead":	'codice',
         *              "keep":	['tipo'],
         *              "sum":	['membri'],
         *              "cols":	'descr_lista',
         *              "value":  "voti" 
         *              });
         *
         *
         * // the resulting pivot table is:
         *
         * codice       tipo   PARTITO DEMOCRATICO +EUROPA  ITALIA EUROPA INSIEME  CIVICA POPOLARE LORENZIN    
         * --------------------------------------------------------------------------------------------------
         * 01110812620  Comune 33228               12970    846                    601
         * ...
         */
        pivot: function (options) {

            options.lead = options.lead || options.rows;
            options.cols = options.cols || options.columns;
            options.keep = options.keep || [];
            options.sum = options.sum || [];

            // force string arrays 

            options.lead = __toArray(options.lead);
            options.cols = __toArray(options.cols);
            options.keep = __toArray(options.keep);
            options.sum = __toArray(options.sum);
            options.value = __toArray(options.value);
            options.forced = __toArray(options.forced);

            // make field indices

            let indexA = [];
            for (let i = 0; i < this.fields.length; i++) {
                indexA[String(this.fields[i].id)] = i;
            }

            // check the source columns

            for (let i = 0, len = options.lead.length; i < len; i++) {
                if (typeof (indexA[options.lead[i]]) == 'undefined') {
                    _alert("data.pivot - pivot keep column '" + options.lead[i] + "' not found");
                }
            }
            for (let i = 0, len = options.cols.length; i < len; i++) {
                if (options.cols && (typeof (indexA[options.cols[i]]) == 'undefined')) {
                    _alert("data.pivot - pivot columns source column '" + options.cols[i] + "' not found");
                }
            }
            for (let i = 0, len = options.keep.length; i < len; i++) {
                if (typeof (indexA[options.keep[i]]) == 'undefined') {
                    _alert("data.pivot - pivot keep column '" + options.keep[i] + "' not found");
                }
            }
            for (let i = 0, len = options.sum.length; i < len; i++) {
                if (typeof (indexA[options.sum[i]]) == 'undefined') {
                    _alert("data.pivot - pivot sum column '" + options.sum[i] + "' not found");
                }
            }
            for (let i = 0, len = options.value.length; i < len; i++) {
                if (typeof (indexA[options.value[i]]) == 'undefined') {
                    _alert("data.pivot - pivot value column '" + options.value[i] + "' not found");
                }
            }

            // make the pivot 

            let rowA = [];
            let colA = [];
            let data = this.records;

            // GR 12/03/2023 preset columns with forced columns

            if (options.forced) {
                for (let i = 0; i < options.forced.length; i++) {
                    colA[String(options.forced[i])] = 0;
                }
            }

            for (let row = 0, len = data.length; row < len; row++) {

                let szRow = String(data[row][indexA[options.lead[0]]]);
                for (let k = 1; k < options.lead.length; k++) {
                    szRow += "|" + data[row][indexA[options.lead[k]]];
                }

                let szCol = String(data[row][indexA[options.cols[0]]]);

                let nValue = null;
                if (options.calc == "string") {
                    nValue = data[row][indexA[options.value[0]]];
                } else {
                    nValue = 1;
                    if (options.value && options.value.length) {
                        nValue = 0;
                        for (let k = 0; k < options.value.length; k++) {
                            nValue += options.value[k] ? __scanValue(data[row][indexA[options.value[k]]]) : 1;
                        }
                    }
                }
                if (!szCol || szCol.length < 1) {
                    szCol = "undefined";
                }
                if (typeof (colA[szCol]) == 'undefined') {
                    colA[szCol] = 0;
                }
                if (!rowA[szRow]) {
                    rowA[szRow] = {
                        "Total": 0
                    };
                    for (let k = 0; k < options.keep.length; k++) {
                        rowA[szRow][options.keep[k]] = data[row][indexA[options.keep[k]]];
                    }
                    for (let k = 0; k < options.sum.length; k++) {
                        rowA[szRow][options.sum[k]] = Number(data[row][indexA[options.sum[k]]]);
                    }
                } else {
                    for (let k = 0; k < options.keep.length; k++) {
                        if (data[row][indexA[options.keep[k]]] &&
                            data[row][indexA[options.keep[k]]].length &&
                            (rowA[szRow][options.keep[k]] != data[row][indexA[options.keep[k]]])) {
                            rowA[szRow][options.keep[k]] = data[row][indexA[options.keep[k]]];
                        }
                    }
                    for (let k = 0; k < options.sum.length; k++) {
                        rowA[szRow][options.sum[k]] += Number(data[row][indexA[options.sum[k]]]);
                    }
                }

                rowA[szRow].Total += nValue;

                if (!rowA[szRow][szCol]) {
                    rowA[szRow][szCol] = nValue;
                    rowA[szRow][szCol + "count"] = 1;
                } else {
                    if (options.calc == "string") {}
                    if (options.calc == "max") {
                        rowA[szRow][szCol] = Math.max(nValue, rowA[szRow][szCol]);
                    } else {
                        rowA[szRow][szCol] += nValue;
                        rowA[szRow][szCol + "count"]++;
                    }
                }
            }
            
            this.__pivot = new Data.Table();

            // make first row (table.fields) with column names
            // ------------------------------------------------

            // lead
            for (let k = 0; k < options.lead.length; k++) {
                this.__pivot.fields.push({
                    id: options.lead[k]
                });
            }
            // keep
            for (let k = 0; k < options.keep.length; k++) {
                this.__pivot.fields.push({
                    id: options.keep[k]
                });
            }
            // sum
            for (let k = 0; k < options.sum.length; k++) {
                this.__pivot.fields.push({
                    id: options.sum[k]
                });
            }
            // cols
            if (options.cols && options.cols.length)
                for (let a in colA) {
                    if (Object.prototype.hasOwnProperty.call(colA, a)) {
                        this.__pivot.fields.push({
                            id: a
                        });
                    }
                }
            //totale
            this.__pivot.fields.push({
                id: "Total"
            });


            // make the values
            // ----------------
            for (let a in rowA) {
                if (Object.prototype.hasOwnProperty.call(rowA, a)) {
                    // collect values per place
                    const valueA = [];
                    // lead
                    const leadA = a.split("|");
                    if (options.lead && options.lead.length)
                        for (let k = 0; k < leadA.length; k++) {
                            valueA.push(leadA[k]);
                        }
                    // keep
                    for (let k = 0; k < options.keep.length; k++) {
                        valueA.push(rowA[a][options.keep[k]]);
                    }
                    // sum
                    for (let k = 0; k < options.sum.length; k++) {
                        valueA.push(rowA[a][options.sum[k]]);
                    }
                    // cols
                    if (options.cols && options.cols.length)
                        for (let t in colA) {
                            if (Object.prototype.hasOwnProperty.call(colA, t)) {
                                if (options.calc == "mean") {
                                    valueA.push((rowA[a][t] || 0) / (rowA[a][t + "count"] || 1));
                                } else {
                                    valueA.push(rowA[a][t] || 0);
                                }
                            }
                        }
                    // totale
                    valueA.push(rowA[a].Total);
                    // record complete
                    this.__pivot.records.push(valueA);
                    this.__pivot.table.records++;
                }
            }
            
            return (this.__pivot);
        },

        /**
         * creates a sub table <br>
         * which only contains the specified columns
         * @param options {Object} the subtable columns definition; use either 'columns' or 'fields'
         *<table class="w3-table-all notranslate">
         * <tr>
         *    <th style="width:20%">Property</th>
         *    <th>Description</th>
         *  </tr>
         *  <tr>
         *    <td>columns</td>
         *    <td>array of column indices</td>
         *  </tr>
         *  <tr>
         *    <td>fields</td>
         *    <td>array of column names</td>
         *  </tr>
         *</table>
         * @type {Data.Table}
         * @returns the generated sub table
         * @example
         * subTable = table.subtable({"columns":[1,2,3]});
         * @example
         * subTable = table.subtable({"fields":['comune_scr','provincia_scr','Lat','Lon']});
         */
        subtable: function (options) {

            this.__subt = new Data.Table();

            if (options.fields) {
                options.columns = [];
                for (let i = 0; i < options.fields.length; i++) {
                    for (let ii = 0; ii < this.fields.length; ii++) {
                        if (this.fields[ii].id == options.fields[i]) {
                            options.columns.push(ii);
                        }
                    }
                }
            }

            for (let i = 0; i < options.columns.length; i++) {
                this.__subt.fields.push({
                    id: String(this.fields[options.columns[i]].id)
                });
                this.__subt.table.fields++;
            }
            for (const j in this.records) {
                let records = [];
                for (let i = 0; i < options.columns.length; i++) {
                    records.push(this.records[j][options.columns[i]]);
                }
                this.__subt.records.push(records);
                this.__subt.table.records++;
            }
            return this.__subt;
        },

        /**
         * sort the rows of a data table by values of a given column
         * @param {string} sortColumn the column by which values to sort the table
         * @type {Data.Table}
         * @returns the sorted table
         */
        sort: function (szColumn, szFlag) {
            let valuesA = this.column(szColumn).values();
            let number = 0;
            for (let i = 0; i < Math.min(valuesA.length,10); i++) {
                 if (!isNaN(parseFloat(String(valuesA[i]).replace(",",".")))){
                    number++;
                }
            }
            let sortA = [];
            if (number){
                for (let i = 0; i < valuesA.length; i++) {
                    sortA.push({
                        index: i,
                        value: Number(String(valuesA[i]).replace(",","."))
                    });
                }
            }else{
                 for (let i = 0; i < valuesA.length; i++) {
                    sortA.push({
                        index: i,
                        value: valuesA[i]
                    });
                }
            }
            if (szFlag && szFlag == "DOWN") {
                sortA.sort(function (a, b) {
                    return ((a.value > b.value) ? -1 : 1);
                });
            } else {
                sortA.sort(function (a, b) {
                    return ((a.value < b.value) ? -1 : 1);
                });
            }
            let records = [];
            for (let i = 0; i < sortA.length; i++) {
                records.push(this.records[sortA[i].index]);
            }
            this.records = records;
            return this;
        },

        /**
         * appends the rows of a data table to the actual table<br>
         * ! <b>important</b>: the structure of both tables must be identical, i.e. same column count and names
         * @param {Data.Table} sourceTable table the source of the rows to append
         * @type {Data.Table}
         * @returns the extended table
         */
        append: function (sourceTable) {
            if (this.table.fields.length != sourceTable.table.fields.length) {
                return null;
            }
            for (let i = 0; i < this.table.fields.length; i++) {
                if (this.table.fields[i].id != sourceTable.table.fields[i].id) {
                    return null;
                }
            }
            let records = sourceTable.records;
            for (let i = 0; i < records.length; i++) {
                this.records.push(records[i]);
            }
            this.table.records = this.records.length;
            return this;
        },

        /**
         * creates a json object array from the table <br>
         * every row creates an array element 
         * array elements are of type:
         * { name_1: value_1, name_2: value_2, ... }
         */
        json: function () {

            this.__json = [];
            for (const r in this.records) {
                let row = {};
                for (const c in this.fields) {
                    row[String(this.fields[c].id)] = this.records[r][c];
                }
                this.__json.push(row);
            }
            return this.__json;
        }

    };


    //...................................................................
    // local helper
    //...................................................................
    __myNumber = function (value) {
        let number = parseFloat(value.replace(/\./g, "").replace(/\,/g, "."));
        return isNaN(number) ? 0 : number;
    };

    __scanValue = function (nValue) {
        // strips blanks inside numbers (e.g. 1 234 456 --> 1234456)
        let number = null;
        if (String(nValue).match(/,/)) {
            number = parseFloat(String(nValue).replace(/\./gi, "").replace(/,/gi, "."));
            return isNaN(number) ? 0 : number;
        } else {
            number = parseFloat(String(nValue).replace(/ /gi, ""));
            return isNaN(number) ? 0 : number;
        }
    };


    // ---------------------------------------------------------------------------------
    //
    // additional specific functions (not core, can also be realized by above functions)
    //
    // ---------------------------------------------------------------------------------

    /**
     * creates new columns on base of a timestamp that contain the following time orders <br>
     * date,year,month,day,hour
     * <br>
     * @param data the input tabel (array of arrarys)
     * @param options generation options
     * @type {Array}
     * @returns the pivot table
     * @example
     * <br><br>
     * <strong>options definition object:</strong>
     *		var options = { "source":	'name of timestamp column',
     *						"create":	['date','year','month','day','hour']
     *					}
     *	<br>
     *  source: the sourcetable field that contains the toime stamp
     *  create: [optional] an array of columns to creaate
     *          to define only if not wished to create all of above listed time columns
     */
    Data.Table.prototype.addTimeColumns = function (options) {

        if (!options.source) {
            return null;
        }

        for (const column in this.fields) {
            if (this.fields[column].id == options.source) {

                // make fields object
                // ------------------

                // copy orig fields 
                let timeCollA = options.create || ['date', 'year', 'month', 'day', 'hour'];

                // add new time columns 
                for (let i = 0; i < timeCollA.length; i++) {
                    this.fields.push({
                        id: String(timeCollA[i])
                    });
                    this.table.fields++;
                }

                // make values 
                // ------------------
                let length = this.records.length;
                let j = 0;
                for (j = 0; j < length; j++) {

                    // add new time column values
                    let d = new Date(this.records[j][column]);
                    if (d) {
                        for (let i = 0; i < timeCollA.length; i++) {
                            switch (timeCollA[i]) {
                                case 'date':
                                    let date = String(d.getDate()) + "." + String(d.getMonth() + 1) + "." + String(d.getFullYear());
                                    this.records[j].push(date);
                                    break;
                                case 'year':
                                    this.records[j].push(d.getFullYear());
                                    break;
                                case 'month':
                                    this.records[j].push(d.getMonth() + 1);
                                    break;
                                case 'day':
                                    this.records[j].push(d.getDay());
                                    break;
                                case 'hour':
                                    this.records[j].push(d.getHours());
                                    break;
                            }
                        }
                    }
                }

            }
        }

        return this;
    };

    /**
     * Create a new Data.Column instance.  
     * <p>it is generally created by the <b>.column()</b> method of <b>Data.table</b> object</p>
     * <p>it provides ther methods to access or process the values of one column of the data table</p>
     * @class It realizes an object to hold a table column
     * @constructor
     * @returns A new Data.Column object
     * @example
     *    var myColumn = mydata.column('timestamp');
     */

    Data.Column = function () {
        this.table = null;
        this.index = null;
        this.valueA = null;
    };

    Data.Column.prototype = {
        /**
         * get the values of the column
         * <br>
         * @type {Array}
         * @returns {Array} an array with the values of the column
         * @example
         *    var sumArray = mydata.column('total').values();
         */
        values: function () {
            this.valueA = [];
            for (const i in this.table.records) {
                this.valueA.push(this.table.records[i][this.index]);
            }
            return this.valueA;
        },

        /**
         * get the values of the column
         * <br>
         * @type {Array}
         * @returns {Array} an array with the values of the column
         * @example
         *    var sumArray = mydata.column('total').values();
         */
        uniqueValues: function () {
            this.valueA = [];
            for (const i in this.table.records) {
                this.valueA.push(this.table.records[i][this.index]);
            }
            return this.valueA.filter(__onlyUnique);
        },

        /**
         * map the values of the column
         * @param {function} function(currVal) the user function to map the column values
         * @type void
         * @returns {Data.Column}
         * @example
         *    mydata.column('timestamp').map(
         *        function(value){
         *            var d = new Date(value);
         *            return( String(d.getDate()) + "." + String(d.getMonth()+1) + "." + String(d.getFullYear()) );
         *     });
         */
        map: function (callback) {

            // make new record values 
            // ----------------------
            for (const j in this.table.records) {
                // query new column value by callback
                this.table.records[j][this.index] = callback(this.table.records[j][this.index], this.table.records[j], this.index);
            }

            return this;
        },

        /**
         * rename the column
         * @param {string} szName the new column name
         * @type void
         * @returns {Data.Column}
         * @example
         *    mydata.column('timestamp').rename('time');
         */
        rename: function (szName) {

            this.table.fields[this.index].id = szName;
            return this;
        },

        /**
         * remove the column
         * @type void
         * @returns {Data.Column}
         * @example
         *    mydata.column('timestamp').remove();
         */
        remove: function () {

            this.table.fields.splice(this.index, 1);
            for (const j in this.table.records) {
                this.table.records[j].splice(this.index, 1);
            }
            this.table.table.fields--;
            return this;
        }
    };

    // ----------------------------------------------------
    // W R A P  Data.Table  functions to Data.Feed object
    // ----------------------------------------------------

    /**
     * extract the values of one column from a data table
     * @param szColumn the name of the column to extract from loaded data
     * @type {Array}
     * @returns column values array or null
     */
    Data.Feed.prototype.column = function (szColumn) {
        return this.dbtable.column(szColumn);
    };

    /**
     * applicate filter to one theme item
     * @param j the index (data row) of the item to check
     * @type {boolean}
     * @returns true if item passes the filter
     */
    Data.Feed.prototype.select = function (szSelection) {
        return this.dbtable.select(szSelection);
    };

    /**
     * aggregate 
     * @param j the index (data row) of the item to check
     * @type {boolean}
     * @returns true if item passes the filter
     */
    Data.Feed.prototype.aggregate = function (szColumn, szAggregation) {
        return this.dbtable.aggregate(szColumn, szAggregation);
    };

    /**
     * revert 
     * @param void
     * @type {Data.Feed}
     * @returns the reverted feed
     */
    Data.Feed.prototype.revert = function () {
        return this.dbtable.revert();
    };

    /**
     * reverse 
     * @param void
     * @type {Data.Feed}
     * @returns the reversed feed
     */
    Data.Feed.prototype.reverse = function () {
        return this.dbtable.reverse();
    };

    /**
     * pivot 
     * @param j the index (data row) of the item to check
     * @type {boolean}
     * @returns true if item passes the filter
     */
    Data.Feed.prototype.pivot = function (options) {
        return this.dbtable.pivot(options);
    };

    /**
     * subtable 
     * @param j the index (data row) of the item to check
     * @type {boolean}
     * @returns true if item passes the filter
     */
    Data.Feed.prototype.subtable = function (options) {
        return this.dbtable.subtable(options);
    };

    /**
     * add time fields to table by a timestamp column 
     * @param options ( see Data.Table.prototype.addTimeColumns )
     * @type {Data.Feed}
     * @returns the enhanced feed
     */
    Data.Feed.prototype.addTimeColumns = function (options) {
        return this.dbtable.addTimeColumns(options);
    };

    // =====================================================================
    // data broker
    // =====================================================================

    /**
     * This is the Data.Broker class.  
     * <br>
     * It realizes an object to load <b>one or more</b> data sources 
     * and call a user defined function if all sources have been successfully loaded.<br>
     * It passes an array with the loaded data (Data.Table objects) to the user function
     * 
     * @class realizes an object to load <b>one or more</b> data sources
     * @constructor
     * @type {Data.Broker}
     * @returns a new Data.Broker object
     * @example
     *	var broker = new Data.Broker()
     *		.addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/scrutiniCI_cm.csv","csv")
     *		.addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/risorse/comuniViminaleISTAT.csv","csv")
     * 		.addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/camera_geopolitico_italia.csv","csv")
     *		.realize(
     *	function(dataA) {
     *		var scrutini                    = dataA[0];
     *		var comuniViminaleISTAT         = dataA[1];
     *		var camera_geopolitico_italia   = dataA[2];
     *
     *		scrutini = scrutini.select("WHERE tipo_riga == LI");
     *		 ...
     *	});
     */
    Data.Broker = function (options) {
        this.souceQueryA = [];
        this.options = options || {};
        if (options) {
            this.parseDefinition(options);
        }
        this.onNotify = function () {};
        this.onError = function () {};
    };

    /**
     * inherit methods from Data.Feed class  
     */
    Data.Broker.prototype = new Data.Feed();

    Data.Broker.prototype = {
        /**
         * add one source to the broker
         * @param {string} szUrl the url of the data source
         * @param {string} szType type of the data (csv,...)
         *								   <table border='0' style='border-left: 1px solid #ddd;'>	
         *								   <tr><td><b>"csv"</b></td><td>the source is 'plain text' formatted as Comma Separated Values<br>delimiter supported: <span style='background:#dddddd'>,</span> and <span style='background:#dddddd'>;</span></td></tr>
         *								   <tr><td><b>"json"</b></td><td>the source is JSON (Javascript Object Notation)</td></tr>
         *								   <tr><td><b>"JSON-stat"</b></td><td>the source is a JSON object formatted in <a href="https://json-stat.org/JSON-stat" target="_blank">JSON-stat</a></td></tr>
         *								   <tr><td><b>"jsonDB"</b></td><td>the source is in ixmaps internal data table format</td></tr>
         *								   <tr><td><b>"rss"</b></td><td>the source is an xml rss feed</td></tr>
         *								   </table> 
         * @type {Data.Broker}
         * @returns the Data.Broker object
         */
        addSource: function (szUrl, szType) {
            _LOG("Data.Broker.addSource: " + szUrl);
            this.souceQueryA.push({
                url: szUrl,
                type: szType,
                data: null,
                result: null,
                next: this
            });
            return this;
        },

        /**
         * set the callback function to execute on sucess of all loading.<br>
         * Note: can also be defined as argument of .realize()
         * @param {function(broker)} callback the callback function
         * @type {Data.Broker}
         * @returns the Data.Broker object
         * @example
         *  function onSuccess(dataA) {
         *      ... do something with the loaded data
         *  }
         *
         *  var broker = new Data.Broker()
         *      .addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/scrutiniCI_cm.csv","csv")
         *      .setCallback(onSuccess)
         *      .realize();
         * @deprecated use callback in realize()
         */
        setCallback: function (callback) {
            this.callback = callback;
            return this;
        },

        /**
         * start the broker<br>
         * initiate the process to load the added sources and [optional] define a user function to be called 
         * on success.<br>the argument passed to the user function is an array with the loaded data as {@link "-_anonymous_-Data.Table"} objects
         * @param {function} callback type of the data (csv,...)
         * @type void
         * @see {@link Data.Broker.setCallback}
         * @example
         *		...
         *		.realize(
         *	function(dataA) {
         *		var scrutini                    = dataA[0];
         *		var comuniViminaleISTAT         = dataA[1];
         *		var camera_geopolitico_italia   = dataA[2];
         *		...
         *	});
         */
        realize: function (callback) {
            this.callback = callback || this.callback;
            for (const i in this.souceQueryA) {
                if (this.souceQueryA[i].url && !this.souceQueryA[i].result) {
                    this.getData(this.souceQueryA[i]);
                    return this;
                }
            }
            this.data = [];
            for (const i in this.souceQueryA) {
                this.data.push(this.souceQueryA[i].data);
            }
            this.callback(this.data);
            return this;
        },

        /**
         * define error function
         * @param {function(exception)} onError a user defined function to call when error occurs 
         * @type {Data.Broker}
         * @returns the Data.Broker object
         * @example
         *	var broker = new Data.Broker()
         *      .addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/scrutiniCI_cm.csv","csv")
         *
         *      .error(function(e){alert(e);})
         *
         *      .realize(
         *	function(broker) {
         *          ...
         *	});
         */

        error: function (onError) {
            this.onError = onError || this.onError;
            return this;
        },

        /**
         * define notify function
         * @param {function(exception)} onError a user defined function to call when notify occurs 
         * @type {Data.Broker}
         * @returns the Data.Broker object
         * @example
         *	var broker = new Data.Broker()
         *      .addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/scrutiniCI_cm.csv","csv")
         *
         *      .notify(function(e){alert(e);})
         *
         *      .realize(
         *	function(broker) {
         *          ...
         *	});
         */
        notify: function (onNotify) {
            this.onNotify = onNotify || this.onNotify;
            return this;
        }
    };

    /**
     * internal method to read parameter from the definition object
     * @method parseDefinition
     * @param definition the object literal with `data options`
     * @param szType type of the data (csv,...)
     * @private
     * @type void
     */
    Data.Broker.prototype.parseDefinition = function (definition) {
        this.callback = definition.callback || null;
    };
    /**
     * internal method to get one data from the specified source
     * @method getData
     * @param query object with the definition of the data source
     * @private
     * @type void
     */
    Data.Broker.prototype.getData = function (query) {
        this.onNotify(query);
        query.feed = Data.feed({
            "source": query.url,
            "type": query.type,
            "options": query.next.options,
            parent: this
        }).load(function (mydata) {
            query.data = mydata;
            query.data.raw = query.feed.data;
            this.parent.onNotify(query);
            query.result = "success";
            query.next.realize();
        }).error(function (e) {
            query.data = null;
            query.result = "error";
            query.next.realize();
        });
    };
    /**
     * set the broker result as the new Data.Table in the parent Data.Feed object
     * @method setData
     * @param data a 2 dim data array
     * @private
     * @type void
     */
    Data.Broker.prototype.setData = function (data) {
        this.parent.__doCreateTableDataObject(data, null, this.parent.options);
    };

    // Instantiates a broker object with 
    // an object literal with `data options`.
    // @factory Data.Feed.broker(options?: Data options)
    //
    Data.Feed.prototype.broker = function (options) {
        let broker = new Data.Broker(options);
        broker.parent = this;
        return broker;
    };

    // @factory Data.broker()
    // Instantiates a Data.Broker
    //

    Data.broker = function () {
        return new Data.Broker();
    };

    // =====================================================================
    // data merger
    // =====================================================================

    /**
     * This is the Data.Merger class.  
     * <br>
     * It realizes an object to load <b>two or more</b> data sources 
     * and merge the data guided by 2 columns with identical values.<br>
     * 
     * @class realizes an object to merge <b>two or more</b> data sources
     * @constructor
     * @type {Data.Merger}
     * @returns a new Data.Merger object
     * @example
     *	var merger = new Data.Merger()
     *      .addSource(prezzi,{lookup:"idImpianto",columns:["descCarburante","prezzo","isSelf","dtComu"]});
     *      .addSource(impianti,{lookup:"idImpianto",columns:["Bandiera","Latitudine","Longitudine"]});
     *		.realize(
     *	function(mergedTable) {
     *
     *		selection = mergedTable.select("WHERE tipo_riga == LI");
     *		 ...
     *	});
     */
    Data.Merger = function (options) {
        this.sourceA = [];
        this.options = options || {};
        if (options) {
            this.parseDefinition(options);
        }
    };

    Data.Merger.prototype = {
        /**
         * add one source to the merger
         * @param {Object} source a loaded data.js table object, typically the result of a data.feed 
         * @param {Object} option the merging parameter for this sorce: lookup, columns and label [optional]
         * @example
         *   .addSource(prezzi,{lookup:"idImpianto",columns:["descCarburante","prezzo","isSelf","dtComu"]});
         * @example
         *   .addSource(prezzi,{lookup:"idImpianto",columns:["descCarburante","prezzo","isSelf","dtComu"],label:["CARB1","PREZZO","SELF","COM"]});
         * @type {Data.Merger}
         * @returns the Data.Merger object
         */
        addSource: function (source, option) {
            this.sourceA.push({
                data: source,
                opt: option
            });
            return this;
        },

        /**
         * define which source columns should be included into the merged table.
         * @param {Array} columnsA a subset of source columns or label you defined by .addSource 
         * @type {Data.Merger}
         * @return the Data.Merger object
         * @example
         *		var merger = new Data.Merger()
         *      .addSource(prezzi,{lookup:"idImpianto",columns:["descCarburante","prezzo","isSelf","dtComu"]});
         *      .addSource(impianti,{lookup:"idImpianto",columns:["Bandiera","Latitudine","Longitudine"]});
         *		.setOuputColumns(["desCaburante","prezzo"])
         *      .realize();
         */
        setOutputColumns: function (columnsA) {
            this.outColumnsA = columnsA;
            return this;
        },

        /**
         * initiates the process of merging the sources, guided by the lookup column,
         * inserting all columns that have been defined by .addSource(), or a subset<br>
         * of them defined by .setOutputColumns()
         * @param {function} callback user defined function which receives as argument the merged table 
         * @type void
         * @see {@link Data.Merger.setCallback}
         * @example
         *  ...
         * .realize(function(newData){
         *     ixmaps.setExternalData(newData,{"type":"jsonDB","name":"prezzi_tipo_latlon"});
         * });	
         */
        realize: function (callback) {

            this.callback = callback || this.callback;

            _LOG("DataMerger: >>>");

            let indexAA = [];

            for (const i in this.sourceA) {

                let source = this.sourceA[i];

                source.opt.columns = source.opt.columns || source.data.columnNames();
                source.opt.label = source.opt.label || [];

                source.opt.columns = __toArray(source.opt.columns);
                source.opt.label = __toArray(source.opt.label);
                
                if (!this.sourceA[i].data) {
                    _alert("DataMerger: source '" + i + "' not found");
                }

                if (!this.sourceA[i].data[0]) {
                    this.sourceA[i].data = this.sourceA[i].data.getArray();
                }

                if (!this.sourceA[i].data[0]) {
                    _alert("DataMerger: source '" + i + "' not found or not of type Array");
                }

                let index = [];
                for (const ii in this.sourceA[i].data[0]) {

                    if (this.sourceA[i].data[0][ii] == this.sourceA[i].opt.lookup) {
                        index[this.sourceA[i].opt.lookup] = ii;
                    }

                    for (const iii in this.sourceA[i].opt.columns) {
                        if (!this.sourceA[i].opt.label[iii]) {
                            this.sourceA[i].opt.label[iii] = this.sourceA[i].opt.columns[iii] + "." + (Number(i) + 1) + "";
                        }
                        if (this.sourceA[i].data[0][ii] == this.sourceA[i].opt.columns[iii]) {
                            index[this.sourceA[i].opt.label[iii]] = ii;
                        }
                    }
                }
                // check completeness
                for (const iii in this.sourceA[i].opt.columns) {
                    if (!index[this.sourceA[i].opt.label[iii]]) {
                        _LOG("DataMerger: '" + this.sourceA[i].opt.label[iii] + "' not found");
                    }
                }
                indexAA.push(index);
            }

            let labelA = [];
            for (const i in this.sourceA) {
                for (const ii in this.sourceA[i].opt.label) {
                    labelA.push(this.sourceA[i].opt.label[ii]);
                }
            }

            if (!this.outColumnsA) {
                this.outColumnsA = [];
                for (const i in labelA) {
                    this.outColumnsA.push(labelA[i]);
                }
            }

            let outColumnsLookupA = [];
            for (const i in this.outColumnsA) {
                for (const ii in indexAA) {
                    for (const iii in indexAA[ii]) {
                        if (iii == this.outColumnsA[i]) {
                            outColumnsLookupA[iii] = {
                                input: ii,
                                index: indexAA[ii][iii]
                            };
                        }
                    }
                }
            }

            for (const i in this.outColumnsA) {
                if (!outColumnsLookupA[this.outColumnsA[i]]) {

                    for (const ii in this.sourceA[0].data[0]) {
                        if (this.sourceA[0].data[0][ii] == this.outColumnsA[i]) {
                            outColumnsLookupA[this.outColumnsA[i]] = {
                                input: 0,
                                index: ii
                            };
                        }
                    }
                }
            }

            this.namedSourceA = [];
            for (let i = 1; i < this.sourceA.length; i++) {
                this.namedSourceA[i] = [];
                for (let ii = 1; ii < this.sourceA[i].data.length; ii++) {
                    this.namedSourceA[i][String(this.sourceA[i].data[ii][indexAA[i][this.sourceA[i].opt.lookup]])] = this.sourceA[i].data[ii];
                }
            }

            let newData = [];
            newData.push(this.outColumnsA);

            for (let i = 1; i < this.sourceA[0].data.length; i++) {
                let lookup = String(this.sourceA[0].data[i][[indexAA[0][this.sourceA[0].opt.lookup]]]);

                let row = [];

                for (const ii in this.outColumnsA) {
                    let ll = outColumnsLookupA[this.outColumnsA[ii]];
                    if (ll) {
                        if (ll.input == 0) {
                            row.push(this.sourceA[0].data[i][ll.index]);
                        } else {
                            if (this.namedSourceA[ll.input][lookup]) {
                                row.push(this.namedSourceA[ll.input][lookup][ll.index]);
                            } else {
                                row.push(" ");
                            }
                        }
                    } else {
                        _alert("DataMerger - missing \"" + this.outColumnsA[ii] + "\" in label:[...]");
                        return null;
                    }
                }

                newData.push(row);
            }

            _LOG("DataMerger: done");

            let dbTable = new Data.Table();
            dbTable.setArray(newData);

            if (this.callback) {
                this.callback(dbTable);
            }

            return dbTable;
        },

        /**
         * define error function
         * @param {function(exception)} onError a user defined function to call when error occurs 
         * @type {Data.Merger}
         * @returns the Data.Merger object
         * @example
         *	var merger= new Data.Merger()
         *      .addSource("https://raw.githubusercontent.com/ondata/elezionipolitiche2018/master/dati/scrutiniCI_cm.csv","csv")
         *
         *      .error(function(e){alert(e);})
         *
         *      .realize(
         *	function() {
         *          ...
         *	});
         */
        error: function (onError) {
            this.onError = onError || this.onError;
            return this;
        }
    };

    // @factory Data.merger()
    // Instantiates a Data.Merger
    //

    Data.merger = function () {
        return new Data.Merger();
    };

    // =====================================================================
    // end of data merger
    // =====================================================================

    // version message
    console.log("*** data.js " + Data.version + " ***");

    // alert handling
    var _alert = function (szAlert) {
        console.log("data.js v" + Data.version + ": " + szAlert);
    };

    /**
     * end of namespace
     */


}(window, document));

// -----------------------------
// EOF
// -----------------------------
