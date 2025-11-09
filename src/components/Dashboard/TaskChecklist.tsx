import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  projectId?: string;
  projectTitle?: string;
  createdAt: any;
  completedAt?: any;
}

interface TaskChecklistProps {
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
  onAddTask?: (text: string, projectId?: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, text: string) => void;
  projectId?: string;
  projectTitle?: string;
  themeColor?: string;
}

const TaskChecklist: React.FC<TaskChecklistProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onUpdateTask,
  projectId,
  projectTitle,
  themeColor = '#FF6B35'
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddTask = () => {
    if (newTaskText.trim() && onAddTask) {
      onAddTask(newTaskText.trim(), projectId);
      setNewTaskText('');
    }
  };

  const handleUpdateTask = (taskId: string) => {
    if (editingText.trim() && onUpdateTask) {
      onUpdateTask(taskId, editingText.trim());
      setEditingTaskId(null);
      setEditingText('');
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingText(task.text);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingText('');
  };

  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-logo-navy/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-logo-navy">Task Checklist</h3>
          {projectTitle && (
            <p className="text-sm text-gray-600 mt-1">{projectTitle}</p>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {completedTasks.length} / {tasks.length} completed
        </div>
      </div>

      {/* Add new task */}
      {onAddTask && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-vibrant-orange focus:outline-none"
          />
          <button
            onClick={handleAddTask}
            className="px-4 py-2 rounded-lg text-white flex items-center gap-2 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks yet. Add your first task above!</p>
          </div>
        ) : (
          <>
            {/* Pending tasks */}
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <button
                  onClick={() => onToggleTask && onToggleTask(task.id)}
                  className="mt-0.5"
                  disabled={!onToggleTask}
                >
                  <Circle
                    className="w-5 h-5 hover:scale-110 transition-transform"
                    style={{ color: themeColor }}
                  />
                </button>
                
                {editingTaskId === task.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateTask(task.id)}
                      className="flex-1 px-2 py-1 border-2 border-vibrant-orange rounded"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateTask(task.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="text-logo-navy">{task.text}</p>
                      {task.projectTitle && !projectTitle && (
                        <p className="text-xs text-gray-500 mt-1">{task.projectTitle}</p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {onUpdateTask && (
                        <button
                          onClick={() => startEditing(task)}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteTask && (
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <h4 className="text-sm font-semibold text-gray-600">Completed</h4>
                </div>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg opacity-60 group"
                  >
                    <button
                      onClick={() => onToggleTask && onToggleTask(task.id)}
                      className="mt-0.5"
                      disabled={!onToggleTask}
                    >
                      <CheckCircle
                        className="w-5 h-5"
                        style={{ color: themeColor }}
                      />
                    </button>
                    <div className="flex-1">
                      <p className="text-logo-navy line-through">{task.text}</p>
                      {task.projectTitle && !projectTitle && (
                        <p className="text-xs text-gray-500 mt-1">{task.projectTitle}</p>
                      )}
                    </div>
                    {onDeleteTask && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskChecklist;
