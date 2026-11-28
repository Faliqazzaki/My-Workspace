<?php

namespace App\Services\News;

class DnsHostResolver implements HostResolver
{
    public function resolve(string $host): array
    {
        $addresses = [];

        $records = @dns_get_record($host, DNS_A + DNS_AAAA);

        if (is_array($records)) {
            foreach ($records as $record) {
                if (! empty($record['ip'])) {
                    $addresses[] = $record['ip'];
                }

                if (! empty($record['ipv6'])) {
                    $addresses[] = $record['ipv6'];
                }
            }
        }

        if ($addresses === []) {
            foreach ((array) @gethostbynamel($host) as $ip) {
                $addresses[] = $ip;
            }
        }

        return array_values(array_unique($addresses));
    }
}
