<?php

namespace Database\Factories;

use App\Models\NewsSource;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NewsSource>
 */
class NewsSourceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->sentence(3),
            'url' => fake()->unique()->url(),
            'type' => NewsSource::TYPES[0],
            'enabled' => true,
            'last_fetched_at' => null,
        ];
    }

    public function disabled(): static
    {
        return $this->state(fn () => ['enabled' => false]);
    }
}
