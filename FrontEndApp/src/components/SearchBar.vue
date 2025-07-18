<script lang="ts" setup>
import { NButton, NCheckbox, NCheckboxGroup, NIcon, NInput, useMessage } from 'naive-ui';
import { computed, ref, watch } from 'vue';
import { searchBibleType } from '../GlobalTypes';
import { highlighter, removeHighlight } from '../util/hilitor';
import { useBibleStore } from '../store/BibleStore';
import { useI18n } from 'vue-i18n';
import { bibleBooks } from '../util/books';
import { Search24Filled } from '@vicons/fluent';
import { useMenuStore } from '../store/menu';

const { t } = useI18n();
const menuStore = useMenuStore();
const focused = ref(false);
const bibleStore = useBibleStore();
const page = ref<number>(1);
const search = ref<null | string>(null);
const searchedVerses = ref<searchBibleType>([]);
const limit = ref(20);
const message = useMessage();
const selectedBookNumbers = ref<Array<number>>(bibleBooks.map((book) => book.book_number));
const showBookSelection = ref(false);
const SearchInputRef = ref();

watch(
    () => search.value,
    (val) => {
        if (!val) {
            search.value = null;
            searchedVerses.value = [];
            page.value = 1;
            window.searchTheBibleTimeOut = setTimeout(() => {
                removeHighlight();
            }, 500);
            return;
        }

        clearTimeout(window.searchTheBibleTimeOut);

        window.searchTheBibleTimeOut = setTimeout(() => {
            if (val && val != '') submitSearch(val);
            else removeHighlight();
        }, 500);
    }
);

function handleSelectedBook() {
    if (!selectedBookNumbers.value.length) {
        message.warning('Select At Least 1 Book');
        return;
    }

    const searchStr = search.value;
    if (searchStr && searchStr.replace(/^\s+|\s+$/gm, '') != '') {
        submitSearch();
    }
    showBookSelection.value = false;
}

function selectAVerse(book_number: number, chapter: number, verse: number) {
    if (menuStore.menuSelected != 'read-bible') {
        menuStore.setMenu('read-bible');
    }

    bibleStore.selectVerse(book_number, chapter, verse);
    bibleStore.AutoScrollSavedPosition(200);
    focused.value = false;

    removeHighlight();

    setTimeout(() => {
        highlighter('input-text-search', search.value as string), 100;
    }, 500);
}

async function submitSearch(searchStr: string | null = search.value) {
    if (!searchStr || searchStr.replace(/^\s+|\s+$/gm, '') == '') {
        message.warning('Please Enter What your looking for 😁');
        return;
    }

    const arg = {
        search: searchStr,
        bible_versions: bibleStore.selectedBibleVersions,
        page: page.value,
        limit: limit.value,
        book_numbers: selectedBookNumbers.value,
    };

    searchedVerses.value = await window.browserWindow.searchBible(JSON.stringify(arg));

    setTimeout(() => {
        highlighter('input-text-search', arg.search);
    }, 100);
}

const selectedBooksForSearchString = computed(() => {
    return bibleBooks
        .filter((book) => selectedBookNumbers.value.includes(book.book_number))
        .map((book) => t(book.title))
        .join(', ');
});
</script>

<template>
    <div v-if="focused" class="fixed top-0 left-0 h-full w-full bg-dark-800 bg-opacity-40" @click="focused = false">
    </div>
    <div class="w-400px flex justify-center top-0 z-999999999 relative">
        <NInput ref="SearchInputRef" size="small" v-model:value="search" :autofocus="false"
            :on-focus="() => (focused = true)" class="transition-all" :class="focused ? '!w-400px' : '!w-300px'"
            clearable :placeholder="$t('Search Bible') + '...'" :round="!focused" @keyup="(key: any) => {
                if (key.key == 'Escape') {
                    focused = false;
                    if (SearchInputRef)
                        SearchInputRef.blur();
                }
            }">
            <template #prefix>
                <NIcon>
                    <Search24Filled />
                </NIcon>
            </template>
        </NInput>
        <div v-show="focused" class="absolute w-full top-10 dark:bg-dark-500 bg-gray-100 rounded-lg shadow-lg">
            <div class="w-full whitespace-nowrap overflow-hidden truncate p-1 dark:bg-dark-500">
                <NButton @click="showBookSelection = true" size="small" tertiary round>Select Book</NButton>
                {{ selectedBooksForSearchString }}
            </div>
            <!-- Select Book Section -->
            <div v-show="showBookSelection"
                class="fixed top-0 left-0 bg-dark-800 bg-opacity-60 w-full h-full z-9999999999">
                <div class="dark:bg-dark-300 bg-gray-100 max-w-800px mx-auto mt-5 rounded-lg p-3 relative">
                    <div class="mb-3 flex justify-between">
                        <div>
                            <NButton class="mr-3" round size="small" @click="selectedBookNumbers = []">Unselect All
                            </NButton>
                            <NButton round size="small"
                                @click="selectedBookNumbers = bibleBooks.map((book) => book.book_number)">
                                Select All
                            </NButton>
                        </div>
                        <div>
                            <NButton class="mr-3" round size="small" @click="handleSelectedBook()"> Close </NButton>
                        </div>
                    </div>
                    <div class="max-h-90vh overflow-auto overflowing-div">
                        <NCheckboxGroup v-model:value="selectedBookNumbers">
                            <div>
                                <template v-for="book in bibleBooks" :key="book.book_number">
                                    <div v-if="book.title == 'Matthew'" class="w-full py-3 font-bold">New Testament
                                    </div>
                                    <div v-else-if="book.title == 'Genesis'" class="w-full py-3 font-bold">Old Testament
                                    </div>
                                    <NCheckbox class="p-1" :label="book.title" :value="book.book_number" />
                                </template>
                            </div>
                        </NCheckboxGroup>
                    </div>
                </div>
            </div>
            <div id="inputTextSearch"
                class="h-[calc(100%-85px)] flex flex-col gap-15px show-chapter-verses dark:bg-dark-500 bg-gray-50 w-full min-h-20vh max-h-75vh overflow-y-auto overflowing-div">
                <div v-if="!searchedVerses.length || !search" class="flex justify-center items-center mt-10">
                    {{ $t('Search Bible') }}
                </div>
                <template v-else>
                    <template v-for="(verse, tabIndex) in searchedVerses">
                        <div v-if="bibleStore.isBookExist(verse.book_number)" :tabindex="tabIndex"
                            class="p-3 dark:hover:bg-dark-100 hover:bg-gray-800 hover:bg-opacity-5 rounded-sm cursor-pointer"
                            @click="selectAVerse(verse.book_number, verse.chapter, verse.verse)">
                            <div class="font-700">
                                {{ bibleStore.getBookShortName(verse.book_number).title }}
                                {{ verse.chapter }}:{{ verse.verse }}
                            </div>
                            <div>
                                <div v-for="version in verse.version">
                                    <span class="mr-7px text-[var(--primary-color)] italic">{{ version.version }}</span>
                                    <div class="input-text-search" v-html="version.text"></div>
                                </div>
                            </div>
                        </div>
                    </template>
                </template>
            </div>
            <div v-show="searchedVerses.length && search != ''" class="flex justify-between px-10px select-none">
                <div>
                    <span v-show="page > 1" class="cursor-pointer hover:text-[var(--primary-color)]" @click="
                        page--;
                    submitSearch();
                    ">
                        {{ $t('Before') }}
                    </span>
                </div>
                <div>
                    <span v-show="searchedVerses.length > 0 && searchedVerses.length == limit"
                        class="cursor-pointer hover:text-[var(--primary-color)]" @click="
                            page++;
                        submitSearch();
                        ">
                        {{ $t('Next') }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
../store/books
