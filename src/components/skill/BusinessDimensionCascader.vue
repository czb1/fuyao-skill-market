<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import type { BusinessDimensionDto } from '../../services/skillMarket/apiTypes';
import { skillBaseService } from '../../services/skillMarket/skillBaseService';

type BusinessDimensionSelection = {
  category: string;
  dimensionId: string;
  dimensionName: string;
  categoryId: string;
  categoryName: string;
  level: 0 | 1 | 2;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    dimensionLabel?: string;
    categoryLabel?: string;
    firstSelectId?: string;
    secondSelectId?: string;
    ariaLabelPrefix?: string;
    defaultDimensionName?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    dimensionLabel: '',
    categoryLabel: '',
    firstSelectId: undefined,
    secondSelectId: undefined,
    ariaLabelPrefix: '业务维度',
    defaultDimensionName: '公共',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:dimensionLabel': [value: string];
  'update:categoryLabel': [value: string];
  change: [selection: BusinessDimensionSelection];
}>();

const businessDimensions = ref<BusinessDimensionDto[]>([]);
const businessDimensionLoading = ref(false);
const selectedBusinessDimension = ref(props.dimensionLabel || props.defaultDimensionName);
const selectedBusinessCategory = ref('');

const businessDimensionOptions = computed(() => [...businessDimensions.value]);

const selectedBusinessDimensionItem = computed(
  () =>
    businessDimensionOptions.value.find(
      (item) => item.categoryName === selectedBusinessDimension.value,
    ) ?? null,
);

function businessDimensionChildren(
  dimension: BusinessDimensionDto | null | undefined,
): BusinessDimensionDto[] {
  return [...(dimension?.children ?? [])];
}

const selectedBusinessCategoryOptions = computed(() =>
  businessDimensionChildren(selectedBusinessDimensionItem.value),
);

const selectedBusinessCategoryItem = computed(
  () =>
    selectedBusinessCategoryOptions.value.find(
      (item) => String(item.categoryId) === selectedBusinessCategory.value,
    ) ?? null,
);

const selectedBusinessCategoryParam = computed(() => {
  if (selectedBusinessCategory.value) {
    return selectedBusinessCategory.value;
  }
  const dimensionId = selectedBusinessDimensionItem.value?.categoryId;
  return dimensionId !== undefined && dimensionId !== null ? String(dimensionId) : '';
});

function emitSelection(emitChange: boolean): void {
  const dimension = selectedBusinessDimensionItem.value;
  const category = selectedBusinessCategoryItem.value;
  const selection: BusinessDimensionSelection = {
    category: selectedBusinessCategoryParam.value,
    dimensionId:
      dimension?.categoryId !== undefined && dimension.categoryId !== null
        ? String(dimension.categoryId)
        : '',
    dimensionName: dimension?.categoryName ?? '',
    categoryId:
      category?.categoryId !== undefined && category.categoryId !== null
        ? String(category.categoryId)
        : '',
    categoryName: category?.categoryName ?? '',
    level: category ? 2 : dimension ? 1 : 0,
  };

  emit('update:modelValue', selection.category);
  emit('update:dimensionLabel', selection.dimensionName);
  emit('update:categoryLabel', selection.categoryName);

  if (emitChange) {
    emit('change', selection);
  }
}

function syncSelectedBusinessDimension(): void {
  const options = businessDimensionOptions.value;
  if (options.length === 0) {
    selectedBusinessDimension.value = selectedBusinessDimension.value || props.defaultDimensionName;
    return;
  }

  const modelValue = String(props.modelValue ?? '').trim();
  if (modelValue) {
    for (const dimension of options) {
      if (String(dimension.categoryId) === modelValue) {
        selectedBusinessDimension.value = dimension.categoryName ?? props.defaultDimensionName;
        selectedBusinessCategory.value = '';
        return;
      }

      const child = businessDimensionChildren(dimension).find(
        (item) => String(item.categoryId) === modelValue,
      );
      if (child) {
        selectedBusinessDimension.value = dimension.categoryName ?? props.defaultDimensionName;
        selectedBusinessCategory.value = String(child.categoryId);
        return;
      }
    }
  }

  const current = selectedBusinessDimension.value;
  if (options.some((item) => item.categoryName === current)) {
    return;
  }

  selectedBusinessDimension.value =
    options.find((item) => item.categoryName === props.defaultDimensionName)?.categoryName ??
    options[0]?.categoryName ??
    props.defaultDimensionName;
  selectedBusinessCategory.value = '';
}

async function loadBusinessDimensions(): Promise<void> {
  if (businessDimensionLoading.value || businessDimensions.value.length > 0) {
    syncSelectedBusinessDimension();
    emitSelection(false);
    return;
  }

  businessDimensionLoading.value = true;
  try {
    const env = await skillBaseService.queryBusinessDimensions({ format: 'tree' });
    if (env?.meta?.success && env?.data) {
      businessDimensions.value = env.data;
    }
  } finally {
    businessDimensionLoading.value = false;
    syncSelectedBusinessDimension();
    emitSelection(false);
  }
}

function onDimensionChange(): void {
  selectedBusinessCategory.value = '';
  emitSelection(true);
}

function onCategoryChange(): void {
  emitSelection(true);
}

function clearBusinessCategory(): void {
  selectedBusinessCategory.value = '';
  emitSelection(true);
}

watch(selectedBusinessCategoryOptions, (options) => {
  if (!selectedBusinessCategory.value) {
    return;
  }
  if (!options.some((item) => String(item.categoryId) === selectedBusinessCategory.value)) {
    selectedBusinessCategory.value = '';
    emitSelection(false);
  }
});

watch(
  () => props.modelValue,
  (value) => {
    if (String(value ?? '') === selectedBusinessCategoryParam.value) {
      return;
    }
    syncSelectedBusinessDimension();
    emitSelection(false);
  },
);

onMounted(() => {
  void loadBusinessDimensions();
});
</script>

<template>
  <div class="business-dimension-cascader">
    <div class="business-dimension-cascader__group">
      <select
        :id="firstSelectId"
        v-model="selectedBusinessDimension"
        class="business-dimension-cascader__select"
        :disabled="disabled || businessDimensionLoading || businessDimensionOptions.length === 0"
        :aria-label="`${ariaLabelPrefix}一级`"
        @change="onDimensionChange"
      >
        <option v-if="businessDimensionOptions.length === 0" value="">
          {{ businessDimensionLoading ? '加载中...' : '暂无业务维度' }}
        </option>
        <option
          v-for="dimension in businessDimensionOptions"
          :key="dimension.categoryId"
          :value="dimension.categoryName"
        >
          {{ dimension.categoryName }}
        </option>
      </select>

      <div
        class="business-dimension-cascader__category"
        :class="{ 'has-clear': selectedBusinessCategory }"
      >
        <select
          :id="secondSelectId"
          v-model="selectedBusinessCategory"
          class="business-dimension-cascader__select"
          :disabled="disabled || selectedBusinessCategoryOptions.length === 0"
          :aria-label="`${ariaLabelPrefix}二级`"
          @change="onCategoryChange"
        >
          <option value="" disabled hidden>请选择二级</option>
          <option
            v-for="category in selectedBusinessCategoryOptions"
            :key="category.categoryId"
            :value="String(category.categoryId)"
          >
            {{ category.categoryName }}
          </option>
        </select>
        <button
          v-if="selectedBusinessCategory"
          type="button"
          class="business-dimension-cascader__clear"
          :aria-label="`清空${ariaLabelPrefix}二级`"
          :title="`清空${ariaLabelPrefix}二级`"
          :disabled="disabled"
          @click.stop.prevent="clearBusinessCategory"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.business-dimension-cascader {
  width: 100%;
  min-width: 0;
}

.business-dimension-cascader__group {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.business-dimension-cascader__select {
  width: 100%;
  min-width: 0;
  min-height: 42px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #e9edf3;
  border-radius: 8px;
  outline: 0;
  background: #ffffff;
  color: #15171d;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.business-dimension-cascader__select:focus {
  border-color: rgba(47, 125, 246, 0.42);
  box-shadow: 0 0 0 3px rgba(47, 125, 246, 0.1);
}

.business-dimension-cascader__select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.business-dimension-cascader__category {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.business-dimension-cascader__category.has-clear {
  grid-template-columns: minmax(0, 1fr) 28px;
}

.business-dimension-cascader__clear {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #eef2f7;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
  font-weight: 850;
  line-height: 1;
}

.business-dimension-cascader__clear:hover:not(:disabled) {
  background: #e2e8f0;
  color: #1f2937;
}

.business-dimension-cascader__clear:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 760px) {
  .business-dimension-cascader__group {
    grid-template-columns: 1fr;
  }
}
</style>
