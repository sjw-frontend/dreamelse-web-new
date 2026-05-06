// src/app/routes/guards.ts
// 路由守卫：未登录访问需鉴权页面时跳转到登录页
import { redirect } from '@tanstack/react-router';

// 获取 zone 实例（延迟导入避免循环依赖）
const getZone = async () => {
    const { ZoneContext } = await import('$/view/contexts/zone');
    return ZoneContext;
};

export const requireAuth = async () => {
    // 通过 AppService 检查登录态
    try {
        const { AppService } = await import('$/services/app/app-service');
        // AppService 是 zone 内的 service，这里用简单的 localStorage 检查
        const token = localStorage.getItem('loggedInUserToken');
        if (!token) {
            throw redirect({ to: '/login' });
        }
    } catch (e) {
        if (e && typeof e === 'object' && 'to' in e) throw e;
        // 如果无法检查，放行（避免阻塞）
    }
};
