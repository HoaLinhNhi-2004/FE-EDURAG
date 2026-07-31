import type { Citation } from '@/types'

interface MarkdownMessageProps {
  content: string
  citations?: Citation[]
  onSelectCitation: (citation: Citation) => void
}

export function MarkdownMessage({
  content,
  citations,
  onSelectCitation,
}: MarkdownMessageProps) {
  
  const parseInline = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Match bold (**text**), italic (*text*), inline code (`code`), and citation ([1])
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[(\d+)\])/g
    let match
    let keyIdx = 0

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index

      // Push preceding text
      if (matchIndex > lastIndex) {
        parts.push(text.substring(lastIndex, matchIndex))
      }

      // Check which group matched
      if (match[2] !== undefined) {
        // Bold **text**
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900">
            {match[2]}
          </strong>
        )
      } else if (match[3] !== undefined) {
        // Italic *text*
        parts.push(
          <em key={keyIdx++} className="italic">
            {match[3]}
          </em>
        )
      } else if (match[4] !== undefined) {
        // Inline code `code`
        parts.push(
          <code key={keyIdx++} className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-indigo-600 border border-slate-200/50">
            {match[4]}
          </code>
        )
      } else if (match[5] !== undefined) {
        // Citation [1]
        const order = parseInt(match[5], 10)
        
        // Find citation by citationOrder or index + 1
        const citation = citations?.find(
          c => c.citationOrder === order || c.id === order
        ) || (citations && citations[order - 1])

        if (citation) {
          parts.push(
            <button
              key={keyIdx++}
              type="button"
              onClick={() => onSelectCitation(citation)}
              title={citation.sourceText || citation.documentTitle}
              className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold px-1 py-0.5 rounded text-[11px] cursor-pointer transition-colors mx-0.5 border border-indigo-100/50 align-baseline select-none"
            >
              [{order}]
            </button>
          )
        } else {
          // If citation context not found, keep [1]
          parts.push(
            <span key={keyIdx++} className="text-slate-400 select-none">
              [{order}]
            </span>
          )
        }
      }

      lastIndex = regex.lastIndex
    }

    // Push remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts
  }

  const parseBlocks = (text: string) => {
    const lines = text.split('\n')
    const blocks: React.ReactNode[] = []
    let currentList: React.ReactNode[] = []
    let listType: 'ul' | 'ol' | null = null
    let inCodeBlock = false
    let codeBlockLines: string[] = []

    const flushList = (key: number) => {
      if (currentList.length > 0) {
        if (listType === 'ul') {
          blocks.push(
            <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1">
              {...currentList}
            </ul>
          )
        } else {
          blocks.push(
            <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1">
              {...currentList}
            </ol>
          )
        }
        currentList = []
        listType = null
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          blocks.push(
            <pre key={`code-${i}`} className="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono my-2 overflow-x-auto border border-slate-800">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          )
          codeBlockLines = []
          inCodeBlock = false
        } else {
          // Start of code block
          flushList(i)
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        continue
      }

      const trimmed = line.trim()

      if (!trimmed) {
        flushList(i)
        continue
      }

      // Bullet list item
      const ulMatch = line.match(/^(\s*)([-*•])\s+(.+)$/)
      if (ulMatch) {
        if (listType !== 'ul') {
          flushList(i)
          listType = 'ul'
        }
        currentList.push(
          <li key={`li-${i}`} className="text-slate-700 text-sm leading-relaxed">
            {parseInline(ulMatch[3])}
          </li>
        )
        continue
      }

      // Numbered list item
      const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/)
      if (olMatch) {
        if (listType !== 'ol') {
          flushList(i)
          listType = 'ol'
        }
        currentList.push(
          <li key={`li-${i}`} className="text-slate-700 text-sm leading-relaxed">
            {parseInline(olMatch[3])}
          </li>
        )
        continue
      }

      // Regular paragraph line
      flushList(i)
      blocks.push(
        <p key={`p-${i}`} className="text-slate-700 text-sm leading-relaxed mb-2">
          {parseInline(line)}
        </p>
      )
    }

    flushList(lines.length)
    return blocks
  }

  return <div className="space-y-1.5">{parseBlocks(content)}</div>
}
