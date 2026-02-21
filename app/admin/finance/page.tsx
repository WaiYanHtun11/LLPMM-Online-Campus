'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface BatchFinanceSummary {
  batchId: string
  batchName: string
  courseTitle: string
  income: number
  expenses: number
  instructorSalary: number
  net: number
  expenseCount: number
}

interface ExpenseRecord {
  id: string
  batchId: string
  batchName: string
  courseTitle: string
  title: string
  amount: number
  expenseDate: string
  notes: string | null
}

interface ExpenseFormState {
  batchId: string
  title: string
  amount: string
  expenseDate: string
  notes: string
}

function pickOne<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export default function AdminFinancePage() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  const [financeRows, setFinanceRows] = useState<BatchFinanceSummary[]>([])
  const [expenseRows, setExpenseRows] = useState<ExpenseRecord[]>([])
  const [batchOptions, setBatchOptions] = useState<Array<{ id: string; label: string }>>([])
  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [loading, setLoading] = useState(true)
  const [savingExpense, setSavingExpense] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const expenseFormCardRef = useRef<HTMLDivElement | null>(null)

  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>({
    batchId: '',
    title: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userProfile) {
        router.push('/login')
      } else if (userProfile.role !== 'admin') {
        router.push(`/${userProfile.role}`)
      }
    }
  }, [user, userProfile, authLoading, router])

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchFinanceData()
    }
  }, [userProfile])

  async function fetchFinanceData() {
    try {
      setLoading(true)
      setError('')

      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('id, batch_name, instructor_salary, courses!inner(title)')
        .order('start_date', { ascending: false })

      if (batchesError) throw batchesError

      const initialMap = new Map<string, BatchFinanceSummary>()
      const options: Array<{ id: string; label: string }> = []

      ;(batchesData || []).forEach((batch: any) => {
        const course = pickOne(batch.courses)
        const row: BatchFinanceSummary = {
          batchId: batch.id,
          batchName: batch.batch_name,
          courseTitle: course?.title || 'Unknown Course',
          income: 0,
          expenses: 0,
          instructorSalary: Number(batch.instructor_salary || 0),
          net: 0,
          expenseCount: 0,
        }

        initialMap.set(batch.id, row)
        options.push({ id: batch.id, label: `${batch.batch_name} • ${row.courseTitle}` })
      })

      setBatchOptions(options)
      if (!expenseForm.batchId && options.length > 0) {
        setExpenseForm(prev => ({ ...prev, batchId: options[0].id }))
      }

      const { data: paidInstallments, error: incomeError } = await supabase
        .from('payment_installments')
        .select('amount, payments!inner(enrollments!inner(batch_id))')
        .eq('status', 'paid')

      if (incomeError) throw incomeError

      ;(paidInstallments || []).forEach((row: any) => {
        const payment = pickOne(row.payments)
        const enrollment = pickOne(payment?.enrollments ?? null)
        const batchId = enrollment?.batch_id
        if (!batchId || !initialMap.has(batchId)) return

        const current = initialMap.get(batchId)!
        current.income += Number(row.amount || 0)
      })

      const { data: expensesData, error: expensesError } = await supabase
        .from('batch_expenses')
        .select('id, batch_id, title, amount, expense_date, notes, batches!inner(batch_name, courses!inner(title))')
        .order('expense_date', { ascending: false })

      if (expensesError) {
        throw new Error('Could not load expenses. Please run the latest migration for batch_expenses table.')
      }

      const normalizedExpenses: ExpenseRecord[] = (expensesData || []).map((row: any) => {
        const batch = pickOne(row.batches)
        const course = pickOne(batch?.courses ?? null)

        if (initialMap.has(row.batch_id)) {
          const current = initialMap.get(row.batch_id)!
          current.expenses += Number(row.amount || 0)
          current.expenseCount += 1
        }

        return {
          id: row.id,
          batchId: row.batch_id,
          batchName: batch?.batch_name || 'Unknown Batch',
          courseTitle: course?.title || 'Unknown Course',
          title: row.title,
          amount: Number(row.amount || 0),
          expenseDate: row.expense_date,
          notes: row.notes || null,
        }
      })

      const summaries = Array.from(initialMap.values())
        .map((row) => ({
          ...row,
          net: row.income - row.expenses - row.instructorSalary,
        }))
        .sort((a, b) => b.income - a.income)

      setFinanceRows(summaries)
      setExpenseRows(normalizedExpenses)
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load finance data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function resetExpenseForm(defaultBatchId?: string) {
    setExpenseForm({
      batchId: defaultBatchId || (batchOptions[0]?.id ?? ''),
      title: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setEditingExpenseId(null)
  }

  function handleEditExpense(expense: ExpenseRecord) {
    setEditingExpenseId(expense.id)
    setExpenseForm({
      batchId: expense.batchId,
      title: expense.title,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate,
      notes: expense.notes || '',
    })

    requestAnimationFrame(() => {
      expenseFormCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function handleDeleteExpense(expense: ExpenseRecord) {
    const confirmed = window.confirm(`Delete expense "${expense.title}" (${expense.amount.toLocaleString()} MMK)?`)
    if (!confirmed) return

    try {
      setError('')
      const { error: deleteError } = await supabase
        .from('batch_expenses')
        .delete()
        .eq('id', expense.id)

      if (deleteError) throw deleteError

      if (editingExpenseId === expense.id) {
        resetExpenseForm(expense.batchId)
      }

      await recalculateSalary(expense.batchId)
      await fetchFinanceData()
    } catch (deleteExpenseError: unknown) {
      const message = deleteExpenseError instanceof Error ? deleteExpenseError.message : 'Failed to delete expense'
      setError(message)
    }
  }

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault()

    if (!expenseForm.batchId || !expenseForm.title.trim() || !expenseForm.amount) {
      setError('Batch, title, and amount are required for expenses.')
      return
    }

    try {
      setSavingExpense(true)
      setError('')

      const amount = Number(expenseForm.amount)
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Expense amount must be greater than 0.')
      }

      if (editingExpenseId) {
        const { error: updateError } = await supabase
          .from('batch_expenses')
          .update({
            batch_id: expenseForm.batchId,
            title: expenseForm.title.trim(),
            amount: Math.round(amount),
            expense_date: expenseForm.expenseDate,
            notes: expenseForm.notes.trim() || null,
          })
          .eq('id', editingExpenseId)

        if (updateError) {
          throw updateError
        }
      } else {
        const { error: insertError } = await supabase
          .from('batch_expenses')
          .insert({
            batch_id: expenseForm.batchId,
            title: expenseForm.title.trim(),
            amount: Math.round(amount),
            expense_date: expenseForm.expenseDate,
            notes: expenseForm.notes.trim() || null,
            created_by: userProfile?.id || null,
          })

        if (insertError) {
          throw insertError
        }
      }

      resetExpenseForm(expenseForm.batchId)

      await recalculateSalary(expenseForm.batchId)

      await fetchFinanceData()
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to add expense'
      setError(message)
    } finally {
      setSavingExpense(false)
    }
  }

  const filteredFinanceRows = useMemo(() => {
    if (selectedBatchId === 'all') return financeRows
    return financeRows.filter((row) => row.batchId === selectedBatchId)
  }, [financeRows, selectedBatchId])

  const filteredExpenseRows = useMemo(() => {
    if (selectedBatchId === 'all') return expenseRows
    return expenseRows.filter((row) => row.batchId === selectedBatchId)
  }, [expenseRows, selectedBatchId])

  const totals = useMemo(() => {
    const totalIncome = filteredFinanceRows.reduce((sum, row) => sum + row.income, 0)
    const totalExpenses = filteredFinanceRows.reduce((sum, row) => sum + row.expenses, 0)
    const totalInstructorSalary = filteredFinanceRows.reduce((sum, row) => sum + row.instructorSalary, 0)

    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses - totalInstructorSalary,
    }
  }, [filteredFinanceRows])

  const selectedBatchLabel = useMemo(() => {
    if (selectedBatchId === 'all') return 'All Batches'
    return batchOptions.find((batch) => batch.id === selectedBatchId)?.label || 'Selected Batch'
  }, [selectedBatchId, batchOptions])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  async function recalculateSalary(batchId: string) {
    if (!batchId) return
    try {
      await fetch('/api/admin/batches/recalculate-salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId })
      })
    } catch (error) {
      console.error('Failed to recalculate instructor salary:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!userProfile || userProfile.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/admin" className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition">
              LLPMM Campus
            </Link>
            <p className="text-sm text-gray-600 mt-1">Revenue & Expense Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin: {userProfile.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-2 sm:justify-end">
            <label htmlFor="batch-filter" className="text-sm font-semibold text-gray-700">Batch Filter:</label>
            <select
              id="batch-filter"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-green-600">{totals.totalIncome.toLocaleString()} MMK</div>
              <div className="text-sm text-gray-600 mt-1">Total Income</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="text-3xl font-bold text-red-600">{totals.totalExpenses.toLocaleString()} MMK</div>
              <div className="text-sm text-gray-600 mt-1">Total Expenses</div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className={`text-3xl font-bold ${totals.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {totals.net.toLocaleString()} MMK
              </div>
              <div className="text-sm text-gray-600 mt-1">Net Balance</div>
            </div>
          </div>
        </div>

        <div ref={expenseFormCardRef} className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingExpenseId ? 'Edit Batch Expense' : 'Add Batch Expense'}
            </h3>
            {editingExpenseId && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                Editing selected expense. Update fields and click "Update Expense".
              </div>
            )}
            <form onSubmit={handleSubmitExpense} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={expenseForm.batchId}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, batchId: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select batch</option>
                {batchOptions.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Expense title"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="number"
                min="1"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Amount (MMK)"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />

              <button
                type="submit"
                disabled={savingExpense}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
              >
                {savingExpense ? 'Saving...' : editingExpenseId ? 'Update Expense' : 'Add Expense'}
              </button>

              {editingExpenseId && (
                <button
                  type="button"
                  onClick={() => resetExpenseForm(expenseForm.batchId)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel Edit
                </button>
              )}

              <textarea
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notes (optional)"
                rows={2}
                className="md:col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px] mb-6">
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
              Showing: <span className="font-semibold text-gray-800">{selectedBatchLabel}</span>
            </div>
            <table className="w-full min-w-[760px]">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Income</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Expenses</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Instructor Salary</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Expense Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFinanceRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No finance rows found.
                    </td>
                  </tr>
                ) : (
                  filteredFinanceRows.map((row) => (
                    <tr key={row.batchId} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">{row.batchName}</div>
                        <div className="text-xs text-gray-600">{row.courseTitle}</div>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-green-600">{row.income.toLocaleString()} MMK</td>
                      <td className="px-4 py-4 text-right font-semibold text-red-600">{row.expenses.toLocaleString()} MMK</td>
                      <td className="px-4 py-4 text-right font-semibold text-slate-700">{row.instructorSalary.toLocaleString()} MMK</td>
                      <td className={`px-4 py-4 text-right font-semibold ${row.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {row.net.toLocaleString()} MMK
                      </td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">{row.expenseCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 p-[1px]">
          <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
            <div className="px-4 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Recent Expenses</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing: <span className="font-semibold text-gray-800">{selectedBatchLabel}</span>
              </p>
            </div>
            <table className="w-full min-w-[900px]">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expense</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenseRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenseRows.slice(0, 20).map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-700">{new Date(row.expenseDate).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">{row.batchName}</div>
                        <div className="text-xs text-gray-600">{row.courseTitle}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-800">{row.title}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-red-600">{row.amount.toLocaleString()} MMK</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{row.notes || '-'}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditExpense(row)}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(row)}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
