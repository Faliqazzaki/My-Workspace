<?php

namespace Database\Factories;

use App\Models\NewsArticle;
use App\Models\NewsSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsArticle>
 */
class NewsArticleFactory extends Factory
{
    public function definition(): array
    {
        $url = fake()->unique()->url();

        return [
            'news_source_id' => NewsSource::factory(),
            'title' => fake()->sentence(6),
            'url' => $url,
            'url_hash' => hash('sha256', $url),
            'excerpt' => fake()->sentence(),
            'content' => null,
            'published_at' => fake()->dateTimeBetween('-30 days'),
            'summary' => null,
            'summary_generated_at' => null,
            'status' => NewsArticle::STATUSES[0],
            'selected_date' => null,
            'metadata' => null,
        ];
    }
}
