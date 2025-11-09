/**
 * useBookmarks Hook
 * Manages project bookmarks with categories, notes, and reminders
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface Bookmark {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image?: string;
  status: string;
  bookmarkCategory?: string;
  notes?: string;
  reminderDate?: string;
  reminderTime?: string;
  createdAt: any;
  updatedAt: any;
}

export interface BookmarkData {
  title: string;
  description: string;
  category: string;
  location: string;
  image?: string;
  status: string;
}

export const useBookmarks = () => {
  const { currentUser } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bookmarks
  useEffect(() => {
    if (currentUser?.uid) {
      loadBookmarks();
    } else {
      setBookmarks([]);
      setLoading(false);
    }
  }, [currentUser?.uid]);

  const loadBookmarks = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);
    try {
      const bookmarksRef = collection(db, 'project_bookmarks');
      const q = query(bookmarksRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);

      const loadedBookmarks: Bookmark[] = [];
      querySnapshot.forEach((doc) => {
        loadedBookmarks.push({
          id: doc.id,
          ...doc.data(),
        } as Bookmark);
      });

      setBookmarks(loadedBookmarks);
    } catch (err: any) {
      console.error('Error loading bookmarks:', err);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  // Check if project is bookmarked
  const isBookmarked = useCallback((projectId: string): boolean => {
    return bookmarks.some(bookmark => bookmark.projectId === projectId);
  }, [bookmarks]);

  // Get bookmark for a project
  const getBookmark = useCallback((projectId: string): Bookmark | undefined => {
    return bookmarks.find(bookmark => bookmark.projectId === projectId);
  }, [bookmarks]);

  // Toggle bookmark
  const toggleBookmark = async (projectId: string, projectData: BookmarkData): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in to bookmark projects');
    }

    try {
      const existingBookmark = bookmarks.find(b => b.projectId === projectId);

      if (existingBookmark) {
        // Remove bookmark
        await deleteDoc(doc(db, 'project_bookmarks', existingBookmark.id));
        setBookmarks(prev => prev.filter(b => b.id !== existingBookmark.id));
      } else {
        // Add bookmark
        const bookmarkRef = doc(collection(db, 'project_bookmarks'));
        const newBookmark: Omit<Bookmark, 'id'> = {
          projectId,
          userId: currentUser.uid,
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          location: projectData.location,
          image: projectData.image,
          status: projectData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(bookmarkRef, newBookmark);
        setBookmarks(prev => [
          ...prev,
          {
            id: bookmarkRef.id,
            ...newBookmark,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Bookmark,
        ]);
      }
    } catch (err: any) {
      console.error('Error toggling bookmark:', err);
      throw new Error('Failed to update bookmark');
    }
  };

  // Update bookmark category
  const updateBookmarkCategory = async (bookmarkId: string, category: string): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      const bookmarkRef = doc(db, 'project_bookmarks', bookmarkId);
      await setDoc(bookmarkRef, {
        bookmarkCategory: category,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBookmarks(prev =>
        prev.map(b =>
          b.id === bookmarkId
            ? { ...b, bookmarkCategory: category, updatedAt: new Date() }
            : b
        )
      );
    } catch (err: any) {
      console.error('Error updating bookmark category:', err);
      throw new Error('Failed to update bookmark category');
    }
  };

  // Add/update bookmark notes
  const addBookmarkNote = async (projectId: string, notes: string): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      const existingBookmark = bookmarks.find(b => b.projectId === projectId);
      if (!existingBookmark) {
        throw new Error('Bookmark not found');
      }

      const bookmarkRef = doc(db, 'project_bookmarks', existingBookmark.id);
      await setDoc(bookmarkRef, {
        notes,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBookmarks(prev =>
        prev.map(b =>
          b.id === existingBookmark.id
            ? { ...b, notes, updatedAt: new Date() }
            : b
        )
      );
    } catch (err: any) {
      console.error('Error updating bookmark notes:', err);
      throw new Error('Failed to update bookmark notes');
    }
  };

  // Set bookmark reminder
  const setBookmarkReminder = async (
    projectId: string,
    reminderDate: string,
    reminderTime?: string
  ): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      const existingBookmark = bookmarks.find(b => b.projectId === projectId);
      if (!existingBookmark) {
        throw new Error('Bookmark not found');
      }

      const bookmarkRef = doc(db, 'project_bookmarks', existingBookmark.id);
      await setDoc(bookmarkRef, {
        reminderDate,
        reminderTime,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBookmarks(prev =>
        prev.map(b =>
          b.id === existingBookmark.id
            ? { ...b, reminderDate, reminderTime, updatedAt: new Date() }
            : b
        )
      );
    } catch (err: any) {
      console.error('Error setting bookmark reminder:', err);
      throw new Error('Failed to set bookmark reminder');
    }
  };

  // Remove bookmark reminder
  const removeBookmarkReminder = async (projectId: string): Promise<void> => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in');
    }

    try {
      const existingBookmark = bookmarks.find(b => b.projectId === projectId);
      if (!existingBookmark) {
        throw new Error('Bookmark not found');
      }

      const bookmarkRef = doc(db, 'project_bookmarks', existingBookmark.id);
      await setDoc(bookmarkRef, {
        reminderDate: null,
        reminderTime: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBookmarks(prev =>
        prev.map(b =>
          b.id === existingBookmark.id
            ? { ...b, reminderDate: undefined, reminderTime: undefined, updatedAt: new Date() }
            : b
        )
      );
    } catch (err: any) {
      console.error('Error removing bookmark reminder:', err);
      throw new Error('Failed to remove bookmark reminder');
    }
  };

  // Get bookmarks by category
  const getBookmarksByCategory = useCallback((category: string): Bookmark[] => {
    return bookmarks.filter(b => b.bookmarkCategory === category);
  }, [bookmarks]);

  // Get all bookmark categories
  const getBookmarkCategories = useCallback((): string[] => {
    return Array.from(new Set(bookmarks.map(b => b.bookmarkCategory).filter(Boolean) as string[]));
  }, [bookmarks]);

  // Share bookmark (generate shareable link)
  const shareBookmark = async (projectId: string): Promise<string> => {
    const bookmark = bookmarks.find(b => b.projectId === projectId);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    const url = `${window.location.origin}/projects/${projectId}`;
    return url;
  };

  return {
    bookmarks,
    loading,
    error,
    isBookmarked,
    getBookmark,
    toggleBookmark,
    updateBookmarkCategory,
    addBookmarkNote,
    setBookmarkReminder,
    removeBookmarkReminder,
    getBookmarksByCategory,
    getBookmarkCategories,
    shareBookmark,
    refreshBookmarks: loadBookmarks,
  };
};

