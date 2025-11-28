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

    // 背景音乐控制
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeIcon = document.getElementById('volumeIcon');
    
    // 检查是否支持自动播放
    let isPlaying = false;
    let previousVolume = 0.5; // 存储静音前的音量
    
    // 设置多个备用音乐源
    const musicSources = [
        'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2f552359a8.mp3?filename=ambient-piano-amp-strings-120799.mp3', // 在线源1
        'https://cdn.pixabay.com/download/audio/2022/01/18/audio_5b735208a3.mp3?filename=cinematic-ambient-116199.mp3', // 在线源2
        './music/background.mp3' // 本地备用
    ];
    
    let currentSourceIndex = 0;
    
    // 加载下一个音乐源
    function loadNextSource() {
        if (currentSourceIndex < musicSources.length) {
            console.log(`尝试加载音乐源 ${currentSourceIndex + 1}: ${musicSources[currentSourceIndex]}`);
            bgMusic.src = musicSources[currentSourceIndex];
            bgMusic.load();
            currentSourceIndex++;
        } else {
            console.error('所有音乐源加载失败');
            musicToggle.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            musicToggle.title = '音乐加载失败';
            musicToggle.disabled = true;
        }
    }
    
    // 更新音量图标
    function updateVolumeIcon(volume) {
        const icon = volumeIcon.querySelector('i');
        
        if (volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    // 音乐控制函数
    function toggleMusic() {
        if (isPlaying) {
            bgMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        } else {
            playMusic();
        }
    }
    
    // 强制播放音乐函数
    function playMusic() {
        bgMusic.play().then(() => {
            musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
            console.log('音乐播放成功');
        }).catch(error => {
            console.log('播放被阻止:', error);
            // 显示提示信息
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            
            // 如果是因为用户交互要求，尝试再次播放
            if (error.name === 'NotAllowedError') {
                console.log('等待用户交互后重试播放');
                // 设置一个标志，等待用户交互
                document.body.addEventListener('click', retryPlayOnInteraction, { once: true });
            }
        });
    }
    
    // 用户交互后重试播放
    function retryPlayOnInteraction() {
        console.log('检测到用户交互，重试播放音乐');
        playMusic();
    }
    
    // 音量控制
    function setVolume() {
        const volume = volumeSlider.value;
        bgMusic.volume = volume;
        updateVolumeIcon(volume);
        
        // 更新存储的上一次音量（如果不是静音）
        if (volume > 0) {
            previousVolume = volume;
        }
    }
    
    // 静音/取消静音切换
    function toggleMute() {
        if (bgMusic.volume > 0) {
            // 当前有音量，执行静音
            previousVolume = bgMusic.volume;
            bgMusic.volume = 0;
            volumeSlider.value = 0;
        } else {
            // 当前静音，恢复音量
            bgMusic.volume = previousVolume;
            volumeSlider.value = previousVolume;
        }
        updateVolumeIcon(bgMusic.volume);
    }
    
    // 绑定事件
    musicToggle.addEventListener('click', toggleMusic);
    volumeSlider.addEventListener('input', setVolume);
    volumeIcon.addEventListener('click', toggleMute);
    
    // 初始化音乐
    loadNextSource();
    
    // 监听音乐加载错误
    bgMusic.addEventListener('error', function() {
        console.error(`音乐源 ${currentSourceIndex} 加载失败，尝试下一个源`);
        loadNextSource();
    });
    
    // 监听音乐加载成功
    bgMusic.addEventListener('canplaythrough', function() {
        console.log('音乐加载成功，尝试自动播放');
        // 初始化音量
        setVolume();
        
        // 尝试自动播放
        setTimeout(() => {
            playMusic();
        }, 1000); // 延迟1秒确保音乐完全加载
    });
    
    // 监听音乐加载进度
    bgMusic.addEventListener('loadeddata', function() {
        console.log('音乐数据已加载，可以开始播放');
    });
    
    // 监听音乐播放结束（循环播放）
    bgMusic.addEventListener('ended', function() {
        console.log('音乐播放结束，重新开始');
        bgMusic.currentTime = 0;
        bgMusic.play();
    });
    
    // 添加用户交互监听器，用于在自动播放被阻止时重试
    document.body.addEventListener('click', function() {
        if (!isPlaying && bgMusic.readyState >= 2) {
            console.log('用户交互检测，尝试播放音乐');
            playMusic();
        }
    });
    
    // 添加键盘事件监听器
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            e.preventDefault(); // 防止空格键滚动页面
            toggleMusic();
        }
    });
    
    // 添加页面可见性变化监听
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // 页面隐藏时暂停音乐
            if (isPlaying) {
                bgMusic.pause();
            }
        } else {
            // 页面重新显示时恢复播放
            if (isPlaying) {
                bgMusic.play().catch(error => {
                    console.log('恢复播放失败:', error);
                });
            }
        }
    });
    
    // 添加页面加载完成后的自动播放尝试
    window.addEventListener('load', function() {
        console.log('页面完全加载，尝试自动播放音乐');
        if (!isPlaying && bgMusic.readyState >= 2) {
            setTimeout(() => {
                playMusic();
            }, 500);
        }
    });
});