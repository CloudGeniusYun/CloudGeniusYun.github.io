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
    
    // 违规记录系统
    const refreshBtn = document.getElementById('refreshBtn');
    const violationTableBody = document.getElementById('violationTableBody');
    const statsElement = document.getElementById('stats');
    
    // 用户违规计数（按规则分类）
    let userViolationCounts = {};
    let totalRecords = 0;
    
    // 解析违规条例，提取规则编号
    function parseRuleNumber(ruleText) {
        // 支持多种格式：
        // 1. 纯数字: "1", "2", "3"
        // 2. 带"第"字: "第1条", "第2条"
        // 3. 带规则描述: "第1条规则", "违反第2条"
        
        const match = ruleText.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1; // 默认规则1
    }
    
    // 根据规则编号和违规次数确定处理方式
    function getPunishment(userName, ruleNumber, violationCount) {
        // 规则2和3的处理方式：第一次警告，不调整则踢出
        if (ruleNumber === 2 || ruleNumber === 3) {
            if (violationCount === 1) {
                return '警告⚠️，请及时调整';
            } else {
                return '踢出群聊';
            }
        }
        
        // 规则5的处理方式：视情节严重程度给予相应处罚
        if (ruleNumber === 5) {
            return '视情节严重程度给予相应处罚';
        }
        
        // 规则1、4、6、7的处理方式：使用指数禁言公式
        // 注意：规则7是兜底规则，也使用禁言公式
        if (violationCount <= 1) {
            return '警告⚠️';
        } else if (violationCount >= 10) {
            return '拉入黑名单';
        } else {
            const result = calculateMuteDuration(violationCount);
            if (result.status === 'blacklist') {
                return '拉入黑名单';
            } else {
                return `禁言 ${result.duration} 小时`;
            }
        }
    }
    
    // 根据处理方式确定行样式类
    function getRowClass(punishment) {
        if (punishment.includes('警告')) {
            return 'warning-row';
        } else if (punishment.includes('禁言')) {
            if (punishment.includes('48小时')) {
                return 'max-mute-row';
            } else {
                return 'mute-row';
            }
        } else if (punishment.includes('拉黑') || punishment.includes('黑名单')) {
            return 'blacklist-row';
        } else if (punishment.includes('踢出')) {
            return 'blacklist-row'; // 踢出也显示为红色
        } else {
            return '';
        }
    }
    
    // 从list.txt文件加载违规记录
    async function loadViolationRecords(forceRefresh = false) {
        try {
            // 添加时间戳参数避免浏览器缓存
            const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
            const response = await fetch(`list.txt${timestamp}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            // 重置计数
            userViolationCounts = {};
            totalRecords = lines.length;
            
            // 处理每一行记录
            const records = [];
            
            lines.forEach(line => {
                const parts = line.split('---');
                if (parts.length === 4) {
                    const userName = parts[0].trim();
                    const violationContent = parts[1].trim();
                    const ruleText = parts[2].trim();
                    const violationTime = parts[3].trim();
                    const ruleNumber = parseRuleNumber(ruleText);
                    
                    // 更新用户违规计数（按规则分类）
                    if (!userViolationCounts[userName]) {
                        userViolationCounts[userName] = {};
                    }
                    
                    if (!userViolationCounts[userName][ruleNumber]) {
                        userViolationCounts[userName][ruleNumber] = 0;
                    }
                    
                    userViolationCounts[userName][ruleNumber]++;
                    
                    records.push({
                        userName,
                        violationContent,
                        violationTime,
                        ruleNumber,
                        ruleText, // 保留用于调试
                        userRuleCount: userViolationCounts[userName][ruleNumber]
                    });
                } else {
                    console.warn('格式错误的行:', line);
                }
            });
            
            // 按时间倒序排列（最新的在前面）
            records.sort((a, b) => {
                return new Date(b.violationTime) - new Date(a.violationTime);
            });
            
            // 更新表格
            updateViolationTable(records);
            
            // 更新统计信息
            updateStats(records.length);
            
            return records;
            
        } catch (error) {
            console.error('加载违规记录失败:', error);
            violationTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading">
                        加载违规记录失败：${error.message}<br>
                        请确保list.txt文件位于正确的位置（与index.html同级）<br>
                        文件格式应为：用户名---违规内容---违规条例---违反时间
                    </td>
                </tr>
            `;
            statsElement.innerHTML = '<span style="color:#dc2626">加载失败</span>';
            return [];
        }
    }
    
    // 更新违规记录表格
    function updateViolationTable(records) {
        if (records.length === 0) {
            violationTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading">暂无违规记录</td>
                </tr>
            `;
            return;
        }
        
        let tableHTML = '';
        
        records.forEach(record => {
            const punishment = getPunishment(
                record.userName, 
                record.ruleNumber, 
                record.userRuleCount
            );
            
            const rowClass = getRowClass(punishment);
            
            tableHTML += `
                <tr class="${rowClass}">
                    <td><strong>${record.userName}</strong></td>
                    <td>${record.violationContent}</td>
                    <td>${record.violationTime}</td>
                    <td>${punishment}</td>
                </tr>
            `;
        });
        
        violationTableBody.innerHTML = tableHTML;
    }
    
    // 更新统计信息
    function updateStats(count) {
        const userCount = Object.keys(userViolationCounts).length;
        
        // 计算总违规次数
        let totalViolations = 0;
        Object.values(userViolationCounts).forEach(userRules => {
            Object.values(userRules).forEach(count => {
                totalViolations += count;
            });
        });
        
        statsElement.innerHTML = `
            <span>共 ${count} 条记录，${userCount} 个用户，${totalViolations} 次违规</span>
        `;
    }
    
    // 绑定刷新按钮事件
    refreshBtn.addEventListener('click', function() {
        // 显示加载状态
        const originalText = this.textContent;
        this.textContent = '刷新中...';
        this.disabled = true;
        
        // 强制刷新，添加时间戳避免缓存
        loadViolationRecords(true).finally(() => {
            // 恢复按钮状态
            this.textContent = originalText;
            this.disabled = false;
        });
    });
    
    // 初始加载违规记录
    loadViolationRecords();
    
    // 打印友好提示
    window.addEventListener('beforeprint', function() {
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', function() {
        document.body.classList.remove('printing');
    });
});