import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../hooks/useContent';
import EditButton from './EditButton';
import ContentEditor from './ContentEditor';

interface PageEditorProps {
  collectionName: string;
  documentId?: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'image' | 'number';
    required?: boolean;
    placeholder?: string;
  }>;
  defaultData: Record<string, any>;
  title: string;
  children: (data: any) => React.ReactNode;
}

const PageEditor: React.FC<PageEditorProps> = ({
  collectionName,
  documentId = 'main',
  fields,
  defaultData,
  title,
  children
}) => {
  const { isAdmin } = useAuth();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { data, upsertContent } = useContent(collectionName, documentId);

  const contentData = data || defaultData;

  return (
    <div className="relative">
      {isAdmin && (
        <EditButton onClick={() => setEditingSection('edit')} />
      )}

      {children(contentData)}

      <ContentEditor
        isOpen={editingSection === 'edit'}
        onClose={() => setEditingSection(null)}
        title={title}
        fields={fields}
        initialData={contentData}
        onSave={(newData) => upsertContent(documentId, newData)}
      />
    </div>
  );
};

export default PageEditor;
