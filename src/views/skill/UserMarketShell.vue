<script setup lang="ts">
import { computed, ref } from 'vue';
import type { OverviewQuickFilter, UserInnerTab } from '../../types/skill';
import SkillCard from '../../components/skill/SkillCard.vue';
import UploadSkillModal from '../../components/skill/UploadSkillModal.vue';
import { useSkillMarketStore } from '../../stores/skillMarketStore';
import type { Skill } from '../../types/skill';

const store = useSkillMarketStore();
const { skills } = store;

const innerTab = ref<UserInnerTab>('overview');
const uploadOpen = ref(false);
const search = ref('');
const levelFilter = ref('all');
const sceneFilter = ref('all');
const quickFilter = ref<OverviewQuickFilter>('all');

const toast = ref('');

const versionPanelSkill = ref<Skill | null>(null);

const quickEntries: { key: OverviewQuickFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'personal', label: '个人' },
  { key: 'devDept', label: '开发部' },
  { key: 'pdu', label: 'PDU' },
  { key: 'productLine', label: '产品线' },
  { key: 'recent', label: '最近更新' },
  { key: 'highDl', label: '高下载' },
];

function comparePublishTime(a: Skill, b: Skill): number {
  if (a.latestPublishTime === b.latestPublishTime) {
    return 0;
  }
  return a.latestPublishTime < b.latestPublishTime ? 1 : -1;
}

const filteredSkills = computed(() => {
  let list = [...skills.value];
  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.publisher.toLowerCase().includes(q) ||
        s.level.toLowerCase().includes(q) ||
        s.tagOrg.toLowerCase().includes(q) ||
        s.tagFunctional.toLowerCase().includes(q),
    );
  }
  if (quickFilter.value === 'personal') {
    list = list.filter(
      (s) =>
        s.tagOrg.includes('个人') ||
        s.publisher.includes('个人') ||
        Boolean(s.ownedByUser),
    );
  }
  if (quickFilter.value === 'devDept') {
    list = list.filter((s) => s.tagFunctional === '开发' || s.tagOrg.includes('开发部'));
  }
  if (quickFilter.value === 'pdu') {
    list = list.filter((s) => s.tagOrg.includes('PDU') || s.level.includes('PDU'));
  }
  if (quickFilter.value === 'productLine') {
    list = list.filter((s) => s.tagOrg.includes('产品线') || s.level.includes('产品线'));
  }
  if (quickFilter.value === 'recent') {
    list = [...list].sort(comparePublishTime).slice(0, 4);
  }
  if (quickFilter.value === 'highDl') {
    list = list.filter((s) => s.downloads >= 3000);
  }
  if (levelFilter.value !== 'all') {
    list = list.filter((s) => s.level.includes(levelFilter.value));
  }
  if (sceneFilter.value === 'review') {
    list = list.filter((s) => s.name.includes('Review') || s.name.includes('审查'));
  }
  if (sceneFilter.value === 'cicd') {
    list = list.filter((s) => s.name.toUpperCase().includes('CI') || s.name.includes('流水线'));
  }
  return list;
});

const myReleases = computed(() => skills.value.filter((s) => s.ownedByUser));

function openUpload(): void {
  uploadOpen.value = true;
}

function goTab(tab: UserInnerTab): void {
  innerTab.value = tab;
}

function onUploadSubmit(payload: { name: string; publisher: string; note: string }): void {
  try {
    const r = store.uploadSkill(payload);
    if (r.created) {
      toast.value = `已发布新 Skill「${r.skill.name}」v${r.skill.version}`;
    } else {
      toast.value = `同名 Skill 已更新为 v${r.skill.version}（版本追加）`;
    }
  } catch (e) {
    toast.value = e instanceof Error ? e.message : '上传失败';
  }
  setTimeout(() => {
    toast.value = '';
  }, 4000);
}

function onDownload(id: string): void {
  store.recordDownload(id);
  toast.value = '已开始下载（演示：下载量 +1）';
  setTimeout(() => {
    toast.value = '';
  }, 2500);
}

function onViewVersions(id: string): void {
  const s = skills.value.find((x) => x.id === id);
  if (s) {
    versionPanelSkill.value = s;
  }
}

function closeVersionPanel(): void {
  versionPanelSkill.value = null;
}

// 为贴近 UI 设计稿：指标展示按稿面数值
const uiStats = {
  skills: '128',
  totalDownloads: '48,260',
  last30Days: '4,826',
  orgs: '16',
} as const;

// 为贴近 UI 设计稿：我的发布指标按稿面数值
const uiMyStats = {
  maintained: '8',
  reviewing: '3',
  rejected: '1',
  myTotalDownloads: '1,278',
  my30DaysDownloads: '326',
} as const;

const coreQuickEntries: { key: 'all' | 'devDept' | 'pdu' | 'productLine'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'devDept', label: '开发部' },
  { key: 'pdu', label: 'PDU' },
  { key: 'productLine', label: '产品线' },
];

const coreLevelStats: { key: string; label: string; count: number }[] = [
  { key: 'core', label: 'CoreHarness', count: 9 },
  { key: 'dev', label: '开发部级', count: 4 },
  { key: 'pdu', label: 'PDU级', count: 3 },
  { key: 'pl', label: '产品线级', count: 2 },
];

const coreQuick = ref<'all' | 'devDept' | 'pdu' | 'productLine'>('all');
const coreSearch = ref('');

const coreSkills = computed(() => {
  let list = [...skills.value];
  const q = coreSearch.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.publisher.toLowerCase().includes(q) ||
        s.tagOrg.toLowerCase().includes(q) ||
        s.tagFunctional.toLowerCase().includes(q),
    );
  }
  if (coreQuick.value === 'devDept') {
    list = list.filter((s) => s.tagOrg.includes('开发部') || s.level.includes('开发部'));
  }
  if (coreQuick.value === 'pdu') {
    list = list.filter((s) => s.tagOrg.includes('PDU') || s.level.includes('PDU'));
  }
  if (coreQuick.value === 'productLine') {
    list = list.filter((s) => s.tagOrg.includes('产品线') || s.level.includes('产品线'));
  }
  return list;
});

function onApplyCoreHarness(): void {
  toast.value = '已提交申请（演示）：将你的 Skill 纳入 CoreHarness';
  setTimeout(() => {
    toast.value = '';
  }, 2500);
}

type ReleaseFilterKey =
  | 'all'
  | 'personal'
  | 'published'
  | 'reviewing'
  | 'rejected'
  | 'coreApply';

const releaseFilter = ref<ReleaseFilterKey>('all');

const releaseFilters: { key: ReleaseFilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'personal', label: '个人层级' },
  { key: 'published', label: '已发布' },
  { key: 'reviewing', label: '审核中' },
  { key: 'rejected', label: '被驳回' },
  { key: 'coreApply', label: 'CoreHarness 申请' },
];

type ReleaseStatusKey = 'published' | 'reviewing-dev' | 'rejected-pdu';

function statusOf(skill: Skill): ReleaseStatusKey {
  if (skill.id === '2') {
    return 'rejected-pdu';
  }
  if (skill.id === '4') {
    return 'reviewing-dev';
  }
  return 'published';
}

function statusText(st: ReleaseStatusKey): string {
  if (st === 'published') {
    return '已发布';
  }
  if (st === 'reviewing-dev') {
    return '开发部审核中';
  }
  return 'PDU 审核驳回';
}

function lastActionText(st: ReleaseStatusKey): string {
  if (st === 'published') {
    return '可申请升级到开发部级';
  }
  if (st === 'reviewing-dev') {
    return '等待终端安全开发一部审核';
  }
  return '需补充复现数据和说明文档';
}

const myReleaseRows = computed(() => {
  const list = myReleases.value.length > 0 ? myReleases.value : skills.value.slice(0, 4);
  return list.map((s) => {
    const st = statusOf(s);
    const isPersonal = s.level.includes('个人') || s.tagOrg.includes('个人');
    return {
      skill: s,
      statusKey: st,
      statusLabel: statusText(st),
      lastAction: lastActionText(st),
      personal: isPersonal,
      coreApply: s.id === '1' || s.id === '3',
    };
  });
});

const filteredMyReleaseRows = computed(() => {
  let list = [...myReleaseRows.value];
  if (releaseFilter.value === 'personal') {
    list = list.filter((x) => x.personal);
  }
  if (releaseFilter.value === 'published') {
    list = list.filter((x) => x.statusKey === 'published');
  }
  if (releaseFilter.value === 'reviewing') {
    list = list.filter((x) => x.statusKey === 'reviewing-dev');
  }
  if (releaseFilter.value === 'rejected') {
    list = list.filter((x) => x.statusKey === 'rejected-pdu');
  }
  if (releaseFilter.value === 'coreApply') {
    list = list.filter((x) => x.coreApply);
  }
  return list;
});

function toastAction(message: string): void {
  toast.value = message;
  setTimeout(() => {
    toast.value = '';
  }, 2500);
}

function onUploadExistingVersion(): void {
  toastAction('上传已有 Skill 新版本（演示）：请在弹窗中选择同名 Skill 以追加版本');
  openUpload();
}

// 为贴近 UI 设计稿：运营看板的数据展示按稿面数值
const uiOpsStats = {
  totalSkills: '128',
  totalDownloads: '48,260',
  last30Days: '4,826',
  upgradeRequests: '18',
  activeMaintainers: '42',
} as const;

const uiLevelDist = [
  { key: 'personal', label: '个人', count: 44, color: '#1677ff' },
  { key: 'dev', label: '开发部', count: 42, color: '#1677ff' },
  { key: 'pdu', label: 'PDU', count: 27, color: '#1677ff' },
  { key: 'pl', label: '产品线', count: 15, color: '#1677ff' },
] as const;

const uiPduRank = [
  { label: 'PDU-终端安全', count: 27 },
  { label: 'PDU-云平台', count: 21 },
  { label: 'PDU-智能座舱', count: 17 },
] as const;

const uiDevRank = [
  { label: '终端安全开发一部', count: 18 },
  { label: '终端安全开发二部', count: 15 },
  { label: '云服务开发部', count: 12 },
  { label: '平台工具开发部', count: 8 },
] as const;

const uiTopSkills = computed(() =>
  [...skills.value]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5)
    .map((s, idx) => ({
      rank: idx + 1,
      name: s.name,
      level: s.level.includes('·') ? s.level.split('·')[0].trim() : s.level,
      downloads: s.downloads,
    })),
);

type OpsSceneKey = 'dev' | 'test' | 'maint' | 'design' | 'office' | 'other';

const uiSceneDist: {
  key: OpsSceneKey;
  label: string;
  percent: number;
  color: string;
  skills: number;
  downloads: number;
  top: string;
}[] = [
  {
    key: 'dev',
    label: '开发',
    percent: 32.8,
    color: '#1677ff',
    skills: 42,
    downloads: 18600,
    top: 'Java 代码 Review 助手',
  },
  {
    key: 'test',
    label: '测试',
    percent: 18.0,
    color: '#722ed1',
    skills: 23,
    downloads: 9420,
    top: '测试用例生成 Skill',
  },
  {
    key: 'maint',
    label: '维护',
    percent: 14.8,
    color: '#13c2c2',
    skills: 19,
    downloads: 7840,
    top: '日志分析 Skill',
  },
  {
    key: 'design',
    label: '设计',
    percent: 12.5,
    color: '#faad14',
    skills: 16,
    downloads: 6300,
    top: '接口设计检查 Skill',
  },
  {
    key: 'office',
    label: '办公',
    percent: 16.4,
    color: '#52c41a',
    skills: 21,
    downloads: 5760,
    top: '迭代周报生成 Skill',
  },
  {
    key: 'other',
    label: '其他',
    percent: 5.5,
    color: '#bfbfbf',
    skills: 7,
    downloads: 1240,
    top: '通用问答 Skill',
  },
];

const donutSegments = computed(() => {
  const total = uiSceneDist.reduce((sum, x) => sum + x.percent, 0);
  const normalized = uiSceneDist.map((x) => ({
    ...x,
    pct: total > 0 ? x.percent / total : 0,
  }));
  let acc = 0;
  return normalized.map((x) => {
    const start = acc;
    acc += x.pct;
    return {
      ...x,
      dash: `${(x.pct * 100).toFixed(4)} ${(100 - x.pct * 100).toFixed(4)}`,
      offset: (100 - start * 100).toFixed(4),
    };
  });
});
</script>

<template>
  <div class="user-shell">
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-title">把你的日常作业经验沉淀成可复用的 Skill</h1>
        <p class="hero-desc">
          Skill 是将脚本、文档、检查清单等日常能力打包后的可复用单元，便于在团队内发现与下载。个人上传默认仅对自己可见；进入市场总览需经分层发布与管理员审批。同名 Skill 再次上传将自动作为该条目的新版本。
        </p>
        <div class="hero-actions">
          <button type="button" class="btn primary" @click="openUpload">
            <span class="up">↑</span> 上传 Skill
          </button>
        </div>
      </div>
    </section>

    <nav class="sub-tabs" :class="{ 'ops-tabs': innerTab === 'ops' }" aria-label="市场分区">
      <button
        type="button"
        class="sub-tab"
        :class="{ on: innerTab === 'overview' }"
        @click="goTab('overview')"
      >
        市场总览
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ on: innerTab === 'core' }"
        @click="goTab('core')"
      >
        CoreHarness
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ on: innerTab === 'releases' }"
        @click="goTab('releases')"
      >
        我的发布
      </button>
      <button
        type="button"
        class="sub-tab"
        :class="{ on: innerTab === 'ops' }"
        @click="goTab('ops')"
      >
        运营看板
      </button>
    </nav>

    <div v-if="innerTab === 'overview'" class="panel tab-panel overview-panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">市场总览</h2>
          <p class="panel-help">卡片右上角 &quot;...&quot; 仅提供下载到本地。</p>
        </div>
        <button type="button" class="btn primary sm" @click="openUpload">
          <span class="up">↑</span> 上传 Skill
        </button>
      </div>

      <div class="stats-strip" role="group" aria-label="市场指标">
        <div class="stat-cell">
          <span class="stat-k">Skill</span>
          <span class="stat-v">{{ uiStats.skills }}</span>
        </div>
        <div class="stat-div" aria-hidden="true" />
        <div class="stat-cell">
          <span class="stat-k">累计下载</span>
          <span class="stat-v">{{ uiStats.totalDownloads }}</span>
        </div>
        <div class="stat-div" aria-hidden="true" />
        <div class="stat-cell">
          <span class="stat-k">近 30 天下载</span>
          <span class="stat-v">{{ uiStats.last30Days }}</span>
        </div>
        <div class="stat-div" aria-hidden="true" />
        <div class="stat-cell">
          <span class="stat-k">覆盖组织</span>
          <span class="stat-v">{{ uiStats.orgs }}</span>
        </div>
      </div>

      <div class="filter-block">
        <div class="quick-row">
          <span class="quick-label">快捷入口</span>
          <div class="quick-pills">
            <button
              v-for="item in quickEntries"
              :key="item.key"
              type="button"
              class="pill"
              :class="{ active: quickFilter === item.key }"
              @click="quickFilter = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="filters">
          <input
            v-model="search"
            class="search"
            type="search"
            placeholder="搜索 Skill 名称 / 维护方 / 目标系统"
          />
          <select v-model="levelFilter" class="select">
            <option value="all">全部层级 / 全部组织</option>
            <option value="开发部">开发部</option>
            <option value="平台部">平台部</option>
            <option value="研发平台">研发平台</option>
          </select>
          <select v-model="sceneFilter" class="select">
            <option value="all">全部场景</option>
            <option value="review">代码审查</option>
            <option value="cicd">CI/CD</option>
          </select>
        </div>
      </div>

      <div class="grid">
        <SkillCard
          v-for="s in filteredSkills"
          :key="s.id"
          :skill="s"
          menu-mode="download-only"
          @download="onDownload"
          @view-versions="onViewVersions"
        />
      </div>
    </div>

    <div v-else-if="innerTab === 'core'" class="panel tab-panel core">
      <div class="core-alert" role="note" aria-label="CoreHarness 提示">
        <strong>CoreHarness</strong> 是独立资产产线，区分开发部级 / PDU / 产品线三个层级。用户不能直接发布
        CoreHarness，只能申请把自己的 Skill 转为 CoreHarness；申请将到哪一级，就由哪一级管理员审核，审核通过后自动发布。
      </div>

      <div class="core-head">
        <div>
          <h2 class="panel-title">CoreHarness 列表</h2>
          <p class="panel-help">采用与市场总览一致的卡片形式展示，点击卡片可查看组成、来源 Skill 和发布说明。</p>
        </div>
        <button type="button" class="btn outline sm" @click="onApplyCoreHarness">申请转为 CoreHarness</button>
      </div>

      <div class="core-levels" role="group" aria-label="CoreHarness 层级统计">
        <span v-for="x in coreLevelStats" :key="x.key" class="lvl-pill">
          <span class="lvl-k">{{ x.label }}</span>
          <span class="lvl-v">{{ x.count }}</span>
        </span>
      </div>

      <div class="filter-block core-filter">
        <div class="quick-row">
          <span class="quick-label">快捷入口</span>
          <div class="quick-pills">
            <button
              v-for="item in coreQuickEntries"
              :key="item.key"
              type="button"
              class="pill"
              :class="{ active: coreQuick === item.key }"
              @click="coreQuick = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <div class="filters core-filters">
          <input
            v-model="coreSearch"
            class="search"
            type="search"
            placeholder="搜索 Skill 名称 / 维护方 / 目标系统"
          />
          <div class="core-spacer" aria-hidden="true" />
          <div class="core-spacer" aria-hidden="true" />
        </div>
      </div>

      <div class="grid">
        <SkillCard
          v-for="s in coreSkills"
          :key="s.id"
          :skill="s"
          variant="coreHarness"
          menu-mode="full"
          @download="onDownload"
          @view-versions="onViewVersions"
        />
      </div>
    </div>

    <div v-else-if="innerTab === 'releases'" class="panel tab-panel">
      <div class="panel-head">
        <div>
          <h2 class="panel-title">我的发布</h2>
          <p class="panel-help">聚合我维护的 Skill、升级申请、新版本和 CoreHarness 转换申请。</p>
        </div>
        <button type="button" class="btn primary sm" @click="openUpload">
          <span class="up">↑</span> 上传新 Skill
        </button>
      </div>

      <div class="my-stats" role="group" aria-label="我的发布指标">
        <div class="my-cell">
          <span class="my-k">我维护的 Skill</span>
          <span class="my-v">{{ uiMyStats.maintained }}</span>
        </div>
        <div class="my-div" aria-hidden="true" />
        <div class="my-cell">
          <span class="my-k">审核中</span>
          <span class="my-v">{{ uiMyStats.reviewing }}</span>
        </div>
        <div class="my-div" aria-hidden="true" />
        <div class="my-cell">
          <span class="my-k">被驳回</span>
          <span class="my-v">{{ uiMyStats.rejected }}</span>
        </div>
        <div class="my-div" aria-hidden="true" />
        <div class="my-cell">
          <span class="my-k">我的累计下载</span>
          <span class="my-v">{{ uiMyStats.myTotalDownloads }}</span>
        </div>
        <div class="my-div" aria-hidden="true" />
        <div class="my-cell">
          <span class="my-k">我的近 30 天下载</span>
          <span class="my-v">{{ uiMyStats.my30DaysDownloads }}</span>
        </div>
      </div>

      <div class="my-toolbar">
        <div class="my-filters" role="tablist" aria-label="我的发布筛选">
          <button
            v-for="f in releaseFilters"
            :key="f.key"
            type="button"
            class="seg"
            :class="{ on: releaseFilter === f.key }"
            @click="releaseFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
        <button type="button" class="btn outline sm" @click="onUploadExistingVersion">
          上传已有 Skill 新版本
        </button>
      </div>

      <div class="table-wrap my-table-wrap">
        <table class="table my-table">
          <thead>
            <tr>
              <th class="col-skill">Skill</th>
              <th class="col-level">当前层级</th>
              <th class="col-ver">最新版本</th>
              <th class="col-status">状态</th>
              <th class="col-dl">下载量</th>
              <th class="col-action">最近动作</th>
              <th class="col-ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredMyReleaseRows" :key="row.skill.id">
              <td>
                <div class="skill-main">
                  <strong class="skill-name">{{ row.skill.name }}</strong>
                  <div class="skill-sub">
                    <span>维护方：{{ row.skill.publisher }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="cell-main">{{ row.skill.level.split('·')[0]?.trim() || row.skill.level }}</div>
                <div class="cell-sub">{{ row.skill.level }}</div>
              </td>
              <td>
                <div class="cell-main">{{ row.skill.version }}</div>
                <div class="cell-sub">{{ row.skill.latestPublishTime }}</div>
              </td>
              <td>
                <span class="st" :class="`st-${row.statusKey}`">{{ row.statusLabel }}</span>
              </td>
              <td class="num">{{ row.skill.downloads.toLocaleString('zh-CN') }}</td>
              <td class="cell-sub">{{ row.lastAction }}</td>
              <td>
                <div class="ops">
                  <button type="button" class="mini" @click="toastAction('新版本（演示）：打开上传弹窗并追加版本')">
                    新版本
                  </button>
                  <button type="button" class="mini" @click="toastAction('升级（演示）：提交层级升级申请')">
                    升级
                  </button>
                  <button type="button" class="mini" @click="toastAction('转 CoreHarness（演示）：提交转换申请')">
                    转 CoreHarness
                  </button>
                  <button type="button" class="mini" @click="toastAction('记录（演示）：打开操作记录面板')">
                    记录
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredMyReleaseRows.length === 0">
              <td colspan="7" class="empty-row">暂无符合条件的数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="panel tab-panel ops">
      <div class="ops-alert" role="note" aria-label="运营看板提示">
        <strong>运营看板口径</strong>：只统计 Skill，不统计 CoreHarness。普通用户和管理员都可以看到运营看板，用于对比趋势。
      </div>

      <div class="ops-kpis" role="group" aria-label="运营指标">
        <div class="kpi-card">
          <div class="kpi-k">Skill 总数量</div>
          <div class="kpi-v">{{ uiOpsStats.totalSkills }}</div>
          <div class="kpi-sub">Skill，不含 CoreHarness</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-k">总下载量</div>
          <div class="kpi-v">{{ uiOpsStats.totalDownloads }}</div>
          <div class="kpi-sub">Skill 累计下载</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-k">全市场近 30 天下载</div>
          <div class="kpi-v">{{ uiOpsStats.last30Days }}</div>
          <div class="kpi-sub">Skill 近 30 天下载量</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-k">升级申请中</div>
          <div class="kpi-v">{{ uiOpsStats.upgradeRequests }}</div>
          <div class="kpi-sub">开发部 / PDU / 产品线审核中</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-k">活跃维护人</div>
          <div class="kpi-v">{{ uiOpsStats.activeMaintainers }}</div>
          <div class="kpi-sub">近 30 天有过维护动作</div>
        </div>
      </div>

      <section class="ops-count-block">
        <div class="blk-head">
          <h3 class="blk-title">层级数量分布</h3>
          <p class="blk-help">个人、开发部、PDU、产品线四层级 Skill 分布，一键看趋势。</p>
        </div>
        <div class="lvl-bars" role="list" aria-label="层级分布条">
          <div v-for="x in uiLevelDist" :key="x.key" class="lvl-row" role="listitem">
            <div class="lvl-name">{{ x.label }}</div>
            <div class="lvl-track" aria-hidden="true">
              <div
                class="lvl-fill"
                :style="{ width: `${(x.count / uiLevelDist[0].count) * 100}%` }"
              />
            </div>
            <div class="lvl-num">{{ x.count }}</div>
          </div>
        </div>
      </section>

      <div class="ops-2col">
        <section class="ops-block">
          <div class="blk-head">
            <h3 class="blk-title">PDU 排名</h3>
            <p class="blk-help">按具体 PDU 展示 Skill 发布数量，兼容查看下载量 TOP 5 Skill。</p>
          </div>
          <div class="rank-list" role="list" aria-label="PDU 排名列表">
            <div v-for="(x, i) in uiPduRank" :key="x.label" class="rank-row" role="listitem">
              <div class="rank-left">
                <span class="rk">{{ i + 1 }}.</span>
                <strong class="rname">{{ x.label }}</strong>
              </div>
              <div class="rank-right">
                <span class="rcount">{{ x.count }} 个 Skill</span>
              </div>
              <div class="rbar" aria-hidden="true">
                <div class="rfill" :style="{ width: `${(x.count / uiPduRank[0].count) * 100}%` }" />
              </div>
            </div>
          </div>
        </section>

        <section class="ops-block">
          <div class="blk-head">
            <h3 class="blk-title">开发部排名</h3>
            <p class="blk-help">按具体开发部展示 Skill 发布数量，兼容查看下载量 TOP 5 Skill。</p>
          </div>
          <div class="rank-list" role="list" aria-label="开发部排名列表">
            <div v-for="(x, i) in uiDevRank" :key="x.label" class="rank-row" role="listitem">
              <div class="rank-left">
                <span class="rk">{{ i + 1 }}.</span>
                <strong class="rname">{{ x.label }}</strong>
              </div>
              <div class="rank-right">
                <span class="rcount">{{ x.count }} 个 Skill</span>
              </div>
              <div class="rbar" aria-hidden="true">
                <div class="rfill" :style="{ width: `${(x.count / uiDevRank[0].count) * 100}%` }" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="ops-2col bottom">
        <section class="ops-block">
          <div class="blk-head">
            <h3 class="blk-title">TOP 使用 Skill</h3>
            <p class="blk-help">仅统计 Skill。</p>
          </div>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 72px">排名</th>
                  <th>Skill</th>
                  <th style="width: 120px">层级</th>
                  <th style="width: 120px">下载量</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="x in uiTopSkills" :key="x.rank + x.name">
                  <td class="num">{{ x.rank }}</td>
                  <td>{{ x.name }}</td>
                  <td class="cell-sub">{{ x.level }}</td>
                  <td class="num">{{ x.downloads.toLocaleString('zh-CN') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="ops-block">
          <div class="blk-head">
            <h3 class="blk-title">使用场景分布</h3>
            <p class="blk-help">按使用场景展示 Skill 数量占比、下载量占比（含 Skill）。</p>
          </div>

          <div class="scene">
            <div class="donut" aria-label="使用场景分布圆环图">
              <svg viewBox="0 0 42 42" class="donut-svg" aria-hidden="true">
                <circle class="donut-bg" cx="21" cy="21" r="15.9155" />
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.key"
                  class="donut-seg"
                  cx="21"
                  cy="21"
                  r="15.9155"
                  :stroke="seg.color"
                  :stroke-dasharray="seg.dash"
                  :stroke-dashoffset="seg.offset"
                />
              </svg>
              <div class="donut-center">使用场景</div>
            </div>

            <div class="scene-list" role="list" aria-label="使用场景列表">
              <div v-for="x in uiSceneDist" :key="x.key" class="scene-item" role="listitem">
                <div class="scene-top">
                  <span class="dot" :style="{ background: x.color }" aria-hidden="true" />
                  <strong class="sname">{{ x.label }}</strong>
                  <span class="spct">{{ x.percent.toFixed(1) }}%</span>
                </div>
                <div class="scene-sub">
                  {{ x.skills }} 个 Skill · 下载量 {{ x.downloads.toLocaleString('zh-CN') }} · TOP：{{ x.top }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <UploadSkillModal v-model="uploadOpen" @submit="onUploadSubmit" />

    <Teleport to="body">
      <div v-if="versionPanelSkill" class="overlay" role="presentation" @click.self="closeVersionPanel">
        <div class="v-dialog" role="dialog" aria-modal="true">
          <div class="v-head">
            <strong>{{ versionPanelSkill.name }}</strong>
            <button type="button" class="close-x" aria-label="关闭" @click="closeVersionPanel">×</button>
          </div>
          <p class="v-sub">当前展示版本：{{ versionPanelSkill.version }}</p>
          <ul class="v-list">
            <li v-for="v in [...versionPanelSkill.versions].reverse()" :key="v.version + v.publishTime">
              <span class="ver">{{ v.version }}</span>
              <span class="time">{{ v.publishTime }}</span>
              <span v-if="v.note" class="note">{{ v.note }}</span>
            </li>
          </ul>
        </div>
      </div>
    </Teleport>

    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </div>
</template>

<style scoped>
.user-shell {
  width: 100%;
  max-width: none;
  min-width: 0;
  margin: 0;
  padding: 0 clamp(16px, 2vw, 32px) 32px;
  box-sizing: border-box;
}

.hero {
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  background: linear-gradient(105deg, #e6f4ff 0%, #f0e6ff 100%);
  padding: 26px 28px;
  border: 1px solid #d6e4ff;
}

.hero-inner {
  max-width: none;
  text-align: left;
}

.hero-desc {
  max-width: 980px;
}

.badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(24, 144, 255, 0.12);
  color: #1890ff;
  margin-bottom: 12px;
}

.hero-title {
  margin: 0 0 12px;
  font-size: 26px;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.88);
  font-weight: 700;
}

.hero-desc {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(0, 0, 0, 0.55);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn.primary {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.btn.outline {
  background: #fff;
  border-color: #1890ff;
  color: #1890ff;
}

.btn.sm {
  padding: 6px 14px;
  font-size: 13px;
}

.up {
  font-weight: 700;
}

.sub-tabs {
  display: flex;
  gap: 4px;
  margin-top: 16px;
  width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  padding: 0 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.sub-tab {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 14px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  border-bottom: 2px solid transparent;
  margin-bottom: 0;
  white-space: nowrap;
}

.sub-tab.on {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 500;
}

/* .sub-tabs.ops-tabs {
  align-items: center;
  gap: 22px;
  min-height: 64px;
  padding: 0 22px;
  background: #e8eef7;
  border: 1px solid #cfd9e8;
  border-radius: 8px;
}

.sub-tabs.ops-tabs .sub-tab {
  border-bottom: none;
  border-radius: 8px;
  padding: 10px 14px;
  color: #334155;
  font-weight: 700;
}

.sub-tabs.ops-tabs .sub-tab.on {
  background: #fff;
  color: #0958d9;
  border: 2px solid #111827;
  box-shadow: none;
} */

.panel.tab-panel {
  width: 100%;
  box-sizing: border-box;
  margin-top: 0;
  background: #fff;
  border-radius: 0 0 8px 8px;
  padding: 20px 24px 24px;
  border: 1px solid #f0f0f0;
  border-top: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.panel.tab-panel.overview-panel {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 180px);
  padding: 20px;
  border-color: #e7edf6;
  box-shadow: 0 10px 28px rgba(22, 58, 105, 0.06);
}

.panel.muted {
  min-height: 200px;
}

.panel.core {
  padding-top: 16px;
}

.core-alert {
  background: rgba(250, 173, 20, 0.12);
  border: 1px solid rgba(250, 173, 20, 0.35);
  border-radius: 8px;
  padding: 10px 12px;
  color: rgba(0, 0, 0, 0.72);
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 14px;
}

.core-alert strong {
  color: #d46b08;
  margin-right: 6px;
}

.core-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.core-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  margin-bottom: 14px;
}

.lvl-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #f0f0f0;
  background: #fff;
  font-size: 13px;
}

.lvl-k {
  color: rgba(0, 0, 0, 0.55);
}

.lvl-v {
  color: rgba(0, 0, 0, 0.88);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.filter-block.core-filter {
  padding: 12px;
}

.filters.core-filters {
  grid-template-columns: 1fr 1fr 1fr;
}

.core-spacer {
  height: 34px;
  border: 1px solid transparent;
}

.my-stats {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 0;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 8px;
  margin-bottom: 14px;
}

.my-cell {
  flex: 1 1 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 10px;
}

.my-k {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.my-v {
  font-size: 14px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.88);
  font-variant-numeric: tabular-nums;
}

.my-div {
  width: 1px;
  background: #e8e8e8;
  align-self: stretch;
  min-height: 48px;
  margin: 4px 0;
}

@media (max-width: 820px) {
  .my-div {
    display: none;
  }
}

.my-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.my-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.seg {
  border: 1px solid #d9d9d9;
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  line-height: 1.5;
}

.seg:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.seg.on {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
  font-weight: 500;
}

.table-wrap {
  overflow-x: auto;
  height: 445px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 10px;
  text-align: left;
  vertical-align: top;
}

.table th {
  background: #fafafa;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 500;
}

.my-table th {
  white-space: nowrap;
}

.my-table {
  min-width: 1120px;
}

.col-skill {
  min-width: 260px;
}

.col-level {
  min-width: 150px;
}

.col-ver {
  min-width: 140px;
}

.col-action {
  min-width: 200px;
}

.col-ops {
  min-width: 240px;
}

.skill-main {
  display: grid;
  gap: 4px;
}

.skill-name {
  color: rgba(0, 0, 0, 0.88);
  font-weight: 600;
}

.skill-sub,
.cell-sub {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.6;
}

.cell-main {
  color: rgba(0, 0, 0, 0.88);
  font-size: 13px;
  line-height: 1.6;
}

.num {
  font-variant-numeric: tabular-nums;
}

.st {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
}

.st-published {
  color: #389e0d;
  background: rgba(82, 196, 26, 0.12);
}

.st-reviewing-dev {
  color: #d46b08;
  background: rgba(250, 173, 20, 0.14);
}

.st-rejected-pdu {
  color: #cf1322;
  background: rgba(245, 34, 45, 0.1);
}

.ops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini {
  border: 1px solid #f0f0f0;
  background: #fff;
  color: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.4;
}

.mini:hover {
  border-color: #91d5ff;
  color: #1890ff;
  background: #e6f7ff;
}

.empty-row {
  padding: 18px 10px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
}

.panel.tab-panel.ops {
  padding: 22px 0 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

.ops-alert {
  background: #eff6ff;
  border: 1px solid #b7d5ff;
  border-radius: 8px;
  padding: 16px 18px;
  color: #155bd4;
  font-size: 14px;
  line-height: 1.7;
  margin: 0 0 18px;
  width: 100%;
}

.ops-alert strong {
  color: #064ec4;
  margin-right: 4px;
}

.ops-kpis {
  width: 100%;
  display: grid;
  grid-auto-flow: column;
  grid-template-columns: 265px, 1fr;
  gap: 18px;
  margin-bottom: 24px;
}

/* @media (max-width: 1100px) {
  .ops-kpis {
    grid-template-columns: repeat(2, 1fr);
  }
} */

.kpi-card {
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 16px;
  min-height: 121px;
  box-shadow: 0 14px 32px rgba(18, 52, 91, 0.06);
  box-sizing: border-box;
}

.kpi-k {
  font-size: 13px;
  font-weight: 800;
  color: #51647f;
}

.kpi-v {
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
  font-weight: 700;
  color: #061a3d;
  font-variant-numeric: tabular-nums;
}

.kpi-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #526782;
}

.ops-block,
.ops-count-block {
  background: #fff;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 14px 34px rgba(18, 52, 91, 0.06);
  /* height: 420px; */
}

.ops-count-block {
  width: 100%;
}
.ops-block {
  width: 100%;
}

.blk-head {
  padding: 18px 20px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0;
}

.blk-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #061a3d;
}

.blk-help {
  margin: 0;
  font-size: 13px;
  color: #526782;
  line-height: 1.6;
}

.lvl-bars {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
  height: 140px;
}

.lvl-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) 48px;
  align-items: center;
}

.lvl-name {
  font-size: 13px;
  font-weight: 700;
  color: #061a3d;
}

.lvl-track {
  width: 97%;
  height: 14px;
  background: #eaf0f7;
  border-radius: 999px;
  overflow: hidden;
}

.lvl-fill {
  height: 100%;
  background: linear-gradient(90deg, #08b7ca 0%, #2f5df4 100%);
  border-radius: 999px;
}

.lvl-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #061a3d;
  font-size: 14px;
}

.ops-2col {
  display: flex;
  align-items: start;
  gap: 22px;
  margin-top: 24px;
  width: 100%;
}

.ops-2col.bottom {
  margin-top: 20px;
}

@media (max-width: 1000px) {
  .ops-2col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .lvl-row {
    grid-template-columns: 72px minmax(0, 1fr) 38px;
    gap: 10px;
  }

  .blk-title {
    font-size: 18px;
  }

  .blk-help {
    font-size: 13px;
  }

  .kpi-v {
    font-size: 30px;
  }
}

.ops-block > .table-wrap,
.ops-block > .scene {
  padding: 18px 20px;
}

.panel.tab-panel.ops .table {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0;
}

.panel.tab-panel.ops .table th {
  background: #f8fafc;
  color: #51647f;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.panel.tab-panel.ops .table th,
.panel.tab-panel.ops .table td {
  padding: 12px 18px;
}

.rank-list {
  display: grid;
  gap: 16px;
  padding: 18px 20px;
  height: 354px;
}

.rank-row {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  /* gap: 12px; */
  background: #fff;
}

.rank-left {
  font-size: 13px;
  height: 19px;
  display: inline-flex;
  align-items: center;
  /* gap: 6px; */
}

.rk {
  color: #061a3d;
  font-weight: 700;
}

.rname {
  font-weight: 700;
  color: #061a3d;
}

.rank-right {
  font-size: 13px;
  /* align-self: center; */
  height: 19px;
}

.rcount {
  font-weight: 700;
  color: #536982;
  font-variant-numeric: tabular-nums;
}

.rbar {
  grid-column: 1 / -1;
  height: 12px;
  background: #eaf0f7;
  border-radius: 999px;
  overflow: hidden;
}

.rfill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #8b35e8 100%);
  border-radius: 999px;
}

.scene {
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(280px, 1.1fr);
  gap: 8px;
  align-items: center;
  height: 445px;
}

@media (max-width: 980px) {
  .scene {
    grid-template-columns: 1fr;
  }
}

.donut {
  position: relative;
  width: 250px;
  height: 250px;
  margin: 0 auto;
}

.donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-bg {
  fill: transparent;
  stroke: #f0f0f0;
  stroke-width: 6;
}

.donut-seg {
  fill: transparent;
  stroke-width: 6;
  stroke-linecap: butt;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  font-weight: 600;
}

.scene-list {
  display: grid;
  gap: 10px;
}

.scene-item {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 9px 10px;
  background: #fff;
}

.scene-top {
  font-size: 13px;
  height: 19px;
  display: flex;
  align-items: center;
  gap: 0 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.sname {
  font-size: 13px;
  color: #061a3d;
}

.spct {
  margin-left: auto;
  font-size: 12px;
  color: #061a3d;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.scene-sub {
  margin-top: 6px;
  font-size: 12px;
  color: #526782;
  line-height: 1.6;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-title {
  margin: 0 0 6px;
  font-size: 18px;
  text-align: left;
}

.panel.tab-panel.ops > .panel-title {
  text-align: left;
  margin-bottom: 8px;
}

.panel-help {
  margin: 0;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  text-align: left;
}

.overview-panel .panel-head {
  align-items: center;
  padding: 16px;
  margin-bottom: 14px;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(28, 72, 122, 0.05);
}

.overview-panel .panel-title {
  font-size: 20px;
  color: #10243e;
}

.overview-panel .panel-help {
  color: #667085;
}

.overview-panel .btn.primary.sm {
  height: 34px;
  padding: 0 14px;
  box-shadow: 0 6px 14px rgba(24, 144, 255, 0.18);
  white-space: nowrap;
}

.stats-strip {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  flex-wrap: wrap;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 18px;
  gap: 0;
}

.overview-panel .stats-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  background: transparent;
  border: 0;
  padding: 0;
  margin-bottom: 14px;
}

.stat-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  background-color: #fff;
  border: 1px solid #edf2f7;
  white-space: nowrap;
}

.overview-panel .stat-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 76px;
  gap: 6px;
  padding: 14px 16px;
  background: #fff;
  border-color: #e7edf6;
  box-shadow: 0 4px 14px rgba(28, 72, 122, 0.05);
}

.stat-k {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.overview-panel .stat-k {
  color: #667085;
}

.stat-v {
  font-size: 14px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.88);
  font-variant-numeric: tabular-nums;
}

.overview-panel .stat-v {
  font-size: 24px;
  line-height: 1;
  color: #10243e;
}

.stat-div {
  width: 1px;
  background: #e8e8e8;
  align-self: stretch;
  min-height: 48px;
  margin: 4px 0;
}

.overview-panel .stat-div {
  display: none;
}

@media (max-width: 720px) {
  .stat-div {
    display: none;
  }
}

.filter-block {
  margin-bottom: 20px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px 12px 12px;
}

.overview-panel .filter-block {
  padding: 14px;
  border-color: #e7edf6;
  box-shadow: 0 4px 16px rgba(28, 72, 122, 0.04);
}

.quick-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.overview-panel .quick-row {
  align-items: center;
  margin-bottom: 12px;
}

.quick-label {
  font-size: 13px;
  color: #475467;
  font-weight: 600;
  padding-top: 0;
}

.quick-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.pill {
  border: 1px solid #d9d9d9;
  background: #fafafa;
  color: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  padding: 5px 12px;

}

.overview-panel .pill {
  background: #fff;
  border-color: #d8e1ec;
  border-radius: 999px;
  color: #344054;
}

.pill:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.pill.active {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
  font-weight: 500;
}

.overview-panel .pill.active {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
  box-shadow: 0 5px 12px rgba(22, 119, 255, 0.18);
}

.filters {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(180px, 240px) minmax(160px, 220px);
  gap: 12px;
}

.overview-panel .filters {
  grid-template-columns: minmax(280px, 1fr) minmax(180px, 220px) minmax(160px, 200px);
  gap: 10px;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }

  .overview-panel .filters {
    grid-template-columns: 1fr;
  }
}

.search,
.select {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 6px 11px;
  font-size: 14px;
  height: 34px;
}

.overview-panel .search,
.overview-panel .select {
  height: 38px;
  border-color: #d8e1ec;
  background-color: #fbfdff;
}

.overview-panel .search:focus,
.overview-panel .select:focus {
  border-color: #1677ff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.overview-panel .grid {
  gap: 14px;
}

.overview-panel :deep(.card) {
  min-height: 156px;
  padding: 16px;
  border-color: #e7edf6;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(28, 72, 122, 0.06);
}

.overview-panel :deep(.card:hover) {
  border-color: #b9d7ff;
  box-shadow: 0 10px 24px rgba(28, 72, 122, 0.1);
  transform: translateY(-1px);
}

.overview-panel :deep(.title) {
  font-size: 15px;
  color: #10243e;
}

.overview-panel :deep(.meta) {
  color: #667085;
}

.overview-panel :deep(.more) {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.overview-panel :deep(.more:hover) {
  background: #f2f7ff;
}

.overview-panel :deep(.tag) {
  border-radius: 999px;
  padding: 2px 9px;
}

.overview-panel :deep(.dl-btn) {
  color: #1677ff;
  background: #f2f7ff;
  border-radius: 999px;
  padding: 5px 9px;
}

@media (max-width: 820px) {
  .overview-panel .stats-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .overview-panel .panel-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .panel.tab-panel.overview-panel {
    padding: 14px;
  }

  .overview-panel .stats-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.empty {
  padding: 24px;
  text-align: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.muted-text {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

@media (max-width: 900px) {
  .ops-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

.ops-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

.ops-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

.ops-num {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 600;
  color: #1890ff;
}

.subhead {
  margin: 16px 0 8px;
  font-size: 15px;
}

.rank {
  margin: 0;
  padding-left: 20px;
  color: rgba(0, 0, 0, 0.75);
  font-size: 14px;
  line-height: 1.9;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 16px;
}

.v-dialog {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
}

.v-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.close-x {
  border: none;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.45);
}

.v-sub {
  margin: 0 0 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
}

.v-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow: auto;
}

.v-list li {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  font-size: 13px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.v-list .ver {
  font-weight: 600;
  color: #1890ff;
}

.v-list .time {
  color: rgba(0, 0, 0, 0.45);
}

.v-list .note {
  grid-column: 1 / -1;
  color: rgba(0, 0, 0, 0.65);
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 32px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1100;
  max-width: 90vw;
  text-align: center;
}
</style>
