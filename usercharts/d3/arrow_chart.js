/**********************************************************************
chart.js

$Comment: user chart drawing plugin
$Source : chart.js,v $

$InitialAuthor: guenter richter $
$InitialDate: 2020/04/16 $
$Author: guenter richter $
$Id:chart.js 1 2020-04-16 00:00:00Z Guenter Richter $

Copyright (c) Guenter Richter
$Log:chart.js,v $
**********************************************************************/

/** 
 * @fileoverview This file is a user chart draw plugin for ixmaps
 *
 * @author Guenter Richter guenter.richter@ixmaps.com
 * @version 0.9
 */

/**
 * define namespace ixmaps
 */

window.ixmaps = window.ixmaps || {};
(function () {

    // --------------------------------
    // user generated chart 
    // --------------------------------

    // --------------------------------
    // helper - define gradient for filling 
    // --------------------------------

    __myGradientId = "myGradient" + Math.random();

    __defineGradient = function (target, szId, szColor) {

        var mainGradient = target.append('linearGradient')
            .attr('id', szId)
            .attr("x1", "0%")
            .attr("y1", "50%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        // Create the stops of the main gradient. Each stop will be assigned
        // a class to style the stop using CSS.
        mainGradient.append('stop')
            .attr('style', 'stop-color:' + szColor + '')
            .attr('offset', '0');

        mainGradient.append('stop')
            .attr('style', 'stop-color:#dddddd')
            .attr('offset', '1');

        // ----------------------------------------------

        mainGradient = target.append('linearGradient')
            .attr('id', szId + "R")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "80%");

        // Create the stops of the main gradient. Each stop will be assigned
        // a class to style the stop using CSS.
        mainGradient.append('stop')
            .attr('style', 'stop-color:' + szColor + '')
            .attr('offset', '0');

        mainGradient.append('stop')
            .attr('style', 'stop-color:white')
            .attr('offset', '1');
    };

    // --------------------------------------------------
    // init is called once before draw  
    // here we define the gradient for filling the peeks
    // --------------------------------------------------

    ixmaps.arrowChart_init = function (SVGDocument, args) {

        // use d3 to draw the chart
        // -------------------------
        var svg = d3.select(args.target);

        // Create the svg:defs element and the main gradient definition.
        ixmaps.d3svgDefs = svg.append('defs');

        for (var i in args.theme.colorScheme) {
            __defineGradient(ixmaps.d3svgDefs, __myGradientId + i, args.theme.colorScheme[i]);
        }
    };

    // --------------------------------------------------
    // called for every chart of the theme to draw   
    // draw a peak with outline color and gradient filling
    // chart type inspired by NYT pinackle maps
    // --------------------------------------------------

    ixmaps.arrowChart = function (SVGDocument, args) {

        // 1. get the height from args
        
        var nValue = args.value || args.values[(args.theme.nActualFrame || args.class || 0)];
        var nMax = Math.max(args.theme.nMax, Math.abs(args.theme.nMin));
        if (args.theme.nMinValue && (nValue < args.theme.nMinValue)) {
            return false;
        }
        var nHeight = args.item ? nValue / nMax * args.maxSize * 20 : args.maxSize / 2 * 20;
        if (args.size) {
            nHeight = args.size;
        }
        if (args.theme.nNormalSizeValue) {
            nHeight = args.item ? nValue / args.theme.nNormalSizeValue * args.maxSize * 20 : args.maxSize / 2 * 20;
        }
        if (args.size) {
            nHeight = args.item ? args.size * 20 : args.maxSize / 2 * 20;
        }
        nHeight *= args.theme.nRangeScale || 1;

        // 2. get the color - defined directly or by class

 		var szColor = args.color || args.item.szColor || (args.theme.colorScheme[args.class]);
        var szLineColor = args.theme.szLineColor || szColor;

        // define a gradient with the given color for the filling 
        //
        var szGradientId = __myGradientId + szColor.replace(/[^a-zA-Z0-9 -]/g, '_');
        if (args.flag.match(/ZOOM/)) {
            __defs = d3.select(args.target).append('defs');
            __defineGradient(__defs, szGradientId, szColor);
        } else {
            __defineGradient(ixmaps.d3svgDefs, szGradientId, szColor);
        }

        var szOpacity = args.opacity || args.theme.nOpacity || 1;
        var szFillOpacity = args.fillopacity || args.theme.fillOpacity || 0.6;

        if (nHeight == 0) {
            return false;
        }
        
        // ------------------------
        // here we draw the grafic   
        // ------------------------

        var szGColor = args.theme.szFlag.match(/GRADIENT/) ? "url(#" + szGradientId + ")" : szColor;

        // use d3 to draw the peaks
        // -------------------------
        var svg = d3.select(args.target);

        if (nValue >= 0) {
            if (nHeight > 100 && args.theme.szFlag.match(/SHADOW/)) {
                svg.append("path")
                    .attr("d", "m 0,-230.68306 49.394,-49.394 v 263.787999 c 0,8.2839998 6.716001,14.9999998 15.000001,14.9999998 8.284001,0 15.000001,-6.716 15.000001,-14.9999998 V -280.07706 l 49.394,49.394 c 2.928,2.929 6.767,4.394 10.606,4.394 3.839,0 7.678,-1.465 10.606,-4.394 5.858,-5.857 5.858,-15.355 0,-21.213 l -75,-75 c -5.857001,-5.858 -15.355001,-5.858 -21.213001,0 l -75.0000008,75 c -5.85799995,5.857 -5.85799995,15.355 0,21.213 5.8579998,5.857 15.3559998,5.857 21.2129998,0 z")
                    .attr("style", "fill:#888888;stroke:#444444;stroke-width:1;fill-opacity:" + 1 + ";opacity:" + 0.2 + ";")
                    .attr("transform", "translate(" + nHeight / 45 + " " + -nHeight / 70 + ") scale(" + nHeight / 2000 + " " + nHeight / 4000 + ") rotate(135)");
            }
            svg.append("path")
                .attr("d", "m -64,-230.68306 49.394,-49.394 v 263.787999 c 0,8.2839998 6.716001,14.9999998 15.000001,14.9999998 8.284001,0 15.000001,-6.716 15.000001,-14.9999998 V -280.07706 l 49.394,49.394 c 2.928,2.929 6.767,4.394 10.606,4.394 3.839,0 7.678,-1.465 10.606,-4.394 5.858,-5.857 5.858,-15.355 0,-21.213 l -75,-75 c -5.857001,-5.858 -15.355001,-5.858 -21.213001,0 l -75.0000008,75 c -5.85799995,5.857 -5.85799995,15.355 0,21.213 5.8579998,5.857 15.3559998,5.857 21.2129998,0 z")
                .attr("style", "fill:" + szGColor + ";stroke:" + szLineColor + ";stroke-width:" + (args.theme.nLineWidth * 10) + ";fill-opacity:" + szFillOpacity + ";opacity:" + szOpacity + ";")
                .attr("transform", "scale(" + nHeight / 2000 + " " + nHeight / 1800 + ")");
        } else
        if (!args.theme.szFlag.match(/NONEGATIVE/)) {
            svg.append("path")
                .attr("d", "m 155.27191,-100.6065 -49.394,49.393999 V -315.0005 c 0,-8.284 -6.716003,-15 -15.000003,-15 -8.284,0 -15,6.716 -15,15 v 263.787999 l -49.394,-49.393999 c -2.928,-2.929 -6.767,-4.394 -10.606,-4.394 -3.839,0 -7.6779996,1.465 -10.6059996,4.394 -5.85799995,5.856999 -5.85799995,15.354999 0,21.212999 L 80.271907,-4.3935012 c 5.857,5.858 15.355,5.858 21.213003,0 l 75,-74.9999998 c 5.858,-5.857 5.858,-15.355 0,-21.212999 -5.858,-5.857 -15.356,-5.857 -21.213,0 z")
                .attr("style", "fill:" + szColor + ";stroke:" + szColor + ";stroke-width:" + (args.theme.nLineWidth * 10) + ";stroke-opacity:1;fill-opacity:" + args.theme.nFadeNegative + ";opacity:" + szOpacity + ";")
                .attr("transform", "scale(" + nHeight / 2000 + " " + nHeight / 2000 + ") translate(-90 320)");
        }

        if (args.flag.match(/VALUES|TITLE/)) {

            var nFontSize = nHeight / 20 * (args.theme.nValueScale || 1); //Math.sqrt(nHeight)*4;

            // show only if fontsize is reasonable (fontsize is n * 20)
            if (args.flag.match(/ZOOM/) || nFontSize > ((args.theme.nValueSizeMin * 20) || 60)) {
                var szText = (nValue).toFixed(0) + (args.theme.szUnits || "");
                var szTextOpacity = 1; // 0.2 + nValue/nMax;

                // show the value on top of the peek
                if (args.flag.match(/VALUES/)) {
                    if (nValue > 0) {
                        svg.append("text")
                            .attr("x", 0)
                            .attr("y", -nHeight / 6.5 - nFontSize * 0.7)
                            .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:none;fill-opacity:" + szTextOpacity + ";stroke:white;stroke-width:" + nFontSize / 5 + "px;opacity:" + 0.5 + ";pointer-events:none")
                            .text("+" + szText);
                        svg.append("text")
                            .attr("x", 0)
                            .attr("y", -nHeight / 6.5 - nFontSize * 0.7)
                            .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:" + (args.theme.szValueColor || szColor) + ";fill-opacity:" + szTextOpacity + ";stroke:none;opacity:" + szOpacity + ";pointer-events:none")
                            .text("+" + szText);
                    } else
                    if (!args.theme.szFlag.match(/NONEGATIVE/)) {
                        if (args.theme.szFlag.match(/NEGATIVELIKEPOSITIVE/)) {
                            svg.append("text")
                                .attr("x", 0)
                                .attr("y", nHeight / 6.5 + nFontSize * 1)
                                .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:none;fill-opacity:" + szTextOpacity + ";stroke:white;stroke-width:" + nFontSize / 7 + "px;opacity:" + 0.5 + ";pointer-events:none")
                                .text(szText);
                            svg.append("text")
                                .attr("x", 0)
                                .attr("y", nHeight / 6.5 + nFontSize * 1)
                                .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:" + (args.theme.szValueColor || szColor) + ";fill-opacity:" + szTextOpacity + ";stroke:none;opacity:" + szOpacity + ";pointer-events:none")
                                .text(szText);
                        } else {
                            svg.append("text")
                                .attr("x", 0)
                                .attr("y", -nFontSize / 3)
                                .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:none;fill-opacity:" + szTextOpacity + ";stroke:white;stroke-width:" + nFontSize / 7 + "px;opacity:" + 0.5 + ";pointer-events:none")
                                .text(szText);
                            svg.append("text")
                                .attr("x", 0)
                                .attr("y", -nFontSize / 3)
                                .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:red;fill-opacity:" + szTextOpacity + ";stroke:none;opacity:" + szOpacity + ";pointer-events:none")
                                .text(szText);
                        }
                    }
                }

                // is there is a chart title defined, show it below the value
                if (args.item.szLabel) {
                    nFontSize /= 3 / (args.theme.nTextScale || 1);
                    svg.append("text")
                        .attr("x", 100)
                        .attr("y", -nHeight / 7 - nFontSize * 0.3)
                        .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:none;fill-opacity:" + szTextOpacity + ";stroke:white;stroke-width:" + nFontSize / 10 + "px;opacity:" + 0.6 + ";pointer-events:none")
                        .text(args.item.szLabel);
                    svg.append("text")
                        .attr("x", 100)
                        .attr("y", -nHeight / 7 - nFontSize * 0.3)
                        .attr("style", "font-family:arial;font-size:" + nFontSize + "px;text-anchor:middle;fill:#444444;fill-opacity:" + szTextOpacity + ";stroke:none;opacity:" + szOpacity + ";pointer-events:none")
                        .text(args.item.szLabel);
                }
            }
        }
        return {
            x: 0,
            y: args.item ? 0 : (nHeight + 2 * 20)
        };
    };

    /**
     * end of namespace
     */

})();

// -----------------------------
// EOF
// -----------------------------
