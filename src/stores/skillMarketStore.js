import { computed, ref } from 'vue';
const MOCK_SKILLS = [
    {
        id: '1',
        name: 'Java 代码 Review 助手',
        icon: '💻',
        publisher: '研发一部',
        latestPublishTime: '2024-04-22 14:30',
        level: '开发部 · 终端安全开发一部',
        downloads: 8420,
        rating: 4.8,
        version: '1.2.0',
        versions: [
            { version: '1.2.0', publishTime: '2024-04-22 14:30', note: '初始上架' },
        ],
        tagFunctional: '开发',
        tagOrg: '开发部 · 终端安全开发一部',
    },
    {
        id: '2',
        name: 'CI/CD 故障分析 Skill',
        icon: '🔧',
        publisher: '平台工程组',
        latestPublishTime: '2024-04-21 10:12',
        level: 'PDU · 云平台',
        downloads: 6980,
        rating: 4.6,
        version: '2.0.1',
        versions: [{ version: '2.0.1', publishTime: '2024-04-21 10:12' }],
        tagFunctional: '运维',
        tagOrg: 'PDU · 云平台',
    },
    {
        id: '3',
        name: '界面设计走查 Skill',
        icon: '📐',
        publisher: '设计组',
        latestPublishTime: '2024-04-20 09:00',
        level: '开发部 · 体验设计',
        downloads: 6210,
        rating: 4.9,
        version: '1.0.3',
        versions: [{ version: '1.0.3', publishTime: '2024-04-20 09:00' }],
        tagFunctional: '设计',
        tagOrg: '开发部 · 体验设计',
    },
    {
        id: '4',
        name: '迭代周报生成 Skill',
        icon: '📝',
        publisher: '项目管理组',
        latestPublishTime: '2024-04-19 16:00',
        level: '项目管理组',
        downloads: 3960,
        rating: 4.5,
        version: '1.1.0',
        versions: [{ version: '1.1.0', publishTime: '2024-04-19 16:00' }],
        tagFunctional: '办公',
        tagOrg: '项目管理组',
    },
    {
        id: '5',
        name: '日志分析 Skill',
        icon: '📊',
        publisher: '个人',
        latestPublishTime: '2024-04-18 11:20',
        level: '个人',
        downloads: 128,
        rating: 4.2,
        version: '0.9.0',
        versions: [{ version: '0.9.0', publishTime: '2024-04-18 11:20' }],
        tagFunctional: '运维',
        tagOrg: '个人',
    },
    {
        id: '6',
        name: '技术方案评审 Skill',
        icon: '📋',
        publisher: '架构组',
        latestPublishTime: '2024-04-17 09:45',
        level: '唯一产品线',
        downloads: 4250,
        rating: 4.7,
        version: '1.0.0',
        versions: [{ version: '1.0.0', publishTime: '2024-04-17 09:45' }],
        tagFunctional: '设计',
        tagOrg: '唯一产品线',
    },
];
function bumpPatchVersion(current) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(current.trim());
    if (!m) {
        return `${current}-next`;
    }
    const major = Number(m[1]);
    const minor = Number(m[2]);
    const patch = Number(m[3]) + 1;
    return `${major}.${minor}.${patch}`;
}
function nextInitialVersion() {
    return '1.0.0';
}
export function createSkillMarketStore() {
    const skills = ref([...MOCK_SKILLS]);
    const totalSkills = computed(() => skills.value.length);
    const totalDownloads = computed(() => skills.value.reduce((sum, s) => sum + s.downloads, 0));
    const downloadsLast30Days = computed(() => Math.floor(totalDownloads.value * 0.1));
    const orgCount = computed(() => 16);
    function findByName(name) {
        const n = name.trim();
        return skills.value.find((s) => s.name === n);
    }
    /**
     * 上传：若名称与已有 Skill 相同，则视为新版本更新（追加 versions、更新 version 与发布时间）
     */
    function uploadSkill(payload) {
        const name = payload.name.trim();
        if (!name) {
            throw new Error('Skill 名称不能为空');
        }
        const existing = findByName(name);
        const now = new Date();
        const publishTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (existing) {
            const nextVer = bumpPatchVersion(existing.version);
            const entry = {
                version: nextVer,
                publishTime,
                note: payload.note,
            };
            existing.versions = [...existing.versions, entry];
            existing.version = nextVer;
            existing.latestPublishTime = publishTime;
            existing.publisher = payload.publisher.trim() || existing.publisher;
            existing.ownedByUser = true;
            return { created: false, skill: existing };
        }
        const id = `${Date.now()}`;
        const ver = nextInitialVersion();
        const pub = payload.publisher.trim() || '当前用户';
        const skill = {
            id,
            name,
            icon: '📎',
            publisher: pub,
            latestPublishTime: publishTime,
            level: '研发平台 · 唯一产品线',
            downloads: 0,
            rating: 5,
            version: ver,
            versions: [{ version: ver, publishTime, note: payload.note ?? '首次发布' }],
            ownedByUser: true,
            tagFunctional: '通用',
            tagOrg: '研发平台 · 唯一产品线',
        };
        skills.value = [skill, ...skills.value];
        return { created: true, skill };
    }
    function recordDownload(skillId) {
        const s = skills.value.find((x) => x.id === skillId);
        if (s) {
            s.downloads += 1;
        }
    }
    return {
        skills,
        totalSkills,
        totalDownloads,
        downloadsLast30Days,
        orgCount,
        uploadSkill,
        recordDownload,
        findByName,
    };
}
let singleton = null;
export function useSkillMarketStore() {
    if (!singleton) {
        singleton = createSkillMarketStore();
    }
    return singleton;
}
