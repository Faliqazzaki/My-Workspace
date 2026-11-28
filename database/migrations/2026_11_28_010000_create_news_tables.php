<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('news_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('url')->unique();
            $table->string('type')->default('rss');
            $table->boolean('enabled')->default(true);
            $table->timestamp('last_fetched_at')->nullable();
            $table->timestamps();
        });

        Schema::create('news_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('news_source_id')
                ->constrained('news_sources')
                ->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('url');
            $table->char('url_hash', 64)->unique();
            $table->text('excerpt')->nullable();
            $table->text('content')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->text('summary')->nullable();
            $table->timestamp('summary_generated_at')->nullable();
            $table->string('status')->default('new');
            $table->date('selected_date')->nullable();
            $table->jsonb('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'selected_date']);
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_articles');
        Schema::dropIfExists('news_sources');
    }
};
