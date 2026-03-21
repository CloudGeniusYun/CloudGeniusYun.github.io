(function() {
    // ---------- 1. 解析 URL 参数 ----------
    const urlParams = new URLSearchParams(window.location.search);
    const scheme = urlParams.get('scheme');
    const pic = urlParams.get('pic');
    const name = urlParams.get('name');
    const description = urlParams.get('description');

    // 获取 DOM 元素
    const iconWrapper = document.getElementById('iconWrapper');
    const iconImg = document.getElementById('appIcon');
    const nameDiv = document.getElementById('appName');
    const descDiv = document.getElementById('appDesc');
    const openBtn = document.getElementById('openBtn');
    const errorMsgDiv = document.getElementById('errorMsg');

    // 标志：是否已经尝试过跳转
    let jumpAttempted = false;

    // ---------- 辅助函数 ----------
    function showError(msg) {
        errorMsgDiv.textContent = msg;
        errorMsgDiv.classList.remove('hidden');
        openBtn.disabled = true;
        openBtn.classList.add('disabled');
    }

    function hideError() {
        errorMsgDiv.classList.add('hidden');
        openBtn.disabled = false;
        openBtn.classList.remove('disabled');
    }

    // 填充界面内容（仅在跳转失败时调用）
    function fillContent() {
        // 图标：若 pic 有效则设置 src，否则隐藏
        if (pic && pic.trim() !== '') {
            iconImg.src = pic.trim();
            iconImg.onerror = () => iconWrapper.classList.add('hidden');
            iconImg.onload = () => iconWrapper.classList.remove('hidden');
        } else {
            iconWrapper.classList.add('hidden');
        }

        // 名称
        if (name && name.trim() !== '') {
            nameDiv.textContent = name.trim();
            nameDiv.classList.remove('hidden');
        } else {
            nameDiv.classList.add('hidden');
        }

        // 描述
        if (description && description.trim() !== '') {
            descDiv.textContent = description.trim();
            descDiv.classList.remove('hidden');
        } else {
            descDiv.classList.add('hidden');
        }
    }

    // ---------- 安全校验 ----------
    function isSafeScheme(url) {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim().toLowerCase();
        if (!trimmed.includes(':')) return false;
        const dangerous = /^\s*(javascript|data|vbscript):/i;
        return !dangerous.test(trimmed);
    }

    // ---------- 核心跳转逻辑 ----------
    function tryJump(url) {
        if (jumpAttempted) return;
        jumpAttempted = true;
        try {
            window.location.href = url;
        } catch (e) {
            console.warn('跳转异常', e);
        }
    }

    // 检查 scheme 参数
    if (!scheme || scheme.trim() === '') {
        // 无参数：显示错误，不跳转
        showError('❌ 缺少 scheme 参数，请在链接后添加 ?scheme=你的应用协议');
        fillContent(); // 填充内容（图标等可能为空，但保持界面完整）
        return;
    }

    const rawScheme = scheme.trim();
    if (!isSafeScheme(rawScheme)) {
        showError('⛔ 非法的 scheme 协议，仅支持自定义 URL Scheme（如 myapp://）');
        fillContent();
        return;
    }

    // ---------- 立即尝试跳转 ----------
    tryJump(rawScheme);

    // 设置一个短延时，如果页面未卸载，说明跳转失败（可能未安装应用）
    setTimeout(() => {
        // 如果页面仍然存在，说明跳转未成功
        if (document.body) {
            // 显示界面内容
            fillContent();
            hideError(); // 清除可能存在的错误（如果有）
            // 绑定手动按钮
            openBtn.addEventListener('click', function(e) {
                e.preventDefault();
                tryJump(rawScheme);
            });
        }
    }, 300); // 300ms 足够判断跳转是否生效
})();