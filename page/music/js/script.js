document.addEventListener('DOMContentLoaded', function() {
    // 播放列表数据
    let playlist = [
        {
            title: "欢迎来到EggyMusic",
            artist: "By CloudGenius",
            cover: "", 
            src: ""
        }
    ];

    // DOM 元素
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('totalTime');
    const songTitle = document.getElementById('songTitle');
    const artistName = document.getElementById('artistName');
    const coverArt = document.getElementById('coverArt');
    const record = document.getElementById('record');
    const tonearm = document.getElementById('tonearm');
    const playerWrapper = document.querySelector('.player-wrapper');
    const playlistEl = document.getElementById('playlist');
    const listBtn = document.getElementById('listBtn');
    const closeListBtn = document.getElementById('closeListBtn');
    const playlistSidebar = document.getElementById('playlistSidebar');
    const modeBtn = document.getElementById('modeBtn');
    
    // 搜索相关 DOM
    const apiSource = document.getElementById('apiSource');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sidebarTabs = document.getElementById('sidebarTabs');
    const tabPlaylist = document.getElementById('tabPlaylist');
    const tabSearch = document.getElementById('tabSearch');
    const searchResultsEl = document.getElementById('searchResults');
    const sidebarTitle = document.getElementById('sidebarTitle');

    // 暗色模式切换
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            // 获取点击位置作为动画中心，或者使用按钮中心
            const x = e.clientX;
            const y = e.clientY;
            
            // 添加按钮旋转动画类
            themeToggleBtn.classList.add('animating');
            
            // 封装切换逻辑
            const performSwitch = () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                if (currentTheme === 'dark') {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                    themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
                } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                    themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
                }
            };

            // 使用 View Transitions API
            if (document.startViewTransition) {
                // 等待按钮动画稍微进行一点
                const transition = document.startViewTransition(() => {
                    performSwitch();
                });

                transition.ready.then(() => {
                    // 计算最大半径（从点击点到屏幕最远角）
                    const endRadius = Math.hypot(
                        Math.max(x, window.innerWidth - x),
                        Math.max(y, window.innerHeight - y)
                    );

                    // 执行圆形扩散动画
                    const animation = document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${endRadius}px at ${x}px ${y}px)`
                            ],
                            transform: [
                                `scale(0.8)`, // 开始时缩小，模拟挤压感
                                `scale(1)`
                            ],
                            transformOrigin: [
                                `${x}px ${y}px`,
                                `${x}px ${y}px`
                            ]
                        },
                        {
                            duration: 800,
                            easing: 'cubic-bezier(0.25, 1, 0.5, 1)', 
                            pseudoElement: '::view-transition-new(root)'
                        }
                    );
                    });
                
                // 动画结束后恢复按钮状态
                transition.finished.then(() => {
                    themeToggleBtn.classList.remove('animating');
                });
            } else {
                // 降级处理：仅使用原来的 CSS 过渡
                setTimeout(() => {
                    performSwitch();
                    themeToggleBtn.classList.remove('animating');
                }, 300);
            }
        });
    }

    // 状态变量
    let currentindex = 0;
    let isPlaying = false;
    let playMode = 'loop'; // loop, single, random
    let searchResults = []; // 存储搜索结果
    let currentSearchPage = 0; // 默认从0开始
    let currentSearchKeyword = '';
    let isLoadingMore = false;
    let hasMoreResults = true;

    // 歌词相关变量
    let currentLyrics = []; // [{time: 0, text: "歌词"}]
    // 获取歌词容器，注意这里可能获取为空，需要在 DOMContentLoaded 中确保获取
    let lyricsContainer = null; // 初始化为 null
    let currentLyricIndex = -1;

    // 解析歌词 LRC 格式
    function parseLyrics(lrc) {
        if (!lrc) return [];
        const lines = lrc.split('\n');
        const lyrics = [];
        const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        
        lines.forEach(line => {
            const match = timeExp.exec(line);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                // 修复毫秒解析，有的格式是 .123 有的是 .12
                const msStr = match[3];
                const milliseconds = msStr.length === 3 ? parseInt(msStr) : parseInt(msStr) * 10;
                
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = line.replace(timeExp, '').trim(); // 移除时间戳保留歌词
                
                if (text) { // 只保留有内容的歌词行
                    lyrics.push({ time, text });
                }
            }
        });
        return lyrics;
    }

    // 渲染歌词
    function renderLyrics(lyrics) {
        currentLyrics = lyrics || [];
        currentLyricIndex = -1;
        lyricsContainer = document.getElementById('lyricsContainer'); // 确保获取到元素
        
        if (!lyricsContainer) return;

        if (!currentLyrics.length) {
            lyricsContainer.innerHTML = '<p class="no-lyrics">暂无歌词</p>';
            return;
        }

        let html = '<div class="lyrics-content" style="transition: transform 0.3s ease-out;">';
        currentLyrics.forEach((line, index) => {
            html += `<div class="lyrics-line" data-index="${index}">${line.text}</div>`;
        });
        html += '</div>';
        lyricsContainer.innerHTML = html;
    }

    // 更新歌词高亮和滚动
    function updateLyrics(currentTime) {
        if (!currentLyrics.length) return;
        
        // 确保容器存在
        if (!lyricsContainer) {
             lyricsContainer = document.getElementById('lyricsContainer');
             if (!lyricsContainer) return;
        }
        
        // 二分查找或者遍历找到当前时间对应的歌词行
        // 找到第一个时间大于 currentTime 的行，前一行就是当前行
        let index = currentLyrics.findIndex(line => line.time > currentTime);
        
        if (index === -1) {
            // 如果没找到大于当前时间的，说明已经播放到最后一句或者完了
            index = currentLyrics.length - 1;
        } else {
            // 找到了，当前行是前一行
            index = index - 1;
        }
        
        // 修正 index < 0 的情况（比如刚开始播放，第一句还没到时间）
        if (index < 0) index = 0;

        if (index !== currentLyricIndex) {
            currentLyricIndex = index;
            
            const lines = lyricsContainer.querySelectorAll('.lyrics-line');
            lines.forEach(line => line.classList.remove('active'));
            
            if (lines[index]) {
                const activeLine = lines[index];
                activeLine.classList.add('active');
                
                // 滚动歌词
                const content = lyricsContainer.querySelector('.lyrics-content');
                if (content) {
                    const containerHeight = lyricsContainer.clientHeight;
                    const lineHeight = activeLine.clientHeight;
                    const offsetTop = activeLine.offsetTop;
                    
                    // 让当前行居中显示
                    // 滚动距离 = 当前行距离顶部的位置 - (容器高度/2) + (行高/2)
                    let scrollY = offsetTop - (containerHeight / 2) + (lineHeight / 2);
                    
                    // 限制滚动范围
                    // 实际上不需要限制 < 0，因为 transform translateY 负值向上滚，正值向下滚
                    // 但通常歌词是向上滚动的，所以 scrollY 应该是正值（translateY 负值）
                    // 除非第一句想在中间显示，那时候 scrollY 可能是负的？
                    // 这里的计算逻辑：
                    // offsetTop 是相对于 content 的顶部
                    // 当 activeLine 在 content 顶部时，offsetTop = 0
                    // 我们希望 activeLine 在 container 中间
                    
                    content.style.transform = `translateY(-${scrollY}px)`;
                }
            }
        }
    }

    // 搜索歌曲
    async function searchMusic(keyword, isLoadMore = false) {
        if (!keyword) return;
        
        if (!isLoadMore) {
            currentSearchPage = 0; // 默认从0开始
            currentSearchKeyword = keyword;
            searchResults = [];
            hasMoreResults = true;
            searchResultsEl.innerHTML = '';
            
            // 切换到搜索结果视图
            showSearchResults();
        }
        
        const searchBtnIcon = searchBtn.querySelector('i');
        
        // 设置加载状态
        if (!isLoadMore) {
            searchBtnIcon.className = 'fas fa-spinner fa-spin';
            searchBtn.disabled = true;
        } else {
            isLoadingMore = true;
            // 可以在列表底部显示加载中...
        }
        
        try {
            // 网易云 API
            const url = `https://oiapi.net/api/Music_163?name=${encodeURIComponent(keyword)}&page=${currentSearchPage}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 0 && data.data) {
                const list = data.data;
                
                if (list.length > 0) {
                    searchResults = isLoadMore ? [...searchResults, ...list] : list;
                    renderSearchResults(list, isLoadMore);
                    currentSearchPage += 10;
                } else {
                    hasMoreResults = false;
                    if (!isLoadMore) alert('未找到相关歌曲');
                }
            } else {
                if (!isLoadMore) alert('搜索失败: ' + (data.message || '未知错误'));
            }
        } catch (error) {
            console.error('搜索出错:', error);
            if (!isLoadMore) alert('搜索出错，请稍后重试');
        } finally {
            // 恢复按钮状态
            if (!isLoadMore) {
                searchBtnIcon.className = 'fas fa-search';
                searchBtn.disabled = false;
            } else {
                isLoadingMore = false;
            }
        }
    }
    
    // 渲染搜索结果
    function renderSearchResults(list, isAppend) {
        if (!isAppend) {
            searchResultsEl.innerHTML = '';
        }
        
        // 计算起始序号
        // 既然页面从0开始，那么第一页的起始是 0
        const startIndex = currentSearchPage;
        
        list.forEach((item, index) => {
            const globalIndex = startIndex + index + 1; // 全局序号，从1开始
            const title = item.name;
            const artist = item.singers ? item.singers.map(s => s.name).join('/') : '未知';
            const picurl = item.picurl || item.picture || '';
            
            const li = document.createElement('li');
            li.className = 'playlist-item';
            
            let imgHtml = '';
            if (picurl) {
                imgHtml = `<img src="${picurl}" alt="Cover" class="item-cover">`;
            } else {
                imgHtml = `<div class="item-cover-placeholder"><i class="fas fa-music"></i></div>`;
            }
            
            li.innerHTML = `
                <span class="song-index">${globalIndex}</span>
                ${imgHtml}
                <div class="song-detail">
                    <span class="song-name">${title}</span>
                    <span class="artist-name">${artist}</span>
                </div>
                <button class="action-btn play-btn" title="播放"><i class="fas fa-play"></i></button>
            `;
            
            li.addEventListener('click', () => {
                fetchAndPlaySong(item);
            });
            
            searchResultsEl.appendChild(li);
        });
    }
    
    // 监听滚动加载更多
    searchResultsEl.addEventListener('scroll', () => {
        if (isLoadingMore || !hasMoreResults) return;
        
        const { scrollTop, scrollHeight, clientHeight } = searchResultsEl;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            searchMusic(currentSearchKeyword, true);
        }
    });
    
    // 显示搜索结果视图
    function showSearchResults() {
        playlistSidebar.classList.add('active');
        sidebarTabs.style.display = 'flex';
        
        // 切换 Tab
        tabPlaylist.classList.remove('active');
        tabSearch.classList.add('active');
        
        playlistEl.style.display = 'none';
        searchResultsEl.style.display = 'block';
        sidebarTitle.innerText = '搜索结果';
    }
    
    // 切换到播放列表视图
    function showPlaylist() {
        tabPlaylist.classList.add('active');
        tabSearch.classList.remove('active');
        
        playlistEl.style.display = 'block';
        searchResultsEl.style.display = 'none';
        sidebarTitle.innerText = '播放列表';
    }

    // 获取歌曲详情并播放
    async function fetchAndPlaySong(item) {
        // 显示加载提示
        const prevTitle = document.title;
        document.title = '正在加载歌曲...';
        
        try {
            // 使用 id 获取详情
            const songId = item.id;
            const url = `https://oiapi.net/api/Music_163?id=${songId}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 0 && data.data) {
                // 注意：API 返回的是 data 数组，我们取第一个元素
                const result = Array.isArray(data.data) ? data.data[0] : data.data;
                
                if (!result) {
                    throw new Error('歌曲数据为空');
                }

                const songData = {
                    title: result.name,
                    artist: result.singers ? result.singers[0].name : '未知歌手',
                    cover: result.picurl || result.picture || item.picurl || item.picture, // 优先使用详情里的封面，如果没有则使用列表里的
                    src: result.music_url || result.url, // 兼容不同的 URL 字段名
                    id: songId,
                    lrc: result.lrc
                };
                
                addToPlaylistAndPlay(songData);
                
                // 获取歌词
                fetchLyrics(songId);
                // 切换回播放列表视图
                showPlaylist();
                // 关闭侧边栏，防止遮挡播放器
                playlistSidebar.classList.remove('active');
            } else {
                alert('无法获取歌曲链接: ' + (data.message || '未知错误'));
            }
        } catch (error) {
            console.error('获取详情失败:', error);
            alert('获取歌曲详情失败');
        } finally {
            document.title = prevTitle;
        }
    }
    
    // 获取歌词
    async function fetchLyrics(songId) {
        // 清空现有歌词
        renderLyrics([]);
        
        try {
            // 使用 codetabs 代理解决跨域问题（替代被屏蔽的 corsproxy.io）
            const targetUrl = `https://music.163.com/api/song/lyric?os=pc&id=${songId}&lv=-1&kv=-1&tv=-1`;
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
            
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.code === 200 && data.lrc && data.lrc.lyric) {
                const lyrics = parseLyrics(data.lrc.lyric);
                renderLyrics(lyrics);
            } else {
                renderLyrics([]);
            }
        } catch (error) {
            console.error('获取歌词失败:', error);
            renderLyrics([]);
        }
    }

    // 添加到播放列表并播放
    function addToPlaylistAndPlay(song) {
        // 检查是否已存在
        const existingIndex = playlist.findIndex(item => item.title === song.title && item.artist === song.artist);
        
        if (existingIndex !== -1) {
            // 已存在，直接播放
            loadSong(existingIndex);
            playSong();
        } else {
            // 添加新歌曲
            playlist.push(song);
            initPlaylist(); // 重新渲染列表
            loadSong(playlist.length - 1); // 加载最后一首（刚添加的）
            playSong();
        }
        
        // 自动打开播放列表展示效果（可选）
        // playlistSidebar.classList.add('active');
    }

    // 初始化播放列表
    function initPlaylist() {
        playlistEl.innerHTML = '';
        playlist.forEach((song, index) => {
            const li = document.createElement('li');
            li.className = `playlist-item ${index === currentindex ? 'active' : ''}`;
            
            li.innerHTML = `
                <span class="song-index">${index + 1}</span>
                <div class="song-detail">
                    <span class="song-name">${song.title}</span>
                    <span class="artist-name">${song.artist}</span>
                </div>
                <div class="item-actions">
                    <button class="action-btn download-btn" title="下载"><i class="fas fa-download"></i></button>
                    <button class="action-btn remove-btn" title="移除"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // 点击列表项播放
            li.addEventListener('click', (e) => {
                // 如果点击的是按钮，不触发播放
                if (e.target.closest('.action-btn')) return;
                
                loadSong(index);
                playSong();
                updatePlaylistActive();
                // 播放后自动关闭列表
                playlistSidebar.classList.remove('active');
            });

            // 下载按钮事件
            const downloadBtn = li.querySelector('.download-btn');
            downloadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadMusic(song, downloadBtn);
            });

            // 移除按钮事件
            const removeBtn = li.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeSong(index);
            });

            playlistEl.appendChild(li);
        });
    }

    // 下载音乐
    function downloadMusic(song, btnElement) {
        if (!song.src) {
            alert('无法下载：音乐链接无效');
            return;
        }

        const downloadBtn = btnElement;
        const originalIcon = downloadBtn ? downloadBtn.innerHTML : '';
        
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            downloadBtn.disabled = true;
        }

        // 尝试使用 fetch 获取 blob 以强制下载
        fetch(song.src)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${song.title} - ${song.artist}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Download failed, falling back to direct link:', error);
                // 如果 fetch 失败（可能是跨域问题），回退到直接打开链接
                const link = document.createElement('a');
                link.href = song.src;
                link.target = '_blank';
                // 尝试添加 download 属性
                link.download = `${song.title} - ${song.artist}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
            .finally(() => {
                if (downloadBtn) {
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i>'; // 恢复图标
                    downloadBtn.disabled = false;
                }
            });
    }

    // 移除歌曲
    function removeSong(index) {
        if (playlist.length <= 1) {
            alert('播放列表至少需要保留一首歌曲');
            return;
        }

        playlist.splice(index, 1);
        
        // 如果移除的是当前播放的歌曲
        if (index === currentindex) {
            // 切换到下一首，如果已经是最后一首则切换到上一首
            if (currentindex >= playlist.length) {
                currentindex = 0;
            }
            loadSong(currentindex);
            if (isPlaying) playSong();
        } else if (index < currentindex) {
            // 如果移除的是当前播放之前的歌曲，索引减一
            currentindex--;
        }
        
        initPlaylist();
    }

    // 加载歌曲
    function loadSong(index) {
        currentindex = index;
        const song = playlist[index];
        
        songTitle.innerText = song.title;
        artistName.innerText = song.artist;
        audioPlayer.src = song.src;
        
        // 重置进度和时间
        progressBar.style.setProperty('--progress', '0%');
        if (currentTimeEl) currentTimeEl.innerText = '00:00';
        if (durationEl) durationEl.innerText = '00:00';
        
        // 更新封面
        if (song.cover) {
            coverArt.innerHTML = `<img src="${song.cover}" alt="Cover">`;
        } else {
            coverArt.innerHTML = `<i class="fas fa-music"></i>`;
        }

        updatePlaylistActive();
    }

    // 更新播放列表选中状态
    function updatePlaylistActive() {
        const items = document.querySelectorAll('.playlist-item');
        items.forEach((item, index) => {
            if (index === currentindex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    // 播放歌曲
    function playSong() {
        playerWrapper.classList.add('playing');
        record.classList.add('playing');
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        audioPlayer.play();
        isPlaying = true;
    }

    // 暂停歌曲
    function pauseSong() {
        playerWrapper.classList.remove('playing');
        record.classList.remove('playing');
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        audioPlayer.pause();
        isPlaying = false;
    }

    // 上一首
    function prevSong() {
        currentindex--;
        if (currentindex < 0) {
            currentindex = playlist.length - 1;
        }
        loadSong(currentindex);
        if (isPlaying) playSong();
    }

    // 下一首
    function nextSong() {
        if (playMode === 'random') {
            let newIndex = currentindex;
            while (newIndex === currentindex && playlist.length > 1) {
                newIndex = Math.floor(Math.random() * playlist.length);
            }
            currentindex = newIndex;
        } else {
            currentindex++;
            if (currentindex > playlist.length - 1) {
                currentindex = 0;
            }
        }
        loadSong(currentindex);
        if (isPlaying) playSong();
    }

    // 更新进度条
    function updateProgress(e) {
        const { duration, currentTime } = audioPlayer;
        if (isNaN(duration)) {
            // 如果 duration 是 NaN，可能是刚开始加载，显示 00:00
            if (durationEl) durationEl.innerText = '00:00';
            return;
        }
        
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.setProperty('--progress', `${progressPercent}%`);
        
        // 更新时间显示
        if (currentTimeEl) currentTimeEl.innerText = formatTime(currentTime);
        if (durationEl) durationEl.innerText = formatTime(duration);
    }

    // 设置进度
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        
        audioPlayer.currentTime = (clickX / width) * duration;
    }

    // 格式化时间
    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // 切换播放模式
    function toggleMode() {
        if (playMode === 'loop') {
            playMode = 'single';
            modeBtn.innerHTML = '<i class="fas fa-1"></i>'; // 单曲循环图标示意
            modeBtn.title = '单曲循环';
        } else if (playMode === 'single') {
            playMode = 'random';
            modeBtn.innerHTML = '<i class="fas fa-random"></i>';
            modeBtn.title = '随机播放';
        } else {
            playMode = 'loop';
            modeBtn.innerHTML = '<i class="fas fa-repeat"></i>';
            modeBtn.title = '列表循环';
        }
        modeBtn.classList.add('active');
        setTimeout(() => modeBtn.classList.remove('active'), 200);
    }

    // 事件监听
    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    });

    prevBtn.addEventListener('click', prevSong);
    nextBtn.addEventListener('click', nextSong);

    audioPlayer.addEventListener('timeupdate', (e) => {
        updateProgress(e);
        updateLyrics(audioPlayer.currentTime);
    });
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        if (durationEl) durationEl.innerText = formatTime(audioPlayer.duration);
    });
    audioPlayer.addEventListener('ended', () => {
        if (playMode === 'single') {
            playSong();
        } else {
            nextSong();
        }
    });

    progressContainer.addEventListener('click', setProgress);

    listBtn.addEventListener('click', () => {
        playlistSidebar.classList.add('active');
    });

    closeListBtn.addEventListener('click', () => {
        playlistSidebar.classList.remove('active');
    });

    modeBtn.addEventListener('click', toggleMode);
    
    // 搜索事件
    searchBtn.addEventListener('click', () => {
        searchMusic(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMusic(searchInput.value.trim());
        }
    });
    
    // Tab 切换事件
    tabPlaylist.addEventListener('click', showPlaylist);
    tabSearch.addEventListener('click', showSearchResults);

    // 点击侧边栏外部关闭
    document.addEventListener('click', (e) => {
        if (!playlistSidebar.contains(e.target) && !listBtn.contains(e.target) && playlistSidebar.classList.contains('active')) {
            playlistSidebar.classList.remove('active');
        }
    });

    // 初始化
    initPlaylist();
    loadSong(currentindex);
});