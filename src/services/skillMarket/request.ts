import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export const enum ResponseStatusEnum {
    SUCCESS = 200,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    INTERNAL_SERVER_ERROR = 500,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
}

const createAxiosConfig = {
    baseURL: '',
    timeout: 50000,
}

const axiosRequest = axios.create(createAxiosConfig);

axiosRequest.interceptors.request.use(
    (response) => {
        // 如果响应是二进制流，直接返回，用于下载文件
        if (response.config.responseType === 'blob') {
            return response;
        }
        if (response.status === ResponseStatusEnum.SUCCESS) {
            return response.data;
        }
        return Promise.reject(response.data);
    },
    (error) => {
        return Promise.reject(error);
    }
)

// 请求方法
const httpRequest = {
    api: <T = null>(config: AxiosRequestConfig): Promise<T> => {
        return axiosRequest({
            ...config,
            baseURL: `${import.meta.env.VITE_SKILL_MARKET_API_BASE}/api${config.url || ''}}`
        })
    },
    skill: <T = null>(config: AxiosRequestConfig): Promise<T> => {
        return axiosRequest({
            ...config,
            baseURL: `${import.meta.env.VITE_SKILL_MARKET_API_BASE}/api/skills${config.url || ''}}`
        })
    }
}

export default httpRequest;
