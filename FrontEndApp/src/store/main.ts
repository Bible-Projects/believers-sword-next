import { defineStore } from 'pinia';
import { ref, onBeforeMount } from 'vue';

export const useMainStore = defineStore('useMainStore', () => {
    const version = ref<string | number>('0.0.1');
    const appName = ref<string>('believers sword');
    const showAbout = ref(false);
    const showSettings = ref(false);
    const showDonateModal = ref(false);

    async function getVersions() {
        const versions: {
            chrome: string | number;
            node: string | number;
            electron: string | number;
            version: string | number;
            name: string;
        } = await window.browserWindow.versions();
        version.value = versions.version;
        appName.value = versions.name.replaceAll('-', ' ');

        console.info(
            `This app is using Chrome (v${versions.chrome}), Node.js (v${versions.node}), and Electron (v${
                versions.electron
            }), app version is ${versions.version}. The name is ${versions.name.replaceAll('-', ' ')}`
        );
    }

    onBeforeMount(async () => {
        await getVersions();
    });

    return {
        showSettings,
        showAbout,
        appName,
        version,
        showDonateModal,
    };
});
