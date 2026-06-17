import * as XLSX from 'xlsx';
import {
  cloneSkillPlanningItem,
  normalizeProgress,
  normalizeSkillPlanningPayload,
  normalizeText,
  normalizeTextArray,
  rowToSkillPlanningPayload,
  skillPlanningExportHeaders,
  skillPlanningFieldMap,
  type SkillPlanningBatchPatch,
  type SkillPlanningFilterOptions,
  type SkillPlanningImportResult,
  type SkillPlanningItem,
  type SkillPlanningListResult,
  type SkillPlanningPayload,
  type SkillPlanningQuery,
} from './skillPlanningShared';

const initialSkillPlanningItems: SkillPlanningItem[] = [
  {
    id: 'plan-1001',
    primaryScene: '研发提效',
    secondaryScene: '代码生成',
    activity: '需求研发',
    subActivity: '接口开发',
    skillName: '接口 Mock 生成 Skill',
    skillDescription: '根据接口定义自动生成 Mock 数据和联调示例，减少前后端等待时间。',
    level: '平台级',
    owner: '张三',
    department: '平台工具部',
    developer: '李明',
    plannedFinishDate: '2026-07-15',
    progress: '开发中',
  },
  {
    id: 'plan-1002',
    primaryScene: '质量保障',
    secondaryScene: '测试设计',
    activity: '测试验证',
    subActivity: '用例生成',
    skillName: '测试用例评审 Skill',
    skillDescription: '围绕需求说明和历史缺陷生成测试用例评审建议，提升测试覆盖完整度。',
    level: '部门级',
    owner: '李四',
    department: '质量工具组',
    developer: '周扬',
    plannedFinishDate: '2026-08-05',
    progress: '未开始',
  },
  {
    id: 'plan-1003',
    primaryScene: '运营分析',
    secondaryScene: '日志洞察',
    activity: '线上运营',
    subActivity: '异常定位',
    skillName: '日志分析 Skill',
    skillDescription: '汇总异常日志、调用链和发布记录，输出可执行的问题定位摘要。',
    level: '组织级',
    owner: '王五',
    department: '数据平台部',
    developer: '陈七',
    plannedFinishDate: '2026-06-30',
    progress: '联调中',
  },
  {
    id: 'plan-1004',
    primaryScene: '知识管理',
    secondaryScene: '文档沉淀',
    activity: '交付复盘',
    subActivity: '知识入库',
    skillName: '会议纪要沉淀 Skill',
    skillDescription: '从会议记录中抽取决策、风险、待办和关联文档，自动整理到团队知识库。',
    level: '部门级',
    owner: '赵六',
    department: '研发效能部',
    developer: '刘岚',
    plannedFinishDate: '2026-07-28',
    progress: '开发中',
  },
  {
    id: 'plan-1005',
    primaryScene: '发布运维',
    secondaryScene: '变更管控',
    activity: '版本发布',
    subActivity: '发布检查',
    skillName: '发布风险检查 Skill',
    skillDescription: '结合发布单、代码变更和历史事故，生成发布前风险检查清单。',
    level: '平台级',
    owner: '钱慧',
    department: '云平台部',
    developer: '吴越',
    plannedFinishDate: '2026-06-20',
    progress: '已延期',
  },
  {
    id: 'plan-1006',
    primaryScene: '用户支持',
    secondaryScene: '问答助手',
    activity: '服务支持',
    subActivity: '问题分流',
    skillName: '工单智能分派 Skill',
    skillDescription: '按问题类型、系统模块和处理经验自动推荐承接团队与处理路径。',
    level: '组织级',
    owner: '孙宇',
    department: '客户成功部',
    developer: '高宁',
    plannedFinishDate: '2026-09-10',
    progress: '未开始',
  },
  {
    id: 'plan-1007',
    primaryScene: '研发提效',
    secondaryScene: '代码审查',
    activity: '需求研发',
    subActivity: '合并评审',
    skillName: '代码评审摘要 Skill',
    skillDescription: '生成代码改动摘要、风险点和建议关注文件，辅助 reviewer 快速进入上下文。',
    level: '个人级',
    owner: '何佳',
    department: '平台工具部',
    developer: '许安',
    plannedFinishDate: '2026-08-18',
    progress: '开发中',
  },
  {
    id: 'plan-1008',
    primaryScene: '质量保障',
    secondaryScene: '缺陷复盘',
    activity: '问题闭环',
    subActivity: '根因分析',
    skillName: '缺陷根因归纳 Skill',
    skillDescription: '对缺陷描述、提交记录和修复方案进行归纳，输出可复用的质量改进建议。',
    level: '部门级',
    owner: '郑欣',
    department: '质量工具组',
    developer: '马可',
    plannedFinishDate: '2026-07-08',
    progress: '已完成',
  },
];

let skillPlanningItems = [...initialSkillPlanningItems];
let idSeed = 2000;

function matchesDateRange(item: SkillPlanningItem, query: SkillPlanningQuery): boolean {
  const date = item.plannedFinishDate;
  if (query.plannedStartDate && date < query.plannedStartDate) {
    return false;
  }
  if (query.plannedEndDate && date > query.plannedEndDate) {
    return false;
  }
  return true;
}

function matchesDiscreteFilter(value: string, singleValue: string, multiValues: string[]): boolean {
  if (singleValue && value !== singleValue) {
    return false;
  }

  if (multiValues.length > 0 && !multiValues.includes(value)) {
    return false;
  }

  return true;
}

function sortItems(items: SkillPlanningItem[], query: SkillPlanningQuery): SkillPlanningItem[] {
  if (query.sortBy !== 'plannedFinishDate' || !query.sortOrder) {
    return items;
  }

  const sorted = [...items];
  sorted.sort((left, right) => {
    const result = left.plannedFinishDate.localeCompare(right.plannedFinishDate);
    return query.sortOrder === 'asc' ? result : -result;
  });
  return sorted;
}

function distinctValuesInOrder(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function filterItems(query: SkillPlanningQuery): SkillPlanningItem[] {
  const keyword = normalizeText(query.keyword).toLowerCase();
  const primaryScenes = normalizeTextArray(query.primaryScenes);
  const secondaryScenes = normalizeTextArray(query.secondaryScenes);
  const activities = normalizeTextArray(query.activities);
  const subActivities = normalizeTextArray(query.subActivities);
  const levels = normalizeTextArray(query.levels);
  const progresses = normalizeTextArray(query.progresses);
  const department =
    normalizeText(query.department) ||
    [
      query.DepartmentL6,
      query.DepartmentL5,
      query.DepartmentL4,
      query.DepartmentL3,
      query.DepartmentL2,
      query.DepartmentL1,
    ]
      .map(normalizeText)
      .find(Boolean) ||
    '';
  const primaryScene = normalizeText(query.primaryScene);
  const secondaryScene = normalizeText(query.secondaryScene);
  const activity = normalizeText(query.activity);
  const subActivity = normalizeText(query.subActivity);
  const level = normalizeText(query.level);
  const progress = normalizeText(query.progress);
  const owner = normalizeText(query.owner);

  return skillPlanningItems.filter((item) => {
    if (department && item.department !== department) return false;
    if (!matchesDiscreteFilter(item.primaryScene, primaryScene, primaryScenes)) return false;
    if (!matchesDiscreteFilter(item.secondaryScene, secondaryScene, secondaryScenes)) return false;
    if (!matchesDiscreteFilter(item.activity, activity, activities)) return false;
    if (!matchesDiscreteFilter(item.subActivity, subActivity, subActivities)) return false;
    if (!matchesDiscreteFilter(item.level, level, levels)) return false;
    if (!matchesDiscreteFilter(item.progress, progress, progresses)) return false;
    if (owner && !item.owner.includes(owner)) return false;
    if (!matchesDateRange(item, query)) return false;
    if (!keyword) return true;

    return [item.skillName, item.skillDescription, item.developer]
      .join(' ')
      .toLowerCase()
      .includes(keyword);
  });
}

export async function querySkillPlanningFilterOptions(): Promise<SkillPlanningFilterOptions> {
  return {
    primaryScene: distinctValuesInOrder(skillPlanningItems.map((item) => item.primaryScene)),
    secondaryScene: distinctValuesInOrder(skillPlanningItems.map((item) => item.secondaryScene)),
    activity: distinctValuesInOrder(skillPlanningItems.map((item) => item.activity)),
    subActivity: distinctValuesInOrder(skillPlanningItems.map((item) => item.subActivity)),
    level: distinctValuesInOrder(skillPlanningItems.map((item) => item.level)),
    progress: distinctValuesInOrder(skillPlanningItems.map((item) => item.progress)),
  };
}

export async function querySkillPlanningList(
  query: SkillPlanningQuery = {},
): Promise<SkillPlanningListResult> {
  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.max(1, Number(query.pageSize ?? 10));
  const filtered = sortItems(filterItems(query), query);
  const start = (page - 1) * pageSize;

  return {
    list: filtered.slice(start, start + pageSize).map(cloneSkillPlanningItem),
    total: filtered.length,
  };
}

export async function queryAllSkillPlanningList(
  query: SkillPlanningQuery = {},
): Promise<SkillPlanningItem[]> {
  return sortItems(filterItems(query), query).map(cloneSkillPlanningItem);
}

export async function createSkillPlanning(
  payload: SkillPlanningPayload,
): Promise<SkillPlanningItem> {
  const item = {
    id: `plan-${idSeed++}`,
    ...normalizeSkillPlanningPayload(payload),
  };
  skillPlanningItems = [item, ...skillPlanningItems];
  return cloneSkillPlanningItem(item);
}

export async function updateSkillPlanning(
  id: string,
  payload: SkillPlanningPayload,
): Promise<SkillPlanningItem> {
  const index = skillPlanningItems.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error('未找到要编辑的 Skill 规划');
  }

  const next = { id, ...normalizeSkillPlanningPayload(payload) };
  skillPlanningItems.splice(index, 1, next);
  return cloneSkillPlanningItem(next);
}

export async function deleteSkillPlanning(id: string): Promise<void> {
  skillPlanningItems = skillPlanningItems.filter((item) => item.id !== id);
}

export async function batchUpdateSkillPlanning(
  ids: string[],
  patch: SkillPlanningBatchPatch,
): Promise<number> {
  const idSet = new Set(ids);
  let count = 0;
  skillPlanningItems = skillPlanningItems.map((item) => {
    if (!idSet.has(item.id)) {
      return item;
    }

    count += 1;
    return {
      ...item,
      ...Object.fromEntries(
        Object.entries(patch).filter(([, value]) => normalizeText(value).length > 0),
      ),
      progress: patch.progress ? normalizeProgress(patch.progress) : item.progress,
    };
  });
  return count;
}

export async function batchDeleteSkillPlanning(ids: string[]): Promise<number> {
  const idSet = new Set(ids);
  const before = skillPlanningItems.length;
  skillPlanningItems = skillPlanningItems.filter((item) => !idSet.has(item.id));
  return before - skillPlanningItems.length;
}

export async function importSkillPlanningFromExcel(file: File): Promise<SkillPlanningImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const headerRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const headerSet = new Set((headerRows[0] ?? []).map(normalizeText));
  const presentKeys = new Set(
    Array.from(headerSet)
      .map((header) => skillPlanningFieldMap[header])
      .filter(Boolean),
  );
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const missingFields = skillPlanningExportHeaders.filter((header) => {
    const key = skillPlanningFieldMap[header];
    return !presentKeys.has(key);
  });

  if (missingFields.length > 0) {
    return { created: 0, missingFields };
  }

  const imported = rows
    .map(rowToSkillPlanningPayload)
    .filter((payload) => payload.skillName && payload.department && payload.owner);

  const createdItems = imported.map((payload) => ({
    id: `plan-${idSeed++}`,
    ...normalizeSkillPlanningPayload(payload),
  }));

  skillPlanningItems = [...createdItems, ...skillPlanningItems];
  return { created: createdItems.length, missingFields: [] };
}
