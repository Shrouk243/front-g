<?php

$defaultOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
];

$configuredOrigins = (string) env('CORS_ALLOWED_ORIGINS', '');
$originMatches = [];
preg_match_all('/https?:\/\/[^,\]\)\s]+/', $configuredOrigins, $originMatches);

$allowedOrigins = array_values(array_unique(array_filter([
    ...$defaultOrigins,
    ...($originMatches[0] ?? []),
    env('FRONTEND_APP_URL'),
])));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
