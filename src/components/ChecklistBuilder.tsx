import React, { useState } from 'react';
import { Plus, Trash2, Check, Circle } from 'lucide-react';
import { ChecklistItem } from '../types/submissions';

interface ChecklistBuilderProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  allowCompletion?: boolean;
  currentUserId?: string;
}

export default function ChecklistBuilder({
  items,
  onChange,
  allowCompletion = false,
  currentUserId,
}: ChecklistBuilderProps) {
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    if (newItemText.trim()) {
      const newItem: ChecklistItem = {
        id: crypto.randomUUID(),
        text: newItemText.trim(),
        completed: false,
      };
      onChange([...items, newItem]);
      setNewItemText('');
    }
  };

  const toggleItem = (id: string) => {
    if (!allowCompletion) return;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? new Date().toISOString() : undefined,
          completedBy: !item.completed ? currentUserId : undefined,
        };
      }
      return item;
    });
    onChange(updatedItems);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Add a checklist item..."
        />
        <button
          type="button"
          onClick={addItem}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                className={`flex-shrink-0 ${
                  allowCompletion
                    ? 'cursor-pointer hover:scale-110 transition-transform'
                    : 'cursor-default'
                }`}
                disabled={!allowCompletion}
              >
                {item.completed ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <span
                className={`flex-1 ${
                  item.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-900'
                }`}
              >
                {item.text}
              </span>

              {item.completed && item.completedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(item.completedAt).toLocaleDateString()}
                </span>
              )}

              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          No checklist items yet. Add items to track tasks.
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <span>
            {items.filter((item) => item.completed).length} of {items.length}{' '}
            completed
          </span>
          <span>
            {items.length > 0 &&
              `${Math.round(
                (items.filter((item) => item.completed).length / items.length) *
                  100
              )}%`}
          </span>
        </div>
      )}
    </div>
  );
}
