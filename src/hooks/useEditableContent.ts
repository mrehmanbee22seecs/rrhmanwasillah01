import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface EditableContent {
  [key: string]: any;
}

export const useEditableContent = (pageId: string, defaultContent: EditableContent) => {
  const [content, setContent] = useState<EditableContent>(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContent();
  }, [pageId]);

  const loadContent = async () => {
    try {
      const docRef = doc(db, 'page_content', pageId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setContent(docSnap.data() as EditableContent);
      } else {
        setContent(defaultContent);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (newContent: EditableContent) => {
    setSaving(true);
    try {
      const docRef = doc(db, 'page_content', pageId);
      await setDoc(docRef, newContent, { merge: true });
      setContent(newContent);
      return true;
    } catch (error) {
      console.error('Error saving content:', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    content,
    setContent,
    updateField,
    saveContent,
    loading,
    saving
  };
};
