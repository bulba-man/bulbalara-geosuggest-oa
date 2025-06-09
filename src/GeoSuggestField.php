<?php

namespace Bulbalara\GeoSuggest;

use Illuminate\Support\Str;
use OpenAdmin\Admin\Admin;
use OpenAdmin\Admin\Form\Field;
use OpenAdmin\Admin\Form\Field\Text;

class GeoSuggestField extends Field
{
    protected $icon = 'icon-location-arrow';
    protected $view = 'bl.geo-sg::geosuggest';

    protected $wrapperClass = 'geo-suggest-wrapper';
    protected $fieldClass = 'geo-suggest-field';
    protected $listClass = 'geo-suggest-list';

    protected $config = [];

    /**
     * @var bool
     */
    protected $withMap = false;

    /**
     * @var bool
     */
    protected $withCoordinates = false;

    /**
     * @var bool
     */
    protected $showPrecision = false;

    /**
     * Column name.
     *
     * @var array|string
     */
    protected $column;
    /**
     * @var mixed|true
     */

    /**
     * @var bool
     */
    protected $asTextarea = false;

    public function __construct($column = '', $arguments = [])
    {
        $baseName = (str_contains($column, '.')) ? Str::beforeLast($column, '.').'.' : $column.'_';

        $this->column['address'] = $this->formatColumn($column);
        $this->column['lat'] = $baseName.'lat';
        $this->column['lng'] = $baseName.'lng';

        $this->label = $this->formatLabel($arguments);
        $this->id = $this->formatId($this->column);
        $this->id['address'] = "geo_suggest_{$this->id['address']}_search_field";
    }

    public function config($key, $value = null)
    {
        if (is_null($value)) {
            return $this->config[$key];
        }

        $this->config[$key] = $value;

        return $this;
    }

    public function withMap($withMap = true)
    {
        $this->withMap = $withMap;

        return $this;
    }

    public function withCoordinates($withCoordinates = true)
    {
        $this->withCoordinates = $withCoordinates;

        return $this;
    }

    public function showPrecision($showPrecision = true)
    {
        $this->showPrecision = $showPrecision;

        return $this;
    }

    public function setCoordinatesName($name)
    {
        $this->column['lat'] = $name.'[lat]';
        $this->column['lng'] = $name.'[lng]';

        return $this;
    }

    public function setCoordinateLatName($name)
    {
        $this->column['lat'] = $name;

        return $this;
    }

    public function setCoordinateLngName($name)
    {
        $this->column['lng'] = $name;

        return $this;
    }

    public function asTextarea($asTextarea = true)
    {
        $this->asTextarea = $asTextarea;

        return $this;
    }

    public function getElementClass(): array
    {
        $elementClass = parent::getElementClass();
        $elementClass[] = $this->fieldClass;

        return $elementClass;
    }

    public function getScriptVarName($field = false)
    {
        if (empty($field)) {
            $field = str_replace([' ', '-'], ['_', '_'], $this->getElementClassString());
        }

        $field = (is_array($field)) ? implode('_', $field) : $field;

        return 'geoSuggest_'.$field;
    }

    public static function getAssets()
    {
        $assets = [];
        if (config('admin.extensions.bulbalara-geo-suggest.api.map.apiKey')) {
            $apiKey = config('admin.extensions.bulbalara-geo-suggest.api.map.apiKey');
            $lang = config('admin.extensions.bulbalara-geo-suggest.api.map.lang');
            $assets ['js'] = 'https://api-maps.yandex.ru/v3/?apikey='.$apiKey.'&lang='.$lang;
        }

        return $assets;
    }

    public function variables(): array
    {
        $this->variables = array_merge($this->variables, [
            'withMap' => $this->withMap,
            'withCoordinates' => $this->withCoordinates,
            'showPrecision' => $this->showPrecision,
            'asTextarea' => $this->asTextarea,
            'modalId' => "modal_map_{$this->id['address']}"
        ]);

        return parent::variables();
    }

    public function fill($data)
    {
        parent::fill($data);
    }

    public function render()
    {
        $configs = (array) GeoSuggestExtension::config('api');
        $configs['withMap'] = $this->withMap;
        $configs['withCoordinates'] = $this->withCoordinates;
        $configs['showPrecision'] = $this->showPrecision;
        $configs['modalMapSelector'] = "#modal_map_{$this->id['address']}";

        $configs = json_encode(array_merge($configs, $this->config));

        $script = <<<JS
            var {$this->getScriptVarName()} = new GeoSuggest('#{$this->id['address']}', {$configs});

JS;


        Admin::script($script);


        return parent::render();
    }
}
