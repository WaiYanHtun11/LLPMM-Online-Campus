export function parseQuestionContent(text: string) {
  const codeMatch = text.match(/```([^\n]*)\n([\s\S]*?)```/)

  if (!codeMatch) {
    return {
      prompt: text,
      language: '',
      code: '',
      hasCode: false,
    }
  }

  const fullMatch = codeMatch[0]
  const language = (codeMatch[1] || '').trim().toLowerCase()
  const code = (codeMatch[2] || '').trim()
  const prompt = text.replace(fullMatch, '').trim()

  return {
    prompt,
    language,
    code,
    hasCode: true,
  }
}

export function toQuestionPreviewText(text: string, maxLength = 180) {
  const parsed = parseQuestionContent(text)
  const base = (parsed.prompt || text || '').replace(/\s+/g, ' ').trim()

  if (base.length <= maxLength) {
    return base
  }

  return `${base.slice(0, maxLength - 1)}…`
}
