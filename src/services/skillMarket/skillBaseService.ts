import httpRequest from "./request"

export const skillBaseService = {

    // skill压缩包解析接口
    parseSkillPackage: async (formData: FormData): any => {
        return httpRequest.skill<any>({
            url: '/upload/parse',
            method: 'post',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    },

    // skill压缩包上传接口
    uploadSkillPackage: async (formData: FormData): any => {
        return httpRequest.skill<any>({
            url: '/upload',
            method: 'post',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    },

    // skill创建接口
    createSkill: async (body: any): any => {
        return httpRequest.skill<any>({
            url: '',
            method: 'post',
            data: body,
        })
    },

    // skill列表查询接口
    querySkillList: async (params: any): any => {
        return httpRequest.skill<any>({
            url: '',
            method: 'get',
            params,
        })
    },

    // 我的发布列表查询接口
    queryMySkills: async (params: any): any => {
        return httpRequest.skill<any>({
            url: '/my',
            method: 'get',
            params,
        })
    },

    // projSkill发布到市场接口
    publishProjSkill: async (body: any): any => {
        return httpRequest.skill<any>({
            url: '/publish-to-market',
            method: 'post',
            data: body,
        })
    },

    // skill下载接口
    downloadSkill: async (body: any, id: string): any => {
        return httpRequest.skill<any>({
            url: `/${id}/download`,
            method: 'post',
            data: body
        })
    },
    // 单个skill下载量统计接口
    downloadSkillStats: async (id: string, params: any): any => {
        return httpRequest.skill<any>({
            url: `/${id}/download-stats`,
            method: 'get',
            params,
        })
    },

    // skill详情查询接口
    querySkillDetail: async (id: string): any => {
        return httpRequest.skill<any>({
            url: `/${id}`,
            method: 'get',
        })
    },

    // skill版本上传接口
    uploadSkillVersion: async (formData: FormData, id: string): any => {
        return httpRequest.skill<any>({
            url: `/${id}/versions`,
            method: 'post',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
    },

    // skill发起同步至Agent Center组织接口
    syncSkillToAgentCenter: async (body: any, id: string): any => {
        return httpRequest.skill<any>({
            url: `/${id}/sync-applications`,
            method: 'post',
            data: body,
        })
    },

    // skill发起更新同步接口
    syncUpdateSkillToAgentCenter: async (body: any, id: string): any => {
        return httpRequest.skill<any>({
            url: `/${id}/sync-update-applications`,
            method: 'post',
            data: body,
        })
    },

    // skill审核同步申请接口
    reviewSyncApplication: async (body: any, id: string): any => {
        return httpRequest.api<any>({
            url: `/sync-applications/${id}/review`,
            method: 'post',
            data: body,
        })
    },

    // 审核中心查询接口
    querySyncApplicationList: async (params: any): any => {
        return httpRequest.api<any>({
            url: '/sync-applications',
            method: 'get',
            params,
        })
    },

    // 当前用户角色查询接口
    queryCurrentUserRole: async (): any => {
        return httpRequest.api<any>({
            url: '/users/current/role',
            method: 'get',
        })
    },

    // 组织查询接口
    queryOrganizationList: async (): any => {
        return httpRequest.api<any>({
            url: '/organizations',
            method: 'get',
        })
    },

    // 组织创建接口
    createOrganization: async (body: any): any => {
        return httpRequest.api<any>({
            url: '/organizations',
            method: 'post',
            data: body,
        })
    },

    // 组织更新接口
    updateOrganization: async (body: any, id: string): any => {
        return httpRequest.api<any>({
            url: `/organizations/${id}`,
            method: 'put',
            data: body,
        })
    },

    // 部门树查询接口
    queryDepartmentTree: async (): any => {
        return httpRequest.api<any>({
            url: '/departments/tree',
            method: 'get',
        })
    },

    // 运营看板接口
    queryDashboardOverview: async (params: any): any => {
        return httpRequest.api<any>({
            url: '/dashboard/overview',
            method: 'get',
            params,
        })
    },

    // 质量评审列表查询接口
    queryQualityReviewList: async (params: any): any => {
        return httpRequest.api<any>({
            url: '/skill-quality-reviews',
            method: 'get',
            params,
        })
    },

    // 质量评审保存接口
    saveQualityReview: async (body: any): any => {
        return httpRequest.api<any>({
            url: '/skill-quality-reviews/save',
            method: 'post',
            data: body,
        })
    },
    
    // 质量评审归档接口
    archiveQualityReview: async (body: any): any => {
        return httpRequest.api<any>({
            url: '/skill-quality-reviews/archive',
            method: 'post',
            data: body,
        })
    },
    
}