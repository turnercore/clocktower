import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const legalContentDir = path.join(process.cwd(), 'content', 'legal')

function resolveMarkdownHref(href?: string) {
  if (!href) return '#'
  if (href.startsWith('./') && href.endsWith('.md')) {
    return `/${href.slice(2, -3)}`
  }

  return href
}

export async function LegalMarkdownPage({ fileName }: { fileName: string }) {
  const markdown = await fs.readFile(path.join(legalContentDir, fileName), 'utf8')

  return (
    <article className='mx-auto mb-24 max-w-4xl px-4 py-10 text-left leading-7'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className='mb-6 text-4xl font-bold tracking-normal'>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className='mb-3 mt-10 text-2xl font-semibold tracking-normal'>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className='mb-2 mt-6 text-xl font-semibold tracking-normal'>
              {children}
            </h3>
          ),
          p: ({ children }) => <p className='my-4'>{children}</p>,
          ul: ({ children }) => (
            <ul className='my-4 list-disc space-y-2 pl-6'>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className='my-4 list-decimal space-y-2 pl-6'>{children}</ol>
          ),
          a: ({ href, children }) => {
            const resolvedHref = resolveMarkdownHref(href)
            if (resolvedHref.startsWith('/')) {
              return (
                <Link className='underline' href={resolvedHref}>
                  {children}
                </Link>
              )
            }

            return (
              <a
                className='underline'
                href={resolvedHref}
                rel='noreferrer'
                target='_blank'
              >
                {children}
              </a>
            )
          },
          table: ({ children }) => (
            <div className='my-6 overflow-x-auto'>
              <table className='w-full border-collapse text-sm'>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className='border border-border bg-muted px-3 py-2 text-left font-semibold'>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className='border border-border px-3 py-2 align-top'>
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-sm'>
              {children}
            </code>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  )
}
