// 添加滚动动画效果
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
    
    // 表单验证和提交
    const feedbackForm = document.getElementById('feedbackForm');
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');
    
    // 表单验证函数
    function validateForm() {
        let isValid = true;
        
        // 获取表单元素
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const bodyInput = document.getElementById('body');
        
        // 获取错误消息元素
        const nameError = document.getElementById('nameError');
        const emailError = document.getElementById('emailError');
        const bodyError = document.getElementById('bodyError');
        
        // 重置错误消息
        nameError.style.display = 'none';
        emailError.style.display = 'none';
        bodyError.style.display = 'none';
        
        // 验证姓名
        if (!nameInput.value.trim()) {
            nameError.textContent = '请输入您的姓名';
            nameError.style.display = 'block';
            isValid = false;
        }
        
        // 验证邮箱
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim()) {
            emailError.textContent = '请输入您的邮箱';
            emailError.style.display = 'block';
            isValid = false;
        } else if (!emailPattern.test(emailInput.value)) {
            emailError.textContent = '请输入有效的邮箱地址';
            emailError.style.display = 'block';
            isValid = false;
        }
        
        // 验证消息
        if (!bodyInput.value.trim()) {
            bodyError.textContent = '请输入您的消息';
            bodyError.style.display = 'block';
            isValid = false;
        }
        
        return isValid;
    }
    
    // 表单提交处理
    feedbackForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 验证表单
        if (!validateForm()) {
            return;
        }
        
        // 禁用提交按钮并显示加载状态
        submitBtn.disabled = true;
        submitBtn.textContent = '发送中...';
        
        // 获取表单数据
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            body: document.getElementById('body').value
        };
        
        try {
            // 发送API请求
            const response = await fetch('https://suansuan.eggyhub.top/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // 处理响应
            if (response.ok) {
                // 显示成功消息
                formMessage.textContent = '消息发送成功！感谢您的联系。';
                formMessage.className = 'form-message success';
                formMessage.style.display = 'block';
                
                // 重置表单
                feedbackForm.reset();
                
                // 3秒后隐藏成功消息
                setTimeout(() => {
                    formMessage.style.display = 'none';
                }, 3000);
            } else {
                throw new Error('服务器响应错误');
            }
        } catch (error) {
            // 显示错误消息
            formMessage.textContent = '消息发送失败，请稍后重试。';
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
            
            console.error('Error:', error);
        } finally {
            // 恢复提交按钮
            submitBtn.disabled = false;
            submitBtn.textContent = '发送消息';
        }
    });
    
    // 实时验证输入字段
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateForm();
        });
    });
});