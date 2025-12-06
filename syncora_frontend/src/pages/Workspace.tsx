import React from "react";
import { useApp } from "@/contexts/AppContext";
import ChatPage from "./ChatPage";
// import VideoCall from "@/components/video/VideoCall";
import { MessageCircle, Video, ListTodo, StickyNote } from "lucide-react";

const Workspace = () => {
  const { activeModule, setActiveModule, activeRoom, setActiveRoom, userEmail } = useApp();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-20 bg-gray-900 text-white flex flex-col items-center py-6 space-y-8 shadow-lg">
        <button
          onClick={() => setActiveModule("chat")}
          className={`p-3 rounded-lg transition-all ${
            activeModule === "chat" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
          title="Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveModule("video")}
          className={`p-3 rounded-lg transition-all ${
            activeModule === "video" ? "bg-green-600" : "hover:bg-gray-700"
          }`}
          title="Video"
        >
          <Video className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveModule("tasks")}
          className={`p-3 rounded-lg transition-all ${
            activeModule === "tasks" ? "bg-purple-600" : "hover:bg-gray-700"
          }`}
          title="Tasks"
        >
          <ListTodo className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveModule("notes")}
          className={`p-3 rounded-lg transition-all ${
            activeModule === "notes" ? "bg-yellow-600" : "hover:bg-gray-700"
          }`}
          title="Notes"
        >
          <StickyNote className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeModule === "chat" && <ChatPage />}
          {activeModule === "video" && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-lg">Video module has been removed.</p>
            </div>
          )}
        {activeModule === "tasks" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Tasks Module - Coming Soon</p>
          </div>
        )}
        {activeModule === "notes" && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-lg">Notes Module - Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;