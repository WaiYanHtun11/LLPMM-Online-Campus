import { supabase } from '@/lib/supabase'

export default async function DebugPage() {
  // Check courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('*')
  
  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
  
  // Check batches
  const { data: batches, error: batchesError } = await supabase
    .from('batches')
    .select('*')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Database Debug</h1>
        
        {/* Courses */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Courses</h2>
          {coursesError ? (
            <pre className="text-red-600 text-sm">{JSON.stringify(coursesError, null, 2)}</pre>
          ) : (
            <div>
              <p className="mb-2">Count: <strong>{courses?.length || 0}</strong></p>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(courses, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          {usersError ? (
            <pre className="text-red-600 text-sm">{JSON.stringify(usersError, null, 2)}</pre>
          ) : (
            <div>
              <p className="mb-2">Count: <strong>{users?.length || 0}</strong></p>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(users, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Batches */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">Batches</h2>
          {batchesError ? (
            <pre className="text-red-600 text-sm">{JSON.stringify(batchesError, null, 2)}</pre>
          ) : (
            <div>
              <p className="mb-2">Count: <strong>{batches?.length || 0}</strong></p>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(batches, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
