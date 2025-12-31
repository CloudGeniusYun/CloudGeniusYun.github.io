// 贡献者数据 - 专注于测试和反馈BUG的贡献者
const contributors = [
    {
        id: 1,
        name: "摆烂的透明",
        role: "长期测试员",
        bio: "发现了Eggyhub中的数多个bug，并及时进行反馈，同时提供了Eggyhub内部大部分的图标。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3400432882&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "细节决定成败，每一个BUG的发现都是产品进步的机会。"
    },
    {
        id: 2,
        name: "timome",
        role: "长期测试员",
        bio: "专注于UI研究，多次为EggyhubUI提出建议",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3635608224&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "一款软件的UI决定了他的用户的使用体验。"
    },
    {
        id: 3,
        name: "老毛 老至",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3982113367&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "真正的稳定性需要在极端条件下验证。"
    },
    {
        id: 4,
        name: "TF注册表",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3575530277&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "每个平台都有其特性，全面的测试是应用成功的关键。"
    },
    {
        id: 5,
        name: "未知用户",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=1468147591&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "安全不是功能，而是基础。每一次测试都是在加固这个基础。"
    },
    {
        id: 6,
        name: "不知道",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=991375262&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "应用的稳定性是靠不断的测试得出的。"
    },
    {
        id: 7,
        name: "ANY岩",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=805942182&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "进步不能以牺牲稳定性为代价，测试是我们的守护神。"
    },
    {
        id: 8,
        name: "超级无敌暴龙战士",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=1985482711&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "移动端测试需要考虑到各种设备、系统和网络环境的复杂性。"
    },
    {
        id: 9,
        name: "꧁༺DS༻꧂",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3465568829&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "优秀的性能是良好用户体验的基础。"
    },
    {
        id: 10,
        name: "会有一天",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=729627284&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "真正的稳定性要在极端条件下验证。"
    },
    {
        id: 11,
        name: "Ember",
        role: "内测人员",
        bio: "Eggyhub的内测人员，为内测时软件功能提供了宝贵建议。",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=3870921702&spec=640&img_type=jpg",
        joinDate: "2025-08-18",
        quote: "测试让我们能够更快地发现问题，更专注于创造价值。"
    },
    {
        id: 12,
        name: "聍觅",
        role: "长期测试员",
        bio: "长期对软件进行测试，包括但不限于每一次版本更新前的功能性测试",
        avatar: "http://q.qlogo.cn/headimg_dl?dst_uin=2450069268&spec=640&img_type=jpg",
        joinDate: "2025-09-17",
        quote: "软件的问题要尽早发现，避免在发布后产生bug。"
    }
];

// 渲染贡献者卡片
function renderContributors() {
    const container = document.getElementById('contributorsContainer');
    container.innerHTML = '';
    
    contributors.forEach(contributor => {
        const card = document.createElement('div');
        card.className = 'contributor-card';
        
        card.innerHTML = `
            <div class="contributor-header">
                <div class="avatar">
                    <img src="${contributor.avatar}" alt="${contributor.name}">
                </div>
                <div class="contributor-info">
                    <h3 class="contributor-name">${contributor.name}</h3>
                    <div class="contributor-role">${contributor.role}</div>
                </div>
            </div>
            
            <p class="contributor-bio">${contributor.bio}</p>
            
            <div class="contributor-stats">
                <div class="stat">
                    <span class="stat-value">${contributor.joinDate}</span>
                    <span class="stat-label">加入日期</span>
                </div>
            </div>
            
            <div class="contributor-quote">${contributor.quote}</div>
        `;
        
        container.appendChild(card);
    });
}

// 更新统计数据
function updateStats() {
    const totalContributors = contributors.length;
    const totalBugs = 47; // 可以根据需要改为动态计算
    
    document.getElementById('totalContributors').textContent = totalContributors;
    document.getElementById('totalBugs').textContent = totalBugs;
    
    // 添加数字动画效果
    animateValue('totalContributors', 0, totalContributors, 1500);
    animateValue('totalBugs', 0, totalBugs, 2000);
}

// 数字动画
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 创建矩阵背景效果
function createMatrixEffect() {
    const matrixBg = document.getElementById('matrix-bg');
    const columns = Math.floor(window.innerWidth / 20);
    const rows = Math.floor(window.innerHeight / 20);
    
    // 创建网格点
    for (let i = 0; i < columns * rows; i++) {
        const dot = document.createElement('div');
        dot.style.position = 'absolute';
        dot.style.width = '2px';
        dot.style.height = '2px';
        dot.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
        dot.style.borderRadius = '50%';
        dot.style.left = `${(i % columns) * 20}px`;
        dot.style.top = `${Math.floor(i / columns) * 20}px`;
        dot.style.opacity = Math.random() * 0.5 + 0.1;
        matrixBg.appendChild(dot);
        
        // 随机闪烁效果
        setInterval(() => {
            dot.style.opacity = Math.random() * 0.5 + 0.1;
        }, Math.random() * 2000 + 1000);
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    renderContributors();
    updateStats();
    
    // 添加卡片悬停效果
    const cards = document.querySelectorAll('.contributor-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // 添加背景矩阵效果
    createMatrixEffect();
});
