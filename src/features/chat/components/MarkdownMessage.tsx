import { Fragment, createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { cn } from '@/utils/cn'
import type { Citation } from '@/types'

/**
 * Render câu trả lời của trợ lý (UC 7).
 *
 * BE trả `content` là string Markdown nguyên văn — Node không đổi sang HTML/JSON
 * (xem `docs/api/public-api.md` phía BE), nên FE là nơi duy nhất render. Prompt RAG
 * đã yêu cầu LLM dùng Markdown (bảng/danh sách/code) và LaTeX `$...$` / `$$...$$`.
 *
 * Raw HTML KHÔNG nằm trong contract → cố ý không bật `rehype-raw`. Nội dung do LLM
 * sinh ra, coi như không tin cậy: react-markdown mặc định bỏ qua thẻ HTML thô.
 */

/** Marker trích dẫn BE chèn trong câu trả lời: `[1]`, `[2]`… (BE tự đánh số lại liên tục). */
const CITATION_PATTERN = String.raw`\[(\d+)\]`

/**
 * Dò công thức LaTeX để chỉ bật remark-math + nạp KaTeX khi thật sự cần.
 * Bắt buộc ký tự sát `$` không phải khoảng trắng để "giá 5$ và 10$" không bị hiểu
 * nhầm thành công thức — tin nhắn không có toán thì bỏ qua hoàn toàn remark-math,
 * tránh mọi rủi ro nuốt mất dấu `$`.
 */
const MATH_RE = /\$\$[\s\S]+?\$\$|\$(?![\s$])[^\n$]*?(?<![\s$])\$/

type RehypePlugins = NonNullable<ComponentProps<typeof ReactMarkdown>['rehypePlugins']>

/** Cờ báo đang ở trong khối ``` ``` ``` để `code` biết mình là block hay inline. */
const InsideCodeBlock = createContext(false)

/**
 * Nạp KaTeX theo nhu cầu: bundle + font khoảng vài trăm KB, phần lớn câu trả lời
 * không có công thức nên không đáng nạp sẵn. Trong lúc chờ, công thức hiện tạm
 * dưới dạng TeX thô (một nhịp render) thay vì mất chữ.
 */
function useKatexPlugins(enabled: boolean): RehypePlugins {
  const [plugins, setPlugins] = useState<RehypePlugins>([])

  useEffect(() => {
    if (!enabled || plugins.length > 0) return
    let cancelled = false

    void Promise.all([import('rehype-katex'), import('katex/dist/katex.min.css')]).then(
      ([mod]) => {
        // throwOnError=false: công thức sai chỉ hiện đỏ tại chỗ, không làm vỡ cả tin nhắn.
        if (!cancelled) setPlugins([[mod.default, { throwOnError: false, strict: false }]])
      },
    )

    return () => {
      cancelled = true
    }
  }, [enabled, plugins.length])

  return plugins
}

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
  const hasMath = useMemo(() => MATH_RE.test(content), [content])
  const rehypePlugins = useKatexPlugins(hasMath)
  const remarkPlugins = useMemo(
    () => (hasMath ? [remarkGfm, remarkMath] : [remarkGfm]),
    [hasMath],
  )

  /**
   * Đổi `[n]` trong text thành chip mở PDF (UC 10).
   *
   * Chỉ đụng vào children dạng chuỗi của các thẻ văn bản. Nội dung trong `code` và
   * trong công thức nằm ở component khác nên không bao giờ đi qua đây — quan trọng,
   * vì BE đánh số lại marker trên TOÀN chuỗi (kể cả trong code block), nên `arr[1]`
   * trong ví dụ code có thể bị viết thành `[1]` mà không phải trích dẫn thật.
   */
  const renderChildren = useMemo(() => {
    const renderText = (text: string): ReactNode => {
      const regex = new RegExp(CITATION_PATTERN, 'g')
      const parts: ReactNode[] = []
      let lastIndex = 0
      let keyIdx = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))

        const order = Number.parseInt(match[1], 10)
        // BE đánh số theo thứ tự xuất hiện; ưu tiên citationOrder, không có thì suy ra từ vị trí.
        const citation =
          citations?.find((c) => c.citationOrder === order) ?? citations?.[order - 1]

        parts.push(
          citation ? (
            <button
              key={`cite-${keyIdx++}`}
              type="button"
              onClick={() => onSelectCitation(citation)}
              title={citation.sourceText || citation.documentTitle}
              className="mx-0.5 inline-flex select-none items-center justify-center rounded border border-indigo-100/50 bg-indigo-50 px-1 py-0.5 align-baseline text-[11px] font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
            >
              [{order}]
            </button>
          ) : (
            // Không tìm được nguồn tương ứng → giữ nguyên chữ, không dựng chip chết.
            <span key={`cite-${keyIdx++}`} className="select-none text-slate-400">
              [{order}]
            </span>
          ),
        )
        lastIndex = regex.lastIndex
      }

      if (parts.length === 0) return text
      if (lastIndex < text.length) parts.push(text.slice(lastIndex))
      return parts
    }

    return (children: ReactNode): ReactNode => {
      if (typeof children === 'string') return renderText(children)
      if (Array.isArray(children)) {
        return children.map((child, i) =>
          typeof child === 'string' ? (
            <Fragment key={`t-${i}`}>{renderText(child)}</Fragment>
          ) : (
            child
          ),
        )
      }
      return children
    }
  }, [citations, onSelectCitation])

  const components = useMemo<Components>(
    () => ({
      p: ({ children }) => <p className="mb-2">{renderChildren(children)}</p>,
      strong: ({ children }) => (
        <strong className="font-bold text-slate-900">{renderChildren(children)}</strong>
      ),
      em: ({ children }) => <em className="italic">{renderChildren(children)}</em>,
      del: ({ children }) => (
        <del className="text-slate-400 line-through">{renderChildren(children)}</del>
      ),

      // Heading trong bong bóng chat giữ cỡ chữ nhỏ — không phóng to như trang tài liệu.
      h1: ({ children }) => (
        <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-900">
          {renderChildren(children)}
        </h3>
      ),
      h2: ({ children }) => (
        <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-900">
          {renderChildren(children)}
        </h3>
      ),
      h3: ({ children }) => (
        <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-900">
          {renderChildren(children)}
        </h3>
      ),
      h4: ({ children }) => (
        <h4 className="mt-2 mb-1 text-sm font-semibold text-slate-800">
          {renderChildren(children)}
        </h4>
      ),
      h5: ({ children }) => (
        <h4 className="mt-2 mb-1 text-sm font-semibold text-slate-800">
          {renderChildren(children)}
        </h4>
      ),
      h6: ({ children }) => (
        <h4 className="mt-2 mb-1 text-sm font-semibold text-slate-800">
          {renderChildren(children)}
        </h4>
      ),

      ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
      li: ({ children, className }) => (
        // Task list của GFM đã có ô checkbox nên bỏ dấu chấm đầu dòng cho đỡ rối.
        <li className={cn(className?.includes('task-list-item') && 'list-none')}>
          {renderChildren(children)}
        </li>
      ),
      input: ({ checked, type }) =>
        type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            disabled
            className="mr-1.5 align-middle accent-indigo-600"
          />
        ) : null,

      a: ({ children, href }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
        >
          {renderChildren(children)}
        </a>
      ),
      blockquote: ({ children }) => (
        <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-600 italic">
          {children}
        </blockquote>
      ),
      hr: () => <hr className="my-3 border-slate-200" />,

      // Bảng có thể rộng hơn bong bóng chat → cuộn ngang trong khung riêng.
      table: ({ children }) => (
        <div className="my-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-xs">{children}</table>
        </div>
      ),
      thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
      th: ({ children }) => (
        <th className="border-b border-slate-200 px-2.5 py-1.5 text-left font-semibold text-slate-900">
          {renderChildren(children)}
        </th>
      ),
      td: ({ children }) => (
        <td className="border-b border-slate-100 px-2.5 py-1.5 align-top">
          {renderChildren(children)}
        </td>
      ),

      pre: ({ children }) => (
        <InsideCodeBlock.Provider value={true}>
          <pre className="my-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-slate-100">
            {children}
          </pre>
        </InsideCodeBlock.Provider>
      ),
      code: ({ children }) => <CodeSpan>{children}</CodeSpan>,
    }),
    [renderChildren],
  )

  return (
    <div className="text-sm leading-relaxed text-slate-700 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * `code` vừa là inline `` `x` `` vừa là nội dung khối ``` ``` ```; react-markdown không
 * còn cờ `inline` nên phân biệt bằng context do `pre` đặt. Cả hai nhánh đều KHÔNG chạy
 * renderChildren — `[1]` trong code là code, không phải trích dẫn.
 */
function CodeSpan({ children }: { children?: ReactNode }) {
  const insideBlock = useContext(InsideCodeBlock)

  if (insideBlock) return <code>{children}</code>

  return (
    <code className="rounded border border-slate-200/50 bg-slate-100 px-1 py-0.5 font-mono text-xs text-indigo-600">
      {children}
    </code>
  )
}
