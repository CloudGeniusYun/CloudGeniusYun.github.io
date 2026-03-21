(function() {
    // ---------- 1. 解析 URL 参数 ----------
    const urlParams = new URLSearchParams(window.location.search);
    let scheme = urlParams.get('scheme');      // 必选参数
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

    // 辅助函数：显示错误信息并禁用按钮
    function showError(msg) {
        errorMsgDiv.textContent = msg;
        errorMsgDiv.classList.remove('hidden');
        openBtn.disabled = true;
        openBtn.classList.add('disabled');
    }

    // 辅助函数：隐藏错误信息（当参数修复后）
    function hideError() {
        errorMsgDiv.classList.add('hidden');
        openBtn.disabled = false;
        openBtn.classList.remove('disabled');
    }

    // ---------- 2. 安全校验 ----------
    function isSafeScheme(url) {
        if (!url || typeof url !== 'string') return false;
        const trimmed = url.trim().toLowerCase();
        // 必须包含冒号（scheme基本特征）
        if (!trimmed.includes(':')) return false;
        // 拒绝危险协议
        const dangerous = /^\s*(javascript|data|vbscript):/i;
        return !dangerous.test(trimmed);
    }

    // ---------- 3. 填充内容与隐藏逻辑 ----------
    // 图标：若 pic 有效则设置 src，否则隐藏图标区域
    if (pic && pic.trim() !== '') {
        iconImg.src = pic.trim();
        // 图片加载失败时隐藏图标区域
        iconImg.onerror = function() {
            iconWrapper.classList.add('hidden');
        };
        // 确保图片加载成功后显示（如果之前隐藏过，这里不再重复）
        iconImg.onload = function() {
            iconWrapper.classList.remove('hidden');
        };
    } else {
        iconWrapper.classList.add('hidden');
    }

    // 名称：若 name 有效则显示，否则隐藏
    if (name && name.trim() !== '') {
        nameDiv.textContent = name.trim();
        nameDiv.classList.remove('hidden');
    } else {
        nameDiv.classList.add('hidden');
    }

    // 描述：若 description 有效则显示，否则隐藏
    if (description && description.trim() !== '') {
        descDiv.textContent = description.trim();
        descDiv.classList.remove('hidden');
    } else {
        descDiv.classList.add('hidden');
    }

    // ---------- 4. scheme 参数处理与按钮行为 ----------
    // 检查 scheme 是否存在且安全
    if (!scheme || scheme.trim() === '') {
        showError('❌ 缺少 scheme 参数，请在链接后添加 ?scheme=你的应用协议');
        return;
    }

    const rawScheme = scheme.trim();
    if (!isSafeScheme(rawScheme)) {
        showError('⛔ 非法的 scheme 协议，仅支持自定义 URL Scheme（如 myapp://）');
        return;
    }

    // 有效 scheme：隐藏错误信息，绑定按钮事件
    hideError();

    // 绑定点击事件：执行跳转
    openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // 再次确认安全（防止页面运行中被篡改，虽然几乎不会）
        if (!isSafeScheme(rawScheme)) {
            showError('⛔ 非法的 scheme 协议');
            return;
        }
        // 执行跳转
        try {
            window.location.href = rawScheme;
            // 部分浏览器可能阻止，但不影响用户手动再次点击
        } catch (err) {
            console.warn('跳转失败', err);
            showError('无法跳转，请检查 scheme 是否正确，或手动打开应用');
        }
    });
})();