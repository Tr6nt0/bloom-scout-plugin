// ==UserScript==
// @name         Pikmin Bloom Tools, IITC Edition
// @namespace    https://github.com/your-username/iitc-pikmin-bloom
// @id           pikminbloom@your-username
// @category     Layer
// @version      0.1.0
// @description  Pikmin Bloom tools over IITC. 
// @match        https://intel.ingress.com/*
// @grant        none
// ==/UserScript==

function wrapper(plugin_info) {
    // Ensure plugin framework is there, even if iitc is not yet loaded
    if (typeof window.plugin !== 'function') window.plugin = function() {};

    // PLUGIN START ////////////////////////////////////////////////////////

    // use own namespace for plugin
    window.plugin.pikminBloom = function() {};
    const thisPlugin = window.plugin.pikminBloom;
    const KEY_STORAGE = 'plugin-pikminbloom-data';
    const KEY_SETTINGS = 'plugin-pikminbloom-settings';

    // CONSTANTS
    const MUSHROOM_CELL_LEVEL = 15;
    const FLOWER_CELL_LEVEL = 14;
    const LARGE_FLOWER_CELL_LEVEL = 13;

    let mushrooms = {};
    let flowers = {};
    let largeFlowers = {};
    let settings = {};

    const defaultSettings = {
        highlightMushrooms: true,
        highlightFlowers: true,
        highlightLargeFlowers: true,
        showGrid: true,
        gridLevels: [13, 14, 15],
        colors: {
            mushroom: '#FF0000',
            flower: '#00FF00',
            largeFlower: '#0000FF',
            grid: '#FFFFFF'
        }
    };

    function saveSettings() {
        localStorage[KEY_SETTINGS] = JSON.stringify(settings);
    }

    function loadSettings() {
        const tmp = localStorage[KEY_SETTINGS];
        if (!tmp) {
            settings = defaultSettings;
            return;
        }
        try {
            settings = JSON.parse(tmp);
        } catch (e) {
            settings = defaultSettings;
        }
    }

    thisPlugin.addMushroom = function(guid, lat, lng, name) {
        mushrooms[guid] = { guid: guid, lat: lat, lng: lng, name: name };
        updateMarkers();
        saveData();
    };

    thisPlugin.addFlower = function(guid, lat, lng, name) {
        flowers[guid] = { guid: guid, lat: lat, lng: lng, name: name };
        updateMarkers();
        saveData();
    };

    thisPlugin.addLargeFlower = function(guid, lat, lng, name) {
        largeFlowers[guid] = { guid: guid, lat: lat, lng: lng, name: name };
        updateMarkers();
        saveData();
    };

    function saveData() {
        localStorage[KEY_STORAGE] = JSON.stringify({
            mushrooms: mushrooms,
            flowers: flowers,
            largeFlowers: largeFlowers
        });
    }

    thisPlugin.loadData = function() {
        const data = JSON.parse(localStorage[KEY_STORAGE] || '{}');
        mushrooms = data.mushrooms || {};
        flowers = data.flowers || {};
        largeFlowers = data.largeFlowers || {};
    };

    function updateMarkers() {
        // Clear existing layers
        mushroomLayerGroup.clearLayers();
        flowerLayerGroup.clearLayers();
        largeFlowerLayerGroup.clearLayers();

        // Add markers for mushrooms
        Object.values(mushrooms).forEach(m => {
            const marker = L.marker([m.lat, m.lng], {
                icon: L.divIcon({
                    className: 'pikmin-mushroom-icon',
                    html: '🍄',
                    iconSize: [20, 20]
                })
            });
            marker.bindPopup(m.name);
            mushroomLayerGroup.addLayer(marker);
        });

        // Add markers for flowers
        Object.values(flowers).forEach(f => {
            const marker = L.marker([f.lat, f.lng], {
                icon: L.divIcon({
                    className: 'pikmin-flower-icon',
                    html: '🌼',
                    iconSize: [20, 20]
                })
            });
            marker.bindPopup(f.name);
            flowerLayerGroup.addLayer(marker);
        });

        // Add markers for large flowers
        Object.values(largeFlowers).forEach(lf => {
            const marker = L.marker([lf.lat, lf.lng], {
                icon: L.divIcon({
                    className: 'pikmin-large-flower-icon',
                    html: '🌸',
                    iconSize: [30, 30]
                })
            });
            marker.bindPopup(lf.name);
            largeFlowerLayerGroup.addLayer(marker);
        });
    }

    function updateGrid() {
        gridLayerGroup.clearLayers();
        if (!settings.showGrid) return;

        const bounds = map.getBounds();
        settings.gridLevels.forEach(level => {
            const cell = S2.S2Cell.fromLatLng(bounds.getCenter(), level);
            const cellBounds = cell.getCornerLatLngs();

            const gridLine = L.polyline(cellBounds.concat([cellBounds[0]]), {
                color: settings.colors.grid,
                weight: 1,
                opacity: 0.5
            });

            gridLayerGroup.addLayer(gridLine);
        });
    }

    function addHooks() {
        window.addHook('portalAdded', onPortalAdded);
        window.addHook('mapDataRefreshEnd', updateMarkers);
        window.map.on('moveend', updateGrid);
    }

    function onPortalAdded(data) {
        const guid = data.portal.options.guid;
        const portal = window.portals[guid];
        if (!portal) return;

        const ll = portal.getLatLng();
        const name = portal.options.data.title;

        // Check if the portal should be a mushroom, flower, or large flower based on S2 cells
        const cell = S2.S2Cell.fromLatLng(ll, MUSHROOM_CELL_LEVEL);
        if (!mushrooms[guid] && !flowers[guid] && !largeFlowers[guid]) {
            if (cell.level === MUSHROOM_CELL_LEVEL) {
                thisPlugin.addMushroom(guid, ll.lat, ll.lng, name);
            } else if (cell.level === FLOWER_CELL_LEVEL) {
                thisPlugin.addFlower(guid, ll.lat, ll.lng, name);
            } else if (cell.level === LARGE_FLOWER_CELL_LEVEL) {
                thisPlugin.addLargeFlower(guid, ll.lat, ll.lng, name);
            }
        }
    }

    function setup() {
        loadSettings();
        thisPlugin.loadData();

        // Create layer groups
        mushroomLayerGroup = L.layerGroup();
        flowerLayerGroup = L.layerGroup();
        largeFlowerLayerGroup = L.layerGroup();
        gridLayerGroup = L.layerGroup();

        // Add layer groups to the map
        window.addLayerGroup('Pikmin Mushrooms', mushroomLayerGroup, settings.highlightMushrooms);
        window.addLayerGroup('Pikmin Flowers', flowerLayerGroup, settings.highlightFlowers);
        window.addLayerGroup('Pikmin Large Flowers', largeFlowerLayerGroup, settings.highlightLargeFlowers);
        window.addLayerGroup('Pikmin Grid', gridLayerGroup, settings.showGrid);

        addHooks();
        updateMarkers();
        updateGrid();

        // Add toolbar buttons
        const toolbox = document.getElementById('toolbox');
        const buttonPikmin = document.createElement('a');
        buttonPikmin.textContent = 'Pikmin Bloom';
        buttonPikmin.title = 'Pikmin Bloom Actions';
        buttonPikmin.addEventListener('click', showPikminDialog);
        toolbox.appendChild(buttonPikmin);
    }

    function showPikminDialog() {
        const content = `
            <div id="pikmin-settings">
                <label><input type="checkbox" id="highlight-mushrooms" ${settings.highlightMushrooms ? 'checked' : ''}> Highlight Mushrooms</label><br>
                <label><input type="checkbox" id="highlight-flowers" ${settings.highlightFlowers ? 'checked' : ''}> Highlight Flowers</label><br>
                <label><input type="checkbox" id="highlight-large-flowers" ${settings.highlightLargeFlowers ? 'checked' : ''}> Highlight Large Flowers</label><br>
                <label><input type="checkbox" id="show-grid" ${settings.showGrid ? 'checked' : ''}> Show Grid</label><br>
                <button id="save-pikmin-settings">Save Settings</button>
            </div>
        `;

        const container = dialog({
            id: 'pikmin-dialog',
            title: 'Pikmin Bloom Settings',
            html: content
        });

        const saveButton = container[0].querySelector('#save-pikmin-settings');
        saveButton.addEventListener('click', () => {
            settings.highlightMushrooms = container[0].querySelector('#highlight-mushrooms').checked;
            settings.highlightFlowers = container[0].querySelector('#highlight-flowers').checked;
            settings.highlightLargeFlowers = container[0].querySelector('#highlight-large-flowers').checked;
            settings.showGrid = container[0].querySelector('#show-grid').checked;

            saveSettings();
            updateMarkers();
            updateGrid();
            container.dialog('close');
        });
    }

    // PLUGIN END //////////////////////////////////////////////////////////

    setup.info = plugin_info; //add the script info data to the function as a property
    if (window.iitcLoaded) {
        setup();
    } else {
        if (!window.bootPlugins) window.bootPlugins = [];
        window.bootPlugins.push(setup);
    }
}

// Boilerplate to add as a IITC plugin
const script = document.createElement('script');
script.appendChild(document.createTextNode('(' + wrapper + ')(' + JSON.stringify(plugin_info) + ');'));
(document.body || document.head || document.documentElement).appendChild(script);
