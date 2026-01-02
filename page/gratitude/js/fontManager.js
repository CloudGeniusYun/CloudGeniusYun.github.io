/**
 * 杨任东竹石体精简字体加载器 - 专为本页面优化
 * 仅动态加载：Regular(400), Semibold(600), Bold(700)
 */
(function() {
    'use strict';

    const CONFIG = {
        apiUrl: 'https://api.izihun.com/font/no-login-download/',
        // 本次方案一仅需这三个ID
        fontsToLoad: [
            { id: 81, weight: 400, name: 'Regular' },   // 基础正文
            { id: 82, weight: 600, name: 'Semibold' },  // 角色标签、页脚链接
            { id: 76, weight: 700, name: 'Bold' }       // 姓名、统计数字
        ],
        fontFamily: 'YangRenDongZhuShi', // CSS中将使用的字体族名
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' // 可简化
        }
    };

    const state = {
        loaded: new Map(),     // 已加载成功的字体： id -> FontFace对象
        loading: new Map()     // 正在加载的Promise： id -> Promise
    };

    /**
     * 核心：请求API获取单个字体的真实下载链接
     */
    async function fetchFontUrl(fontId) {
        // 避免重复请求
        if (state.loading.has(fontId)) {
            return state.loading.get(fontId);
        }

        const requestPromise = (async () => {
            try {
                console.log(`[FontLoader] 请求字体ID: ${fontId}`);
                const response = await fetch(CONFIG.apiUrl, {
                    method: 'POST',
                    headers: CONFIG.headers,
                    body: JSON.stringify({ font_ids: [fontId], trackKw: '' })
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();

                // 根据你之前提供的成功响应格式解析
                if (result?.code === 200 && result?.data?.fonts?.[0]?.download_url) {
                    const url = result.data.fonts[0].download_url;
                    console.log(`[FontLoader] 获取到ID ${fontId} 的链接`);
                    return url;
                }
                throw new Error('API响应格式不符');
            } catch (err) {
                console.error(`[FontLoader] 获取字体ID ${fontId} 失败:`, err);
                throw err; // 向上传播错误
            } finally {
                state.loading.delete(fontId); // 清理进行中状态
            }
        })();

        state.loading.set(fontId, requestPromise);
        return requestPromise;
    }

    /**
     * 加载并注册单个字体
     */
    async function loadSingleFont(fontInfo) {
        if (state.loaded.has(fontInfo.id)) {
            return state.loaded.get(fontInfo.id);
        }

        try {
            // 1. 获取链接
            const fontUrl = await fetchFontUrl(fontInfo.id);
            // 2. 创建FontFace对象
            const fontFace = new FontFace(
                CONFIG.fontFamily,
                `url('${fontUrl}') format('truetype')`,
                { weight: fontInfo.weight, style: 'normal', display: 'swap' } // display: swap 是关键优化
            );
            // 3. 载入并注册
            document.fonts.add(fontFace);
            await fontFace.load();
            // 4. 标记为已加载
            state.loaded.set(fontInfo.id, fontFace);
            console.log(`✅ [FontLoader] "${fontInfo.name}"(字重${fontInfo.weight}) 加载成功`);
            return fontFace;
        } catch (err) {
            console.error(`❌ [FontLoader] 加载字体“${fontInfo.name}”失败:`, err);
            throw err;
        }
    }

    /**
     * 主函数：按顺序加载所有必需字体
     */
    async function loadAllRequiredFonts() {
        console.log('[FontLoader] 开始加载页面所需字体...');
        const results = [];
        // 顺序加载，确保基础字重先就绪
        for (const fontInfo of CONFIG.fontsToLoad) {
            try {
                const fontFace = await loadSingleFont(fontInfo);
                results.push({ id: fontInfo.id, status: 'success', fontFace });
            } catch (err) {
                results.push({ id: fontInfo.id, status: 'error', error: err.message });
                // 单个失败不中断，继续尝试下一个
                console.warn(`字体ID ${fontInfo.id} 加载失败，继续下一项`);
            }
        }
        console.log('[FontLoader] 批量加载完成', results);
        return results;
    }

    /**
     * 获取当前加载状态报告
     */
    function getStatus() {
        return {
            fontFamily: CONFIG.fontFamily,
            required: CONFIG.fontsToLoad.length,
            loaded: state.loaded.size,
            loadedIds: Array.from(state.loaded.keys())
        };
    }

    // 公开到全局的API
    window.FontLoader = {
        load: loadAllRequiredFonts,
        getStatus,
        CONFIG // 暴露配置，便于检查
    };

    console.log('[FontLoader] 精简版字体管理器已就绪');
})();