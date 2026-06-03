<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kept as a compatibility migration because the base users migration
        // already creates this table in fresh installs.
        if (Schema::hasTable('password_reset_tokens')) {
            return;
        }
    }

    public function down(): void
    {
        // No-op: the table ownership belongs to the base users migration.
    }
};
