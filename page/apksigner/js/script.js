// 配置 - 后端API地址（请确保开放了6003端口）
const API_BASE_URL = 'http://154.37.213.170:6003';
// 如果你的后端配置了HTTPS，请改为：'https://154.37.213.170:6003'

// DOM 元素
const apkDropZone = document.getElementById('apkDropZone');
const keystoreDropZone = document.getElementById('keystoreDropZone');
const apkFileInput = document.getElementById('apkFileInput');
const keystoreFileInput = document.getElementById('keystoreFileInput');
const apkFileInfo = document.getElementById('apkFileInfo');
const keystoreFileInfo = document.getElementById('keystoreFileInfo');
const aliasInput = document.getElementById('aliasInput');
const passwordInput = document.getElementById('passwordInput');
const keyPasswordInput = document.getElementById('keyPasswordInput');
const keyPasswordGroup = document.getElementById('keyPasswordGroup');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const signBtn = document.getElementById('signBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusBox = document.getElementById('statusBox');

// 状态变量
let selectedApkFile = null;
let selectedKeystoreFile = null;
let useSeparateKeyPassword = false;

// 1. 文件拖放逻辑
function setupFileDrop(zone, input, infoElement, onFileSelect) {
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) onFileSelect(e.target.files[0]);
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#4776E6';
        zone.style.backgroundColor = '#e8efff';
    });

    zone.addEventListener('dragleave', () => {
        zone.style.borderColor = '#4a6fa5';
        zone.style.backgroundColor = '#f8fafc';
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.style.borderColor = '#4a6fa5';
        zone.style.backgroundColor = '#f8fafc';
        if (e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    });
}

// 2. 文件选择回调
function onApkFileSelect(file) {
    if (!file.name.endsWith('.apk')) {
        updateStatus('错误：请选择 .apk 文件。', 'error');
        return;
    }
    selectedApkFile = file;
    apkFileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    updateSignButtonState();
}

function onKeystoreFileSelect(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'jks' && ext !== 'keystore') {
        updateStatus('错误：请选择 .jks 或 .keystore 文件。', 'error');
        return;
    }
    selectedKeystoreFile = file;
    keystoreFileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    updateSignButtonState();
}

// 3. 更新签名按钮状态
function updateSignButtonState() {
    const ready = selectedApkFile && selectedKeystoreFile && aliasInput.value.trim() && passwordInput.value;
    signBtn.disabled = !ready;
}

// 4. 切换独立密钥密码
togglePasswordBtn.addEventListener('click', () => {
    useSeparateKeyPassword = !useSeparateKeyPassword;
    keyPasswordGroup.style.display = useSeparateKeyPassword ? 'block' : 'none';
    togglePasswordBtn.innerHTML = useSeparateKeyPassword ?
        '<i class="fas fa-times"></i> 使用相同密码' :
        '<i class="fas fa-cog"></i> 我有独立的密钥密码';
    keyPasswordInput.value = '';
    updateSignButtonState();
});

// 5. 输入框变化监听
[aliasInput, passwordInput, keyPasswordInput].forEach(input => {
    input.addEventListener('input', updateSignButtonState);
});

// 6. 核心：签名函数
signBtn.addEventListener('click', async () => {
    if (!selectedApkFile || !selectedKeystoreFile) return;

    const formData = new FormData();
    formData.append('apk', selectedApkFile);
    formData.append('keystore', selectedKeystoreFile);
    formData.append('alias', aliasInput.value.trim());
    formData.append('storePassword', passwordInput.value);
    formData.append('keyPassword', useSeparateKeyPassword ? keyPasswordInput.value : passwordInput.value);

    // 重置并显示进度条
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    signBtn.disabled = true;
    updateStatus('正在连接服务器...', 'info');

    try {
        // 健康检查（可选）
        await axios.get(`${API_BASE_URL}/health`);

        // 执行签名（带进度监听）
        updateStatus('开始上传文件并签名...', 'info');
        const response = await axios.post(`${API_BASE_URL}/api/sign`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            responseType: 'blob',
            onUploadProgress: (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                progressBar.style.width = `${percent}%`;
                progressText.textContent = `${percent}%`;
                if (percent < 100) {
                    updateStatus(`上传中... ${percent}%`, 'info');
                }
            }
        });

        updateStatus('签名成功！正在准备下载...', 'success');

        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `signed_${selectedApkFile.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        updateStatus('下载已开始。签名流程完成！', 'success');
        progressBar.style.width = '100%';
        progressText.textContent = '100%';

    } catch (error) {
        console.error('签名失败:', error);
        let message = '签名过程发生错误。';
        if (error.response) {
            if (error.response.status === 0) {
                message = `无法连接到后端服务器 ${API_BASE_URL}。请检查：<br>1. 服务器是否运行<br>2. 端口6003是否已开放<br>3. 防火墙规则`;
            } else if (error.response.data instanceof Blob) {
                const errorText = await error.response.data.text();
                message = `服务器错误: ${errorText || error.response.status}`;
            } else {
                message = `错误: ${error.response.data?.error || error.response.status}`;
            }
        } else if (error.message.includes('Network Error')) {
            message = `网络错误：无法访问 ${API_BASE_URL}。请确保后端服务正在运行且端口开放。`;
        }
        updateStatus(message, 'error');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
    } finally {
        signBtn.disabled = false;
    }
});

// 7. 更新状态函数
function updateStatus(message, type = 'info') {
    const icon = type === 'error' ? 'fas fa-times-circle' :
                 type === 'success' ? 'fas fa-check-circle' : 'fas fa-info-circle';
    statusBox.innerHTML = `<p><i class="${icon}"></i> ${message}</p>`;
    statusBox.style.backgroundColor = type === 'error' ? '#ffe6e6' :
                                      type === 'success' ? '#e6ffe6' : '#f1f8ff';
    statusBox.style.borderLeft = type === 'error' ? '5px solid #ff3333' :
                                 type === 'success' ? '5px solid #33cc33' : '5px solid #4776E6';
}

// 初始化
setupFileDrop(apkDropZone, apkFileInput, apkFileInfo, onApkFileSelect);
setupFileDrop(keystoreDropZone, keystoreFileInput, keystoreFileInfo, onKeystoreFileSelect);
updateStatus('准备好进行 APK 签名。请按步骤操作。', 'info');