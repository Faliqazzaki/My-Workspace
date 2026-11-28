<?php

namespace App\Services\News;

use Carbon\CarbonImmutable;
use SimpleXMLElement;

class FeedParser
{
    public const MAX_ITEMS = 50;

    /**
     * @return array<int, array{title: string, url: string, excerpt: ?string, published_at: ?string}>
     */
    public function parse(string $xml): array
    {
        $previous = libxml_use_internal_errors(true);

        try {
            // LIBXML_NONET mencegah akses jaringan; LIBXML_NOENT sengaja tidak dipakai.
            $root = simplexml_load_string($xml, SimpleXMLElement::class, LIBXML_NONET);

            if ($root === false) {
                throw new FeedFetchException(null, 'Respons XML tidak valid.');
            }

            return array_slice($this->items($root), 0, self::MAX_ITEMS);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }

    /**
     * @return array<int, array{title: string, url: string, excerpt: ?string, published_at: ?string}>
     */
    private function items(SimpleXMLElement $root): array
    {
        $items = [];

        if (isset($root->channel->item)) {
            foreach ($root->channel->item as $item) {
                $items[] = $this->item(
                    $this->text($item->title ?? null),
                    $this->text($item->link ?? null),
                    $this->text($item->description ?? null),
                    $this->text($item->pubDate ?? null),
                );
            }
        } elseif (isset($root->entry)) {
            foreach ($root->entry as $entry) {
                $items[] = $this->atomItem($entry);
            }
        } else {
            $atom = $root->children('http://www.w3.org/2005/Atom');

            foreach ($atom->entry as $entry) {
                $items[] = $this->atomItem($entry);
            }
        }

        return array_values(array_filter($items));
    }

    private function atomItem(SimpleXMLElement $entry): ?array
    {
        $link = null;

        foreach ($entry->link as $candidate) {
            $rel = (string) ($candidate['rel'] ?? 'alternate');
            $href = (string) ($candidate['href'] ?? '');

            if (($rel === '' || $rel === 'alternate') && $href !== '') {
                $link = $href;
                break;
            }
        }

        return $this->item(
            $this->text($entry->title ?? null),
            $this->text($link),
            $this->text($entry->summary ?? $entry->content ?? null),
            $this->text($entry->published ?? $entry->updated ?? null),
        );
    }

    private function item(string $title, string $url, string $excerpt, string $date): ?array
    {
        $title = mb_substr($title, 0, 255);
        $excerpt = mb_substr($excerpt, 0, 500);

        if ($title === '' || ! NetworkTarget::isSafeUrl($url)) {
            return null;
        }

        return [
            'title' => $title,
            'url' => $url,
            'excerpt' => $excerpt !== '' ? $excerpt : null,
            'published_at' => $this->date($date),
        ];
    }

    private function text(mixed $node): string
    {
        if ($node === null) {
            return '';
        }

        $value = strip_tags((string) $node);
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim((string) preg_replace('/\s+/u', ' ', $value));
    }

    private function date(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        try {
            return CarbonImmutable::parse($value)->utc()->toDateTimeString();
        } catch (\Throwable) {
            return null;
        }
    }
}
