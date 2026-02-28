import { promises as fs } from 'fs'
import path from 'path'

export interface QuizCategory {
  slug: string
  title: string
  description: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  answerIndex: number
}

export interface QuizData {
  slug: string
  title: string
  description: string
  questions: QuizQuestion[]
}

export interface QuizCategoryWithCount extends QuizCategory {
  questionCount: number
}

const categoriesFilePath = path.join(process.cwd(), 'app', 'quizzes', 'category.json')
const quizFilesDir = path.join(process.cwd(), 'app', 'quizzes', 'json')

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(fileContent) as T
  } catch {
    return null
  }
}

function toTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function getQuizBySlug(slug: string): Promise<QuizData | null> {
  const quizFilePath = path.join(quizFilesDir, `${slug}.json`)
  return readJsonFile<QuizData>(quizFilePath)
}

export async function getAllQuizSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(quizFilesDir)
    return entries
      .filter((entry) => entry.endsWith('.json'))
      .map((entry) => entry.replace('.json', ''))
      .sort()
  } catch {
    return []
  }
}

export async function getQuizCategories(): Promise<QuizCategory[]> {
  const categories = await readJsonFile<QuizCategory[]>(categoriesFilePath)

  if (categories && categories.length > 0) {
    return categories
  }

  const slugs = await getAllQuizSlugs()
  return slugs.map((slug) => ({
    slug,
    title: toTitle(slug),
    description: `Practice ${toTitle(slug)} questions`,
  }))
}

export async function getQuizCategoriesWithCounts(): Promise<QuizCategoryWithCount[]> {
  const categories = await getQuizCategories()

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const quiz = await getQuizBySlug(category.slug)
      return {
        ...category,
        questionCount: quiz?.questions?.length || 0,
      }
    })
  )

  return categoriesWithCounts
}
