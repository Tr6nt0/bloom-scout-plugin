// ==UserScript==
// @id             iitc-plugin-pb
// @name           IITC plugin: Pikmin Bloom Helper
// @category       Controls
// @version        0.1
// @description    Mark Ingress portals as mushrooms or flowers in Pikmin Bloom. 
// @include        https://www.ingress.com/intel*
// @include        https://ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          https://ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==
/* eslint-env es6 */
/* eslint no-var: "error" */
/* globals $, L, GM_info, plugin, dialog */
/* globals renderPortalDetails, findPortalGuidByPositionE6 */

;(function () {
    'use strict';

    const plugin_info = {};
    if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
        plugin_info.script = {
            version: GM_info.script.version,
            name: GM_info.script.name,
            description: GM_info.script.description
        };
    }

    const setup = function () {
        if (window.plugin.pikminBloom) {
            console.log('IITC plugin: Pikmin Bloom Helper already set up.');
            return;
        }

        window.plugin.pikminBloom = {
            // Initialize plugin
            init: function() {
                console.log('Initializing Pikmin Bloom Helper plugin');
                // Add initialization code here
            },

            // Mark a portal as a mushroom
            markAsMushroom: function(guid) {
                // Implementation for marking as mushroom
            },

            // Mark a portal as a flower
            markAsFlower: function(guid) {
                // Implementation for marking as flower
            },

            // Add other necessary functions here
        };

        // Add hooks and interface elements
        addHook('portalDetailsUpdated', window.plugin.pikminBloom.addMarkButtons);
        
        // Call the init function
        window.plugin.pikminBloom.init();
    };

    // PLUGIN END //////////////////////////////////////////////////////////
    setup.info = plugin_info; //add the script info data to the function as a property
    if (!window.bootPlugins) {
        window.bootPlugins = [];
    }
    window.bootPlugins.push(setup);
    // if IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') {
        setup();
    }
})();
