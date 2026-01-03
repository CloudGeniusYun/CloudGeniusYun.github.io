// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 添加规则项点击交互效果
    const ruleItems = document.querySelectorAll('.rule-item');
    
    ruleItems.forEach(item => {
        item.addEventListener('click', function() {
            // 切换高亮效果
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                this.style.backgroundColor = '';
            } else {
                // 移除其他所有规则项的高亮
                ruleItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.style.backgroundColor = '';
                });
                
                // 添加当前规则项的高亮
                this.classList.add('active');
                this.style.backgroundColor = '#f0f9ff';
            }
        });
    });
    
    // 头像加载失败时的备用处理
    const avatar = document.querySelector('.avatar');
    if (avatar) {
        avatar.addEventListener('error', function() {
            console.warn('群头像加载失败，使用备用头像');
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%230096ff" stroke="white" stroke-width="4"/><text x="50" y="55" text-anchor="middle" fill="white" font-family="sans-serif" font-size="38">群</text></svg>';
        });
    }
    
    // 禁言时长计算器逻辑
    const calculateBtn = document.getElementById('calculateBtn');
    const violationCountInput = document.getElementById('violationCount');
    
    // 禁言规则配置
    const baseDuration = 1; // 基础时长（小时）
    const baseNumber = 1.8; // 底数
    const maxDuration = 48; // 最长禁言时长（小时）
    const blacklistThreshold = 10; // 拉黑阈值（累计违规次数）
    
    // 计算禁言时长函数
    function calculateMuteDuration(violationCount) {
        // 第一次违规是警告
        if (violationCount <= 1) {
            return {
                duration: 0,
                status: 'warning',
                message: '第一次违规，仅警告⚠️',
                formula: '第一次违规，仅警告'
            };
        }
        
        // 第10次及以上违规拉黑
        if (violationCount >= blacklistThreshold) {
            return {
                duration: 0,
                status: 'blacklist',
                message: `累计${violationCount}次违规，直接拉入黑名单`,
                formula: '累计10次违规，拉黑'
            };
        }
        
        // 计算指数增长
        const exponent = violationCount - 2;
        let rawDuration = baseDuration * Math.pow(baseNumber, exponent);
        
        // 四舍五入取整
        let roundedDuration = Math.round(rawDuration);
        
        // 应用上限
        let finalDuration = Math.min(roundedDuration, maxDuration);
        
        // 确定状态
        let status = 'normal';
        let statusText = '正常禁言';
        if (finalDuration >= maxDuration) {
            status = 'max';
            statusText = '已达到上限';
        }
        
        return {
            duration: finalDuration,
            raw: rawDuration,
            rounded: roundedDuration,
            status: status,
            statusText: statusText,
            formula: `${baseDuration} × ${baseNumber}<sup>${exponent}</sup> = ${rawDuration.toFixed(2)} ≈ ${roundedDuration} 小时`
        };
    }
    
    // 格式化时长显示
    function formatDuration(hours) {
        if (hours === 0) return '0 小时';
        
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        
        let result = '';
        if (days > 0) {
            result += `${days} 天`;
            if (remainingHours > 0) {
                result += ` ${remainingHours} 小时`;
            }
        } else {
            result = `${hours} 小时`;
        }
        
        return result;
    }
    
    // 更新显示结果
    function updateResult() {
        const violationCount = parseInt(violationCountInput.value);
        const result = calculateMuteDuration(violationCount);
        
        // 更新禁言时长显示
        const durationElement = document.getElementById('duration');
        const formulaElement = document.getElementById('formulaText');
        const statusElement = document.getElementById('status');
        
        if (result.status === 'warning') {
            durationElement.textContent = '警告⚠️';
            formulaElement.innerHTML = result.formula;
            statusElement.textContent = result.message;
            statusElement.style.color = '#f59e0b';
        } else if (result.status === 'blacklist') {
            durationElement.textContent = '拉黑';
            formulaElement.innerHTML = result.formula;
            statusElement.textContent = result.message;
            statusElement.style.color = '#dc2626';
        } else {
            durationElement.textContent = `${result.duration} 小时 (${formatDuration(result.duration)})`;
            formulaElement.innerHTML = result.formula;
            statusElement.textContent = result.statusText;
            
            if (result.status === 'max') {
                statusElement.style.color = '#dc2626';
            } else {
                statusElement.style.color = '#059669';
            }
        }
    }
    
    // 绑定计算按钮点击事件
    calculateBtn.addEventListener('click', updateResult);
    
    // 绑定输入框变化事件
    violationCountInput.addEventListener('input', updateResult);
    
    // 初始计算一次
    updateResult();
    
    // 打印友好提示
    window.addEventListener('beforeprint', function() {
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', function() {
        document.body.classList.remove('printing');
    });
});