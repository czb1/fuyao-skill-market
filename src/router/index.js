import { createRouter, createWebHistory } from 'vue-router';
import SkillMarketPage from '../views/SkillMarketPage.vue';
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/skill-market',
        },
        {
            path: '/skill-market',
            name: 'skill-market',
            component: SkillMarketPage,
        },
    ],
});
export default router;
