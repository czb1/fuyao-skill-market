import { defineStore } from 'pinia';

export const useSkillMarketStore = defineStore('skillMarketStore', {
  state: () => ({
    userId: '',
    departmentList: [],
  }),
  actions: {
    updateUserId(id: string) {
      this.userId = id;
    },
    updateDept(departmentList: []) {
      this.departmentList = [...departmentList];
    },
  },
});