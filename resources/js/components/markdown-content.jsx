import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

/**
 * Render Markdown yang aman.
 *
 * `react-markdown` tidak merender HTML mentah secara default dan
 * `rehype-sanitize` menjadi lapisan pengaman tambahan, sehingga konten
 * catatan tidak bisa menyisipkan script atau atribut berbahaya.
 */
export default function MarkdownContent({ content = '', className }) {
    return (
        <div className={cn('markdown-body text-sm text-foreground', className)}>
            <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
            >
                {content}
            </Markdown>
        </div>
    );
}
