// Animated code rain effect component
export function CodeRain() {
  const codeSnippets = [
    'const learn = () => {};',
    'function code() { }',
    'if (passionate) { }',
    'while (true) { }',
    'for (let i = 0; i < ∞; i++)',
    'import { skills } from "learning";',
    'export default Developer;',
    'async function master() {}',
    'return success;',
    'console.log("Hello World");',
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {codeSnippets.map((snippet, i) => (
        <div key={i} className="code-rain">
          {snippet}
        </div>
      ))}
    </div>
  )
}

// Terminal window component
export function TerminalWindow({ children, title = "terminal" }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dot bg-red-500"></div>
        <div className="terminal-dot bg-yellow-500"></div>
        <div className="terminal-dot bg-green-500"></div>
        <span className="text-gray-400 text-sm ml-2">{title}</span>
      </div>
      <div className="terminal-body">
        {children}
      </div>
    </div>
  )
}

// Inline code badge
export function CodeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-md bg-gray-900 text-blue-400 font-mono text-sm border border-blue-500/20">
      {children}
    </span>
  )
}

// Code snippet block
export function CodeBlock({ code, language = "javascript" }: { code: string, language?: string }) {
  return (
    <div className="code-snippet rounded-lg p-6 font-mono text-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-xs">{language}</span>
        <span className="text-gray-500 text-xs">// learn.code()</span>
      </div>
      <pre className="text-gray-300 overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Floating code symbols
export function FloatingCodeSymbols() {
  const symbols = ['{ }', '< >', '[ ]', '( )', '//', '=>', '...', '&&', '||', '++']
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      {symbols.map((symbol, i) => (
        <div
          key={i}
          className="absolute text-blue-500 font-mono text-4xl font-bold float-code"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        >
          {symbol}
        </div>
      ))}
    </div>
  )
}
