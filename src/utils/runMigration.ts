/**
 * Migration Runner - Execute in Browser Console
 *
 * This utility makes the migration functions available in the browser console
 * so they can be executed manually with proper authentication.
 */

import { migrateVisibility, migrateIndividualDocument } from '../scripts/migrateVisibility';

export function setupMigrationTools() {
  if (typeof window !== 'undefined') {
    (window as any).runVisibilityMigration = async () => {
      console.log('Starting visibility migration...');
      console.log('This will set isVisible=true for all approved submissions.');

      try {
        const result = await migrateVisibility();

        console.log('\n=== MIGRATION COMPLETE ===');
        console.log(`Projects updated: ${result.projectsUpdated}`);
        console.log(`Events updated: ${result.eventsUpdated}`);

        if (result.errors.length > 0) {
          console.error('Errors encountered:', result.errors);
        } else {
          console.log('No errors encountered!');
        }

        return result;
      } catch (error) {
        console.error('Migration failed:', error);
        throw error;
      }
    };

    (window as any).migrateSubmission = async (
      type: 'project' | 'event',
      documentId: string
    ) => {
      const collection = type === 'project' ? 'project_submissions' : 'event_submissions';
      console.log(`Migrating ${collection}/${documentId}...`);

      const success = await migrateIndividualDocument(collection, documentId);

      if (success) {
        console.log('✓ Migration successful');
      } else {
        console.error('✗ Migration failed');
      }

      return success;
    };

    console.log('%c🔧 Migration Tools Loaded', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('%cAvailable commands:', 'color: #2196F3; font-weight: bold;');
    console.log('  • runVisibilityMigration() - Migrate all approved submissions');
    console.log('  • migrateSubmission(type, id) - Migrate a single document');
    console.log('    Example: migrateSubmission("project", "abc123")');
  }
}
