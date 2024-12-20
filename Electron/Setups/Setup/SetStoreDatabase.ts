import clip_noteMigration from './StoreDB/clip_note.migration';
import prayerListMigration from './StoreDB/prayerList.migration';
import bookmarksMigration from './StoreDB/bookmarks.migration';
import study_spacesMigration from './StoreDB/study_spaces.migration';
import highlightsMigration from './StoreDB/highlights.migration';

export default async () => {
    // setup clip_notes
    await clip_noteMigration();

    // setup prayer list
    await prayerListMigration();

    // setup bookmark
    await bookmarksMigration();

    // setup highlights
    await highlightsMigration();

    // setup study space
    await study_spacesMigration();
};
