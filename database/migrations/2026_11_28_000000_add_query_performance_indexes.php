<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Index untuk query dashboard yang terbukti memakai sequential scan
     * pada data sintetis 5.000 baris (lihat docs/query-review.md).
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->index('created_at', 'notes_created_at_idx');
        });

        Schema::table('work_items', function (Blueprint $table) {
            $table->index('completed_at', 'work_items_completed_at_idx');
        });

        // Index parsial dipakai notifikasi, agenda, dan hitungan terlambat.
        // Dibuat hanya di PostgreSQL; SQLite tidak memerlukannya untuk test.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                "CREATE INDEX work_items_open_due_date_idx ON work_items (due_date) WHERE status <> 'done'",
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS work_items_open_due_date_idx');
        }

        Schema::table('work_items', function (Blueprint $table) {
            $table->dropIndex('work_items_completed_at_idx');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_created_at_idx');
        });
    }
};
