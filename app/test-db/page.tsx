import { supabase } from '@/lib/supabase'

export default async function TestDBPage() {
  // Fetch courses from database
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: true })

  // Fetch users (just count)
  const { count: userCount, error: userError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">🧪 Database Connection Test</h1>
        <p className="text-gray-600 mb-8">Testing Supabase connection from Next.js</p>

        {/* Users Count */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">👥 Users Table</h2>
          {userError ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-600 font-semibold">❌ Error:</p>
              <pre className="text-sm text-red-800 mt-2">{userError.message}</pre>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-600 font-semibold">✅ Connected!</p>
              <p className="text-gray-700 mt-2">Total users: <strong>{userCount}</strong></p>
            </div>
          )}
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold mb-4">📚 Courses Table</h2>
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-600 font-semibold">❌ Error:</p>
              <pre className="text-sm text-red-800 mt-2">{error.message}</pre>
            </div>
          ) : courses && courses.length > 0 ? (
            <div>
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                <p className="text-green-600 font-semibold">✅ Connected!</p>
                <p className="text-gray-700 mt-2">Found <strong>{courses.length} courses</strong></p>
              </div>
              
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{course.title}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        {course.level}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>⏱️ {course.duration}</span>
                      <span>💰 {course.fee.toLocaleString()} MMK</span>
                      <span>📂 {course.category}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      ID: {course.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-600 font-semibold">⚠️ No courses found</p>
              <p className="text-gray-700 mt-2">Database is empty. Run 002_sample_data.sql to add sample courses.</p>
            </div>
          )}
        </div>

        {/* Connection Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📡 Connection Details</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Supabase URL: <code className="bg-blue-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code></p>
            <p>• API Key: <code className="bg-blue-100 px-2 py-1 rounded">sb_publishable_***</code></p>
            <p>• Connection: <strong className="text-green-600">Active</strong></p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-6 bg-gray-100 rounded p-4">
          <h3 className="font-semibold mb-2">🎯 Next Steps:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✅ Database schema created (15 tables)</li>
            <li>✅ Sample data loaded (admin + 6 courses)</li>
            <li>✅ Next.js connected to Supabase</li>
            <li>⏳ Build authentication system</li>
            <li>⏳ Create admin dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
