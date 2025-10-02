import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">FlowChat</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.firstName || user?.username}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Workspaces</h2>
            <p className="text-sm text-gray-400">No workspaces yet</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Channels</h2>
            <p className="text-sm text-gray-400">No channels yet</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-white">
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to FlowChat!</h2>
              <p>Select a channel or create a workspace to get started.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
