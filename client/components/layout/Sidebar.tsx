import { useAuth } from "@/hooks/auth";
import { BarChart3, Settings, Plus } from "lucide-react";

export default function Sidebar({ onNewChat }: { onNewChat: () => void }) {
  const { user } = useAuth();

  return (
    <aside className="w-full md:w-72 shrink-0 p-4 md:p-6">
      <div className="glass rounded-2xl p-4 md:p-6 space-y-6">
        <button onClick={onNewChat} className="w-full btn-secondary">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <BarChart3 className="h-4 w-4" />
            Usage
          </div>
          <div className="text-xs text-slate-600 mb-2">
            Daily usage is now tracked on the main chat screen.
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <Settings className="h-4 w-4" />
            Settings
          </div>
          <div className="text-xs text-slate-500">
            More preferences coming soon.
          </div>
        </div>
        <div className="pt-2 border-t">
          {user ? (
            <div className="flex items-center gap-3">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="flex-1">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <div>
                <button
                  onClick={() => {}}
                  className="btn-ghost text-xs"
                  disabled={true}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-600">
              Please sign in using the "Sign in with Google" button in the
              header.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
