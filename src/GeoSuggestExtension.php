<?php

namespace Bulbalara\GeoSuggest;

use OpenAdmin\Admin\Extension;

class GeoSuggestExtension extends Extension
{
    public $name = 'bulbalara-geo-suggest';

    public $views = __DIR__.'/../resources/views';

    public $assets = __DIR__.'/../resources/assets';
}
