<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_item_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_item_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('type');
            $table->jsonb('changes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['work_item_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('work_item_activities');
    }
};
