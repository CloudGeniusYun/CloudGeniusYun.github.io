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

    // 填充界面内容
    function fillContent() {
        // 图标
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

    // ---------- 使用隐藏 iframe 触发 scheme（不影响当前页面） ----------
    let iframe = null;

    function triggerScheme(url) {
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);
        }
        // 重置 iframe 内容再设置新 src，确保触发
        iframe.src = 'about:blank';
        setTimeout(() => {
            iframe.src = url;
        }, 10);
    }

    // ---------- 检查 scheme 参数 ----------
    if (!scheme || scheme.trim() === '') {
        showError('❌ 缺少 scheme 参数，请在链接后添加 ?scheme=你的应用协议');
        fillContent();
        return;
    }

    const rawScheme = scheme.trim();
    if (!isSafeScheme(rawScheme)) {
        showError('⛔ 非法的 scheme 协议，仅支持自定义 URL Scheme（如 myapp://）');
        fillContent();
        return;
    }

    // ---------- 参数有效：填充内容（页面始终可见） ----------
    fillContent();
    hideError(); // 确保按钮可用

    // ---------- 自动触发：页面加载后立即尝试唤醒 ----------
    triggerScheme(rawScheme);

    // ---------- 手动按钮：点击时再次触发 ----------
    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        triggerScheme(rawScheme);
    });
})();