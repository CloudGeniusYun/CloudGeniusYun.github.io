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
    
    // 打印友好提示
    window.addEventListener('beforeprint', function() {
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', function() {
        document.body.classList.remove('printing');
    });
});