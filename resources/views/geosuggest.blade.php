@if(!empty($inline))
    <div class="col-auto">
        @else
            @if (!empty($showAsSection))
                <div class="row has-many-head">
                    <h4>{{ $label }}</h4>
                </div>
                <hr class="form-border">
            @endif

            <div class="{{$viewClass['form-group']}} {!! !$errors->has($errorKey) ? '' : 'has-error' !!}">
                <label for="{{$id['address']}}" class="{{$viewClass['label']}} form-label">@if (empty($showAsSection)){{$label}}@endif</label>
                <div class="{{$viewClass['field']}}">
                    @include('admin::form.error')
                    @endif

<div class="input-group geo-suggest-wrapper @if($asTextarea) view-textarea @endif">
    @if($asTextarea)
        <textarea name="{{$name['address']}}" id="{{$id['address']}}" class="form-control geo-suggest-field {{$class['address']}}" autocomplete="off" {!! $attributes !!} >{{ old($column['address'], $value['address'] ?? null) }}</textarea>
    @else
        <input type="text" name="{{$name['address']}}" id="{{$id['address']}}" value="{{ old($column['address'], $value['address'] ?? null) }}" class="form-control geo-suggest-field {{$class['address']}}" autocomplete="off" {!! $attributes !!} />
    @endif

    @if ($withMap)
    <button class="btn btn-outline-secondary open-map" type="button" data-bs-toggle="tooltip" title="{{__('bl.geo-sg::lang.map_button_text')}}">
        <i class="fas icon-map-marked-alt"></i>
    </button>
    @endif
    <div class="geo-suggest-block">
        <div class="geo-suggest-list">
        </div>
    </div>
    @if ($withCoordinates)
    <div class="input-group geo-suggest-coords">
        <span class="input-group-text">{{__('bl.geo-sg::lang.coords_label')}}</span>
        <div class="form-control wrap">
            <input type="text" class="form-control coord-value coords-lat" name="{{$name['lat']}}" value="{{ old($column['lat'], $value['lat'] ?? null) }}" placeholder="{{__('bl.geo-sg::lang.lat_label')}}" title="{{__('bl.geo-sg::lang.lat_label')}}">
            <span class="help-block"><i class="icon-info-circle"></i> -90° &ndash; +90°</span>
        </div>
        <div class="form-control wrap">
            <input type="text" class="form-control coord-value coords-lng" name="{{$name['lng']}}" value="{{ old($column['lng'], $value['lng'] ?? null) }}" placeholder="{{__('bl.geo-sg::lang.lng_label')}}" title="{{__('bl.geo-sg::lang.lng_label')}}">
            <span class="help-block"><i class="icon-info-circle"></i> -180° &ndash; +180°</span>
        </div>
        <button class="btn btn-outline-secondary find-address" type="button" data-bs-toggle="tooltip" title="{{__('bl.geo-sg::lang.coord_search_text')}}"><i class="fas icon-location-arrow"></i></button>
    </div>
    @endif
    @if($showPrecision)
    <div class="geo-suggest-precision-info">
        <span class="item precision-exact">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.exact')}}</span>
        </span>
        <span class="item precision-number">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.number')}}</span>
        </span>
        <span class="item precision-near">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.near')}}</span>
        </span>
        <span class="item precision-range">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.range')}}</span>
        </span>
        <span class="item precision-street">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.street')}}</span>
        </span>
        <span class="item precision-other">
            <span class="color"></span>
            <span class="text">{{__('bl.geo-sg::lang.precisions.other')}}</span>
        </span>
    </div>
    @endif
</div>
@if ($withMap)
{{--    <script src="https://api-maps.yandex.ru/v3/?apikey={{config('admin.extensions.bulbalara-geo-suggest.api.map.apiKey')}}&lang={{config('admin.extensions.bulbalara-geo-suggest.api.map.lang')}}"></script>--}}

    <div class="modal fade geo-suggest-modal-map" id="modal_map_{{$id['address']}}" tabindex="-1">
        <div class="modal-dialog modal-fullscreen">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="{{ __('admin.close') }}"></button>
                </div>
                <div class="modal-body">
                    <div class="map-address">
                        <input type="text" class="form-control text-center" id="map_{{$id['address']}}" readonly>
                    </div>
                    <div class="map-coordinates row justify-content-center">
                        <div class="lat item col-auto">
                            <label class="form-label label">{{__('bl.geo-sg::lang.lat_label')}}</label>
                            <input type="text" class="form-control value" readonly>
                        </div>
                        <div class="lng item col-auto">
                            <label class="form-label label">{{__('bl.geo-sg::lang.lng_label')}}</label>
                            <input type="text" class="form-control value" readonly>
                        </div>
                    </div>
                    <div class="map-container"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="save-geo-data btn btn-primary">{{ __('admin.save') }}</button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ __('admin.cancel') }}</button>

                </div>
            </div>
        </div>
    </div>
@endif
@include("admin::form._footer")
