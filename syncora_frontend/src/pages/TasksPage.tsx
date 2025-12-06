import React, { useState, useEffect } from "react";
import Modal from "@/components/modals/Modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskApi } from "@/api/taskApi";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Clock, Calendar, Plus, Trash2, Edit, Search, Filter, ListTodo } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { FeatureButton } from "@/components/subscription/SubscriptionGuard";

export default function TaskManager() {
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    tags: ""
  });
  const [tasks, setTasks] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
    tags: ""
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  // Load tasks from backend
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await taskApi.getAllTasks();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const toggleComplete = async (id, completed) => {
    try {
      const newStatus = completed ? "TODO" : "DONE";
      await taskApi.updateTaskStatus(id, newStatus);
      fetchTasks();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskApi.deleteTask(id);
      fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase()) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));

    const matchesStatus = 
      filterStatus === "ALL" ||
      (filterStatus === "TODO" && task.status === "TODO") ||
      (filterStatus === "DONE" && task.status === "DONE");

    const matchesPriority = 
      filterPriority === "ALL" ||
      task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH": return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
      case "LOW": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusCount = (status) => {
    return tasks.filter(task => task.status === status).length;
  };

  const getScheduledTasks = () => {
    return tasks.filter(task => task.dueDate);
  };

  const getTotalTasks = () => tasks.length;
  const getCompletedTasks = () => getStatusCount("DONE");
  const getPendingTasks = () => getStatusCount("TODO");
  const getScheduledCount = () => getScheduledTasks().length;

  return (
    <>
      <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900 overflow-hidden">
        {/* Main Section */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                  <ListTodo className="text-white" size={24} />
                </div>
                Task Manager
              </h1>
              <p className="text-gray-600 mt-1">Organize, prioritize, and conquer your tasks</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 w-64 h-10 border-gray-300 shadow-sm"
                />
              </div>
              
              <FeatureButton
                feature="advanced_task_management"
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2 h-10 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200"
              >
                <Plus size={20} /> Add Task
              </FeatureButton>
            </div>
          </header>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{getTotalTasks()}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100">
                  <ListTodo className="text-blue-600" size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{getCompletedTasks()}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{getPendingTasks()}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="text-amber-600" size={20} />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Scheduled</p>
                  <p className="text-2xl font-bold text-purple-600">{getScheduledCount()}</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100">
                  <Calendar className="text-purple-600" size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
              >
                <option value="ALL">All Status</option>
                <option value="TODO">Todo</option>
                <option value="DONE">Completed</option>
              </select>
            </div>
            
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Tasks List */}
          <motion.div
            layout
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">All Tasks</h2>
              <p className="text-gray-600 text-sm">
                Showing {filteredTasks.length} of {getTotalTasks()} tasks
              </p>
            </div>

            <AnimatePresence>
              {filteredTasks.length === 0 ? (
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <ListTodo className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-500 text-lg mb-2">No tasks found</p>
                  <p className="text-gray-400 text-sm">
                    {search || filterStatus !== "ALL" || filterPriority !== "ALL" 
                      ? "Try adjusting your search or filters"
                      : "Create your first task to get started"}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex items-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                        task.status === "DONE" 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-white border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      <button 
                        onClick={() => toggleComplete(task.id, task.status === "DONE")}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-4 transition-all ${
                          task.status === "DONE"
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 hover:border-blue-500"
                        }`}
                      >
                        {task.status === "DONE" && (
                          <CheckCircle className="text-white" size={16} />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className={`text-lg font-medium truncate ${
                              task.status === "DONE"
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </p>
                          <Badge className={`text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar size={14} />
                              <span>{task.dueDate}</span>
                            </div>
                          )}
                          
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {task.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {tag}
                                </span>
                              ))}
                              {task.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditTaskId(task.id);
                            setEditForm({
                              title: task.title,
                              description: task.description || "",
                              dueDate: task.dueDate || "",
                              priority: task.priority,
                              tags: task.tags ? task.tags.join(",") : ""
                            });
                          }}
                          className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTaskId(task.id)}
                          className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Scheduled Tasks Sidebar */}
        <div className="w-full md:w-96 bg-white border-l border-gray-200 shadow-xl p-6 md:p-8 overflow-y-auto">
          <div className="sticky top-0 bg-white pb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Calendar className="text-blue-600" size={20} /> Upcoming Tasks
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Tasks with due dates ({getScheduledCount()})
            </p>
          </div>
          
          {getScheduledCount() === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 mb-2">No scheduled tasks</p>
              <p className="text-gray-400 text-sm">Add due dates to your tasks to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getScheduledTasks().map((task) => (
                <div
                  key={task.id}
                  className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`font-medium ${task.status === "DONE" ? "line-through text-gray-500" : "text-gray-900"}`}>
                          {task.title}
                        </p>
                        {task.status === "DONE" && (
                          <CheckCircle className="text-green-500" size={16} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-blue-700">
                          <Calendar size={14} />
                          <span className="font-medium">{task.dueDate}</span>
                        </div>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Creation Modal */}
      <Modal open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <div className="p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="text-blue-600" size={20} />
            Create New Task
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await taskApi.createTask({
                  title: form.title,
                  description: form.description,
                  dueDate: form.dueDate || undefined,
                  priority: form.priority as 'LOW' | 'MEDIUM' | 'HIGH',
                  tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
                  status: "TODO"
                });
                setShowCreateDialog(false);
                setForm({ title: "", description: "", dueDate: "", priority: "MEDIUM", tags: "" });
                fetchTasks();
              } catch (err) {
                alert("Error creating task");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                type="text"
                placeholder="Enter task title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Enter task description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm(f => ({ ...f, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                type="text"
                placeholder="work, personal, urgent (comma separated)"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                Create Task
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={!!editTaskId} onClose={() => setEditTaskId(null)}>
        <div className="p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Edit className="text-blue-600" size={20} />
            Edit Task
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await taskApi.updateTask(editTaskId, {
                  title: editForm.title,
                  description: editForm.description,
                  dueDate: editForm.dueDate || undefined,
                  priority: editForm.priority as 'LOW' | 'MEDIUM' | 'HIGH',
                  tags: editForm.tags ? editForm.tags.split(",").map(t => t.trim()) : [],
                });
                setEditTaskId(null);
                fetchTasks();
              } catch (err) {
                alert("Error updating task");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                type="text"
                placeholder="Enter task title"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Enter task description"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <Select
                  value={editForm.priority}
                  onValueChange={(value) => setEditForm(f => ({ ...f, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb</label>-1">
                Tags
              </label>
              <Input
                type="text"
                placeholder="work, personal, urgent (comma separated)"
                value={editForm.tags}
                onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                Save Changes
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditTaskId(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTaskId} onClose={() => setDeleteTaskId(null)}>
        <div className="p-6 w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Task?</h2>
            <p className="text-gray-600 mb-6">This action cannot be undone. The task will be permanently deleted.</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTaskId(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              onClick={async () => {
                await deleteTask(deleteTaskId);
                setDeleteTaskId(null);
              }}
            >
              Delete Task
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}