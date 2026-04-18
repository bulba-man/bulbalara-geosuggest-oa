class GeoSuggest {
    ymaps3;
    mapEntities = {};

    constructor(field, config = {}) {
        this.searchField = HTMLInputElement;
        this.wrapper = HTMLElement;
        this.list = HTMLElement;
        this.mapModal = HTMLDivElement;
        this.mapContainer = HTMLElement;
        this.mapAddressInput = HTMLInputElement;
        this.mapCoordinatesBlock = HTMLElement;
        this.openModalBut = HTMLElement;

        this.coordsWrapper = HTMLElement;
        this.coordLng = HTMLInputElement;
        this.coordLat = HTMLInputElement;
        this.findAddressBut = HTMLButtonElement;

        this.mapLatInput = HTMLInputElement;
        this.mapLngInput = HTMLInputElement;
        this.mapSaveBut = HTMLButtonElement;

        this.regionStateField = HTMLSelectElement;
        this.regionStateChoices = null;
        this.regionDistrictField = HTMLSelectElement;
        this.regionDistrictChoices = null;
        this.regionCityField = HTMLSelectElement;
        this.regionCityChoices = null;
        this.selectedAddressValues = {};

        this.map = null;

        this.filledFlag = false;

        if (!this._initField(field)) {
            console.error('Undefined GeoSuggest field: ', field);
            return;
        }

        this.searchField._geoSuggest = this;

        this.config = {
            classNames: {
                wrapperClass: 'geo-suggest-wrapper',
                listWrapperClass: 'geo-suggest-block',
                listClass: 'geo-suggest-list',
            },
            apiUrl: 'https://suggest-maps.yandex.ru/v1/suggest',
            apiKey: '',
            api: {
                lang: 'en',
                results: 5,
                highlight: 0,
                types: 'geo',
                print_address: 1,
            },
            minSearchLen: 3,
            withMap: false,
            withCoordinates: false,
            showPrecision: false,
            stateFieldName: null,
            districtFieldName: null,
            cityFieldName: null,
            modalMapSelector: '.geo-suggest-modal-map',
            modalMapOptions: {
                backdrop: 'static',
                keyboard: false
            },
            map: {
                geoCodeUrl: 'https://geocode-maps.yandex.ru/v1/',
                apiKey: '',
                lang: 'en_EN',
                center: {
                    lat: '53.90228125',
                    lng: '27.56183022',
                }
            },
            events: {
                onRenderMap: [],
                onRenderedMap: [],
            },
        }

        this._initConfig(config);

        if (!this.config.apiKey.length) {
            console.error('API key not specified');
            return;
        }

        this._initNodes();
        this._registerObservers();

        this._regexLat = /^-?([0-8]?[0-9]|90)(\.[0-9]{1,15})?$/;
        this._regexLng = /^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]{1,15})?$/;
    }

    _initConfig(config) {
        this.config = this._mergeObj(this.config, config)

        if (this.config.withCoordinates) {
            this.config.api.attrs = 'uri';
        }
    }

    _mergeObj(target, source) {
        for (let key in source) {
            var value = source[key];
            if (target.hasOwnProperty(key) && GeoSuggest.isPureObject(value)) {
                value = this._mergeObj(target[key], value);
            }

            target[key] = value;
        }

        return target;
    }

    _initField(dataFieldSelector) {
        return this._initNode('searchField', dataFieldSelector);
    }

    _initNode(propertyName, selector, parent = null) {
        if (GeoSuggest.isDomElement(selector)) {
            this[propertyName] = selector;
        } else {
            this[propertyName] = (parent) ? parent.querySelector(selector) : document.querySelector(selector);
        }

        return (this[propertyName])
    }

    _initNodes() {
        this.wrapper = this.searchField.closest('.'+this.config.classNames.wrapperClass);
        if (!this.wrapper) {
            this.wrapper = this.searchField.parentElement;
        }

        document.addEventListener('click', e => {
            if (!this.wrapper.contains(e.target)) {
                this.list.classList.remove('show');
            }
        });

        this.list = this.wrapper.querySelector('.'+this.config.classNames.listClass)
        if (!this.list) {
            var block = document.createElement("div");
            block.classList.add(this.config.classNames.listWrapperClass);
            this.list = document.createElement("div");
            this.list.classList.add(this.config.classNames.listClass);
            block.appendChild(this.list);
            this.wrapper.appendChild(block);
        }

        if (this.config.withCoordinates) {
            this._initNode('coordsWrapper', '.geo-suggest-coords', this.wrapper);
            if (this.coordsWrapper) {
                this._initNode('coordLng', '.coords-lng', this.coordsWrapper);
                this._initNode('coordLat', '.coords-lat', this.coordsWrapper);
                this._initNode('findAddressBut', '.find-address', this.coordsWrapper);
            }
        }

        if (this.config.withMap) {
            this._initNode('mapModal', this.config.modalMapSelector);
            this._initNode('openModalBut', '.open-map', this.wrapper);

            if (this.mapModal) {
                this.mapModalInstance = new bootstrap.Modal(this.mapModal, this.config.modalMapOptions);

                this._initNode('mapContainer', '.map-container', this.mapModal);
                this._initNode('mapAddressInput', '.map-address input', this.mapModal);
                this._initNode('mapCoordinatesBlock', '.map-coordinates', this.mapModal);
                this._initNode('mapLatInput', '.lat input', this.mapCoordinatesBlock);
                this._initNode('mapLngInput', '.lng input', this.mapCoordinatesBlock);
                this._initNode('mapSaveBut', '.save-geo-data', this.mapModal);
            }
        }

        if (this.config.stateFieldName) {
            this._initNode('regionStateField', '[name="'+this.config.stateFieldName+'"]');
            if (this.regionStateField && this.regionStateField.parentElement.classList.contains('choices__inner')) {
                var stateChoicesWrap = this.regionStateField.parentElement.parentElement;
                if (window.hasOwnProperty('choices_vars') && window.choices_vars.hasOwnProperty(stateChoicesWrap.className.replace(/[ -]/g, "_"))) {
                    this.regionStateChoices = window.choices_vars[stateChoicesWrap.className.replace(/[ -]/g, "_")];
                }
            }
        }

        if (this.config.districtFieldName) {
            this._initNode('regionDistrictField', '[name="'+this.config.districtFieldName+'"]');
            if (this.regionDistrictField && this.regionDistrictField.parentElement.classList.contains('choices__inner')) {
                var districtChoicesWrap = this.regionDistrictField.parentElement.parentElement;
                if (window.hasOwnProperty('choices_vars') && window.choices_vars.hasOwnProperty(districtChoicesWrap.className.replace(/[ -]/g, "_"))) {
                    this.regionDistrictChoices = window.choices_vars[districtChoicesWrap.className.replace(/[ -]/g, "_")];
                }
            }
        }

        if (this.config.cityFieldName) {
            this._initNode('regionCityField', '[name="'+this.config.cityFieldName+'"]');
            if (this.regionCityField && this.regionCityField.parentElement.classList.contains('choices__inner')) {
                var cityChoicesWrap = this.regionCityField.parentElement.parentElement;
                if (window.hasOwnProperty('choices_vars') && window.choices_vars.hasOwnProperty(cityChoicesWrap.className.replace(/[ -]/g, "_"))) {
                    this.regionCityChoices = window.choices_vars[cityChoicesWrap.className.replace(/[ -]/g, "_")];
                }
            }
        }
    }

    _registerObservers() {
        this.searchField.addEventListener('input', (event) => this.onSearchInputObserver(event));

        if (this.mapModal && this.openModalBut) {
            this.openModalBut.addEventListener('click', (event) => this.openModalMapObserver(event));
        }

        if (this.config.withCoordinates) {
            if (this.coordLat) {
                this.coordLat.addEventListener('input', (event) => this.onLatInputObserver(event));
                this.coordLat.addEventListener('keydown', (event) => this.onCoordkeydownObserver(event));
                this.coordLat.addEventListener('paste', (event) => this.onCoordPasteObserver(event));
            }
            if (this.coordLng) {
                this.coordLng.addEventListener('input', (event) => this.onLngInputObserver(event));
                this.coordLng.addEventListener('keydown', (event) => this.onCoordkeydownObserver(event));
                this.coordLng.addEventListener('paste', (event) => this.onCoordPasteObserver(event));
            }
            if (this.findAddressBut) {
                this.findAddressBut.addEventListener('click', (event) => this.findAddressObserver(event));
            }
        }

        if (this.config.withMap && this.mapModal) {
            this.mapModal.addEventListener('shown.bs.modal', (event)=> this.onModalMapShown(event));
            this.mapModal.addEventListener('hide.bs.modal', (event)=> this.onModalMapHide(event));

            window.addEventListener("resize", (event) => this.onWindowResize(event));

            if (this.mapLatInput) {
                this.mapLatInput.addEventListener('input', (event) => this.onLatInputObserver(event));
                this.mapLatInput.addEventListener('keydown', (event) => this.onMapCoordkeydownObserver(event));
            }
            if (this.coordLng) {
                this.mapLngInput.addEventListener('input', (event) => this.onLngInputObserver(event));
                this.mapLngInput.addEventListener('keydown', (event) => this.onMapCoordkeydownObserver(event));
            }
            if (this.mapSaveBut) {
                this.mapSaveBut.addEventListener('click', (event) => this.onClickModalSaveBut(event));
            }
        }

        if (this.regionDistrictField) {
            this.regionDistrictField.addEventListener('choices:loaded', (event) => this.onDistrictChoicesLoaded(event));
        }

        if (this.regionCityField) {
            this.regionCityField.addEventListener('choices:loaded', (event) => this.onCityChoicesLoaded(event));
        }
    }

    onDistrictChoicesLoaded(event) {
        this.fillRegionField(this.regionDistrictField, this.selectedAddressValues.district, this.regionDistrictChoices);
        if (this.hasOwnProperty('spinnerRegionFieldsLoad') && !this.selectedAddressValues.city) {
            this.spinnerRegionFieldsLoad.remove();
        }
    }

    onCityChoicesLoaded(event) {
        this.fillRegionField(this.regionCityField, this.cleanLocality(this.selectedAddressValues.city), this.regionCityChoices);
        if (this.hasOwnProperty('spinnerRegionFieldsLoad')) {
            this.spinnerRegionFieldsLoad.remove();
        }
    }

    openModalMapObserver(event) {
        event.preventDefault();

        if (this.mapModalInstance) {
            this.openModalMap();
        }
    }

    onCoordkeydownObserver(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            this.findAddressBut.click();
        }
    }

    onMapCoordkeydownObserver(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            this.findAddressBut.click();
        }
    }

    onLatInputObserver(event) {
        event.target.value = event.target.value.replace(/,/g, '.').replace(/\s/g,'');
        this.validateLatField(event.target);
    }

    onLngInputObserver(event) {
        event.target.value = event.target.value.replace(/,/g, '.').replace(/\s/g,'');
        this.validateLngField(event.target);
    }

    onCoordPasteObserver(event) {
        var clipboardData = event.clipboardData || window.clipboardData;
        var pastedData = clipboardData.getData('text');

        var coords = pastedData.split(',');
        if (coords.length === 2) {
            event.preventDefault();
            event.stopPropagation();

            this.coordLat.value = coords[0].replace(/,/g, '.').replace(/\s/g,'');
            this.coordLng.value = coords[1].replace(/,/g, '.').replace(/\s/g,'');
            this.validateLatField(event.target);
            this.validateLngField(event.target);
        }
    }

    findAddressObserver(event) {
        event.preventDefault();

        if (!this.validateLatField(this.coordLat) || !this.validateLngField(this.coordLng)) {
            return;
        }

        this.geoCodeRequest(''+this.coordLng.value.replace(/,/g, '.')+', '+this.coordLat.value.replace(/,/g, '.'), this.processGeoDecode.bind(this));
    }

    onSearchInputObserver(e) {
        if (this.config.showPrecision) {
            e.target.dataset.precision = '';
        }

        var sr = e.target.value;
        var srPrefix = '';

        if (e.target.value.length >= this.config.minSearchLen) {
            if (this.regionStateField) {
                var stateValue = this.extractValueFromField(this.regionStateField);
                if (stateValue.length) {
                    sr = sr.replace(stateValue + ', ', '');
                    srPrefix = stateValue + ', ';
                }
            }

            if (this.regionDistrictField) {
                var districtValue = this.extractValueFromField(this.regionDistrictField);
                if (districtValue.length) {
                    sr = sr.replace(districtValue + ', ', '');
                    srPrefix += districtValue + ', ';
                }
            }

            if (this.regionCityField) {
                var cityValue = this.extractValueFromField(this.regionCityField);
                if (cityValue.length && !sr.toLowerCase().includes(cityValue.toLowerCase())) {
                    srPrefix += cityValue + ', ';
                }
            }

            if (srPrefix.length) {
                sr = srPrefix + sr;
            }

            this.filledFlag = false;
            this.list.classList.add('show');
            this.searchRequest(sr);
        }
    }

    extractValueFromField(field) {
        var value = '';

        if (field.type === 'select-one' && field.selectedIndex >= 0) {
            value = field.options[field.selectedIndex]?.text;
        } else if (field.type === 'select-multiple') {
            var selectedOptions = field.selectedOptions;
            for (var i = 0; i < selectedOptions.length; i++) {
                value += selectedOptions[i].text + ',';
            }
        } else {
            value = field.value;
        }

        return value;
    }

    onModalMapShown(e) {
        this.resizeMap();
    }

    onModalMapHide(e) {
        if (document.activeElement) {
            document.activeElement.blur();
        }
    }

    onClickModalSaveBut(e) {
        this.saveMapGeoData();
        this.mapModalInstance.hide();
    }

    onWindowResize(e) {
        if (this.config.withMap && this.mapModalInstance && this.mapModal.classList.contains('show')) {
            this.resizeMap();
        }
    }

    fillSearchField(text, precision = '') {
        this.searchField.value = text;

        if (this.config.showPrecision && precision.length) {
            this.searchField.dataset.precision = precision;
        }
    }

    getApiParams() {
        var params = new URLSearchParams(this.config.api);
        params.append('apikey', this.config.apiKey);
        if (!this.config.api.hasOwnProperty('sessiontoken')) {
            params.append('sessiontoken', this.getApiSessionToken());
        }

        return params;
    }

    getApiSessionToken() {

        var token = this.getCookieValue('geo-suggest-api-token');
        if (!token.length) {
            token = this._randomString(15);
            document.cookie = "geo-suggest-api-token="+token+"; path=/; max-age=3600";
        }

        return token;
    }

    getApiUrl() {
        var apiUrl = new URL(this.config.apiUrl);
        apiUrl.search = this.getApiParams().toString();

        return apiUrl;
    }

    searchRequest(str) {
        var apiUrl = this.getApiUrl();
        apiUrl.searchParams.append('text', str);

        fetch(apiUrl.toString())
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error occurred!')
                }

                return response.json()
            })
            .then(suggestions => this.fillList(suggestions.results))
            .catch((err) => {
                console.log(err)
            });
    }

    fillList(suggestions) {
        var self = this;

        var list = document.createElement("ul");
        if (suggestions !== undefined) {
            suggestions.forEach((suggest) => {
                var li = document.createElement("li");
                var sugText = '';
                if (suggest.hasOwnProperty('address') && suggest.address.hasOwnProperty('formatted_address')) {
                    li.textContent = suggest.address.formatted_address;
                    li.dataset.searchValue = suggest.address.formatted_address;
                } else {
                    li.textContent = suggest.title.text;
                    li.dataset.searchValue = suggest.title.text;
                }

                if (suggest.hasOwnProperty('address') && suggest.address.hasOwnProperty('component')) {
                    var stateHandled = false;
                    var districtHandled = false;
                    var cityHandled = false;
                    var fValue = '';
                    suggest.address.component.forEach((item) => {
                        if (item.kind[0] === "COUNTRY") {
                            return;
                        }

                        if (item.kind[0] === "PROVINCE") {
                            if (!stateHandled) {
                                li.dataset.addressState = item.name;
                                fValue += item.name + ', ';
                                stateHandled = true;
                            }

                            return;
                        }

                        if (item.kind[0] === "AREA") {
                            if (!districtHandled) {
                                li.dataset.addressDistrict = item.name;
                                fValue += item.name + ', ';
                                districtHandled = true;
                            }

                            return;
                        }

                        if (item.kind[0] === "LOCALITY") {
                            if (!cityHandled) {
                                li.dataset.addressCity = item.name;
                                fValue += item.name + ', ';
                                cityHandled = true;
                            }

                            return;
                        }

                        fValue += item.name + ', ';
                    });

                    fValue = fValue.replace(/,\s*$/, '');
                    li.dataset.searchValue = fValue;
                }

                if (suggest.hasOwnProperty('distance')) {
                    li.dataset.distance = suggest.distance.text;
                    li.setAttribute('title', suggest.distance.text)
                }

                if (suggest.hasOwnProperty('uri')) {
                    li.dataset.uri = suggest.uri;
                }

                li.addEventListener("click", function(e) {
                    self.filledFlag = true;
                    self.list.classList.remove('show');

                    if (e.target.dataset.hasOwnProperty('uri')) {
                        var uri = e.target.dataset.uri;
                        self.geoCodeRequestByUri(uri, self.processGeoCode.bind(self));
                    }

                    if (self.config.withMap && self.mapAddressInput) {
                        self.mapAddressInput.value = e.target.dataset.searchValue;
                    }

                    self.fillSearchField(e.target.dataset.searchValue);
                });

                list.appendChild(li);
            });
        }

        this.list.innerHTML = '';
        this.list.appendChild(list);
    }

    fillRegionField(field, value, fieldChoices) {
        if (field.type === 'select-one') {
            var fieldValue = '';
            var fieldOptions = field.options;
            for (var i = 0; i < fieldOptions.length; i++) {
                if (fieldOptions[i].text === value) {
                    fieldValue = fieldOptions[i].value;
                    field.selectedIndex = i;
                    break;
                }
            }

            if (fieldChoices) {
                var currentChoices = fieldChoices.getValue();
                if (currentChoices?.label !== value) {
                    fieldChoices.setChoiceByValue(fieldValue);
                }

                fieldChoices.passedElement.element.dispatchEvent(
                    new Event('change', { bubbles: true })
                );
            }
        } else {
            field.value = value;
        }
    }

    fillCoords(lat, lng, precision = '') {
        if (this.coordLng) {
            this.coordLng.value = lng;
        }

        if (this.coordLat) {
            this.coordLat.value = lat;
        }

        if (this.config.showPrecision && precision.length && this.coordsWrapper) {
            this.coordsWrapper.dataset.precision = precision;
        }
    }


    isLatValid(lat) {
        return lat.length && this._regexLat.test(lat)
    }

    isLngValid(lng) {
        return lng.length && this._regexLng.test(lng)
    }

    validateLatField(elem) {
        if (!this.isLatValid(elem.value)) {
            elem.classList.add('is-invalid');
            return false;
        } else if (elem.classList.contains('is-invalid')) {
            elem.classList.remove('is-invalid');
        }

        return true;
    }

    validateLngField(elem) {
        if (!this.isLngValid(elem.value)) {
            elem.classList.add('is-invalid');
            return false;
        } else if (elem.classList.contains('is-invalid')) {
            elem.classList.remove('is-invalid');
        }

        return true;
    }

    /**
     * Return List of geo objects
     *
     * @param response
     * @returns {{length}|*|*[]}
     */
    processGeoResponse(response) {
        if (!response.hasOwnProperty('GeoObjectCollection')) {
            return [];
        }

        if (!response.GeoObjectCollection.hasOwnProperty('featureMember') || !response.GeoObjectCollection.featureMember.length) {
            return [];
        }

        return response.GeoObjectCollection.featureMember;
    }

    getFirstGeoObject(response) {
        var list = this.processGeoResponse(response);
        if (!list.length) {
            return false;
        }

        return list[0];
    }

    processGeoCode(response) {
        var item = this.getFirstGeoObject(response);

        var pos = item?.GeoObject?.Point?.pos;
        if (pos && this.config.withCoordinates) {
            var coords = pos.split(' ');
            var lng = coords[0];
            var lat = coords[1];

            var precision = item?.GeoObject?.metaDataProperty?.GeocoderMetaData?.precision;

            this.fillCoords(lat, lng, precision ? precision : '');
        }

        var addressComponents = item?.GeoObject?.metaDataProperty?.GeocoderMetaData?.Address?.Components;
        if (!addressComponents || !addressComponents.length) {
            return;
        }

        var state = "";
        var district = "";
        var city = "";
        addressComponents.forEach((item) => {
            if (item.kind === "province" && !state.length) {
                state = item.name;
                return;
            }

            if (item.kind === "area" && !district.length) {
                district = item.name;
                return;
            }

            if (item.kind === "locality" && !city.length) {
                city = item.name;
                return;
            }
        });

        this.selectedAddressValues = {
            state: state,
            district: district,
            city: city
        }

        if (this.regionStateField && state.length) {
            if (typeof makeSpinner === "function") {
                this.spinnerRegionFieldsLoad = makeSpinner();
                document.querySelector('#main')?.appendChild(this.spinnerRegionFieldsLoad);
            }

            this.fillRegionField(this.regionStateField, state, this.regionStateChoices);
        }
    }

    getAddressFromGeoObject(geoObject) {
        var geocodeMetaData = geoObject?.GeoObject?.metaDataProperty?.GeocoderMetaData;
        if (!geocodeMetaData) {
            return {};
        }

        var address = '';

        var addressComponents = geocodeMetaData?.Address?.Components;
        if (addressComponents && addressComponents.length) {

            var stateHandled = false;
            var districtHandled = false;
            var cityHandled = false;

            var state = "";
            var district = "";
            var city = "";

            addressComponents.forEach((item) => {
                if (item.kind === "country") {
                    return;
                }

                if (item.kind === "province") {
                    if (!stateHandled) {
                        address += item.name + ', ';
                        state = item.name;
                        stateHandled = true;
                    }

                    return;
                }

                if (item.kind === "area") {
                    if (!districtHandled) {
                        address += item.name + ', ';
                        district = item.name;
                        districtHandled = true;
                    }

                    return;
                }

                if (item.kind === "locality") {
                    if (!cityHandled) {
                        address += item.name + ', ';
                        city = item.name;
                        cityHandled = true;
                    }

                    return;
                }

                address += item.name + ', ';
            });

            address = address.replace(/,\s*$/, '');

        } else {
            address = geocodeMetaData?.text;
        }

        return {
            address: address,
            precision: geocodeMetaData?.precision,
            state: state,
            district: district,
            city: city,

        };
    }

    processGeoDecode(response) {
        var item = this.getFirstGeoObject(response);
        var adrData = this.getAddressFromGeoObject(item);

        this.fillSearchField(adrData?.address, adrData?.precision);

        this.selectedAddressValues = {
            state: adrData?.state,
            district: adrData?.district,
            city: adrData?.city
        }

        if (this.regionStateField && adrData?.state.length) {
            this.fillRegionField(this.regionStateField, adrData?.state, this.regionStateChoices);
        }
    }

    getGeoCodeApiParams() {
        var params = new URLSearchParams();
        params.append('apikey', this.config.map.apiKey);
        params.append('lang', this.config.map.lang);
        if (this.config.api.hasOwnProperty('bbox')) {
            params.append('bbox', this.config.api.bbox);
        }
        params.append('format', 'json');

        return params;
    }

    getGeoCodeApiUrl() {
        var apiUrl = new URL(this.config.map.geoCodeUrl);
        apiUrl.search = this.getGeoCodeApiParams().toString();

        return apiUrl;
    }

    geoCodeRequestByUri(uri, callback) {
        var apiUrl = this.getGeoCodeApiUrl();
        apiUrl.searchParams.append('uri', uri);

        fetch(apiUrl.toString())
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error occurred!')
                }

                return response.json()
            })
            .then(result => callback(result.response))
            .catch((err) => {
                console.error(err)
            });
    }

    geoCodeRequest(code, callback, params) {
        var apiUrl = this.getGeoCodeApiUrl();
        apiUrl.searchParams.append('geocode', code);

        if (params) {
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    apiUrl.searchParams.set(key, params[key]);
                }
            }
        }

        fetch(apiUrl.toString())
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Error occurred!')
                }

                return response.json()
            })
            .then(result => callback(result.response))
            .catch((err) => {
                console.error(err)
            });
    }

    getCookieValue(name) {
        const regex = new RegExp(`(^| )${name}=([^;]+)`)
        const match = document.cookie.match(regex)
        return (match) ? match[2] : '';
    }

    openModalMap() {
        this.mapModalInstance.show();

        if (this.searchField.value.length) {
            this.mapAddressInput.value = this.searchField.value;
            this.geoCodeRequest(this.searchField.value, this.processCoordsAndRenderMap.bind(this));
        } else {
            this.renderMap(this.config.map.center.lat, this.config.map.center.lng);
        }
    }

    processCoordsAndRenderMap(response) {
        var item = this.getFirstGeoObject(response);

        if (!item.hasOwnProperty('GeoObject') || !item.GeoObject.hasOwnProperty('Point')) {
            return;
        }

        var pos = item.GeoObject.Point.pos;
        var coords = pos.split(' ');
        var lng = coords[0];
        var lat = coords[1];

        this.renderMap(lat, lng);
        this.satMapCoordValues(coords);
    }

    async initMap(centerLat, centerLng) {
        await ymaps3.ready;
        const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapListener, YMapFeature} = ymaps3;
        this.ymaps3 = ymaps3;

        var mapConfig = {
            location: {
                center: [centerLng, centerLat],
                zoom: 10
            }
        };

        this.map = new YMap(this.mapContainer, mapConfig);

        this.mapEntities.YMapDefaultSchemeLayer = new YMapDefaultSchemeLayer();
        this.mapEntities.YMapDefaultFeaturesLayer = new YMapDefaultFeaturesLayer();
        this.mapEntities.YMapFeature = YMapFeature;

        this.map.addChild(this.mapEntities.YMapDefaultSchemeLayer);
        this.map.addChild(this.mapEntities.YMapDefaultFeaturesLayer);

        const markerContainerElement = document.createElement('div');
        markerContainerElement.classList.add('marker-container');

        const markerInner = document.createElement('div');
        markerInner.classList.add('marker-inner');
        markerContainerElement.appendChild(markerInner);

        const markerText = document.createElement('div');
        markerText.classList.add('marker-text');
        markerInner.appendChild(markerText);

        this.mapMarker = new YMapMarker(
            {
                coordinates: [centerLng, centerLat],
                draggable: true,
                onDragMove: this.onDragMarkerHandler.bind(this)
            },
            markerContainerElement
        );

        this.map.addChild(this.mapMarker);

        this.map.addChild(
            new YMapListener({
                onClick: this.onMapClickHandler.bind(this),
            })
        );

        if (this.config.api.hasOwnProperty('bbox') && this.config.api.bbox.length) {
            // var bbox = this.config.api.bbox.split('~');
            // if (bbox.length < 2) {
            //     bbox = this.config.api.bbox.split(',');
            //     bbox = [bbox[0]+','+bbox[1], bbox[2]+''+bbox[3]];
            // }
            //
            // var leftBottom = bbox[0].split(',');
            // var rightTop = bbox[1].split(',');
            // var leftTop = [leftBottom[0], rightTop[1]];
            // var rightBottom = [rightTop[0], leftBottom[1]];
            //
            // var lines = [
            //     [leftBottom, leftTop],
            //     [leftTop, rightTop],
            //     [rightTop, rightBottom],
            //     [rightBottom, leftBottom]
            // ];

            var bboxCoordinates = this.parseBbox(this.config.api.bbox);

            var lines = [
                [bboxCoordinates.leftBottom, bboxCoordinates.leftTop],
                [bboxCoordinates.leftTop, bboxCoordinates.rightTop],
                [bboxCoordinates.rightTop, bboxCoordinates.rightBottom],
                [bboxCoordinates.rightBottom, bboxCoordinates.leftBottom]
            ];

            for (let i = 0; i < lines.length; i++) {
                var line = new YMapFeature({
                    id: 'border_line_'+i,
                    // source: 'featureSource',
                    geometry: {
                        type: 'LineString',
                        coordinates: lines[i]
                    },
                    style: {
                        stroke: [{width: 3, color: 'rgb(255 117 117)'}]
                    }
                });

                this.map.addChild(line);
            }
        }
    }

    parseBbox(bboxStr) {
        var bbox = bboxStr.split('~');
        if (bbox.length < 2) {
            bbox = bboxStr.split(',');
            bbox = [bbox[0]+','+bbox[1], bbox[2]+''+bbox[3]];
        }

        var leftBottom = bbox[0].split(',');
        var rightTop = bbox[1].split(',');
        var leftTop = [leftBottom[0], rightTop[1]];
        var rightBottom = [rightTop[0], leftBottom[1]];

        return {
            leftBottom: leftBottom,
            rightTop: rightTop,
            leftTop: leftTop,
            rightBottom: rightBottom,
        }
    }

    onDragMarkerHandler(coords) {
        this.mapMarker.update({coordinates: coords});
        this.setNewGeoValues(coords);
    }

    onMapClickHandler(object, event) {
        this.mapMarker.update({coordinates: event.coordinates});
        this.setNewGeoValues(event.coordinates);
    }

    setNewGeoValues(coordinates) {
        this.satMapCoordValues(coordinates);
        this.geoCodeRequest(coordinates.join(', '), this.processGeoDecodeForMap.bind(this));
    }

    processGeoDecodeForMap(response) {
        var item = this.getFirstGeoObject(response);
        var adrData = this.getAddressFromGeoObject(item);

        this.mapAddressInput.value = adrData.address;
    }

    satMapCoordValues(coordinates) {
        if (this.mapCoordinatesBlock) {
            this.mapLatInput.value = coordinates[1];
            this.mapLngInput.value = coordinates[0];
        }
    }

    saveMapGeoData() {
        this.searchField.value = this.mapAddressInput.value;
        this.coordLat.value = this.mapLatInput.value
        this.coordLng.value = this.mapLngInput.value
    }

    resizeMap() {
        var mapModalBody = this.mapModal.querySelector('.modal-body');
        var modalBodyHeight = GeoSuggest.getElmInnerHeight(mapModalBody);
        var mapHeight = modalBodyHeight;
        for (const child of mapModalBody.children) {
            if (child != this.mapContainer) {
                mapHeight -= GeoSuggest.getElmOuterHeight(child);
            }
        }

        this.mapContainer.style.height = mapHeight+'px';
    }

    renderMap(centerLat, centerLng) {
        this.triggerEvent("onRenderMap", {lat: centerLat, lng: centerLng});

        if (!this.map) {
            this.initMap(centerLat, centerLng);
        } else {
            this.map.update({
                location: {
                    center: [centerLng, centerLat], // Центр карты.
                    zoom: 10,
                    duration: 200,
                    easing: 'ease-in-out'
                }
            });

            this.mapMarker.update({coordinates: [centerLng, centerLat]});
        }

        this.triggerEvent("onRenderedMap");
    }

    triggerEvent(event, data) {
        var hooks = this.config.events[event];
        if (hooks !== undefined && hooks.length > 0) {
            for (var i = 0; hooks[i] && i < hooks.length; i++)
                hooks[i](this, data);
        }
    }

    cleanLocality(text) {
        const regex = /^(аг\.|агрогородок|г\.п\.|гп|горпос[её]лок|р\.п\.|рп|рабпос[её]лок|к\.п\.|курортный\s+пос[её]лок|городской\s+пос[её]лок|г\.|город|пос\.|п\.|пос[её]лок|дер\.|д\.|деревня|в\.|село|с\.|х\.?|хутор|ст\.|станция)\s+/i
        return text?.replace(regex, '').trim();
    }

    _randomString(length) {
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = ' ';
        const charactersLength = characters.length;
        for ( let i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }

    static getElmOuterHeight(node) {
        const list = [
            'margin-top',
            'margin-bottom',
            'border-top',
            'border-bottom',
            'padding-top',
            'padding-bottom',
            'height'
        ]

        const style = window.getComputedStyle(node)
        return list
            .map(k => parseInt(style.getPropertyValue(k), 10))
            .reduce((prev, cur) => prev + cur)
    }

    static getElmInnerHeight(node) {
        var computedStyle = getComputedStyle(node);
        var elementHeight = node.clientHeight;  // height with padding
        elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

        return elementHeight;
    }

    static isDomElement(o) {
        return (
            typeof HTMLElement === "object"
                ? o instanceof HTMLElement
                : o && typeof o === "object" && true && o.nodeType === 1 && typeof o.nodeName === "string"
        );
    }

    static isPureObject(input) {
        return null !== input &&
            typeof input === 'object' &&
            Object.getPrototypeOf(input).isPrototypeOf(Object);
    }
}
