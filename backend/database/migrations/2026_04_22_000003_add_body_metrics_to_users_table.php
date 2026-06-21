<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('height_cm')->nullable()->after('chronic_conditions');
            $table->unsignedSmallInteger('weight_kg')->nullable()->after('height_cm');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['height_cm', 'weight_kg']);
        });
    }
};
