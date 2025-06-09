<?php

namespace Bulbalara\GeoSuggest;

use OpenAdmin\Admin\Admin;
use OpenAdmin\Admin\Form;

class ServiceProvider extends \Illuminate\Support\ServiceProvider
{
    public function boot(GeoSuggestExtension $extension): void
    {
        if (!GeoSuggestExtension::boot()) {
            return;
        }

        if ($views = $extension->views()) {
            $this->loadViewsFrom($views, 'bl.geo-sg');
        }

        if ($this->app->runningInConsole()) {
            if ($assets = $extension->assets()) {
                $this->publishes(
                    [$assets => public_path('vendor/open-admin-ext/geo-suggest')],
                    'bl.geo-sg'
                );
            }
            $this->publishes([__DIR__.'/../resources/lang' => $this->app->langPath('vendor/bl.geo-sg')], 'bl.geo-sg');
        }

        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'bl.geo-sg');

        Admin::booting(function () {
            Admin::css('vendor/open-admin-ext/geo-suggest/css/geo-suggest.css', false); // prevent minifying (last arg)
            Admin::js('vendor/open-admin-ext/geo-suggest/js/geo-suggest.js', false); // prevent minifying (last arg)
            Form::extend('geoSuggest', GeoSuggestField::class);
        });
    }
}
