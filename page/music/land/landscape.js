(function(){
    "use strict";

    /* ---------- DOM 元素 ---------- */
    const audio = document.getElementById('audioPlayer');
    const coverImg = document.getElementById('coverImage');
    const songTitle = document.getElementById('songTitle');
    const songArtist = document.getElementById('songArtist');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const modeBtn = document.getElementById('modeBtn');
    const progressBar = document.getElementById('progressBarContainer');
    const progressFill = document.getElementById('progressFill');
    const progressHandle = document.getElementById('progressHandle');
    const currentTimeSpan = document.getElementById('currentTime');
    const durationSpan = document.getElementById('durationTime');
    const lyricsContainer = document.getElementById('lyricsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const sourceNetease = document.getElementById('sourceNetease');
    const sourceKuwo = document.getElementById('sourceKuwo');
    const themeToggle = document.getElementById('themeToggle');
    const tonearm = document.getElementById('tonearm');
    const playlistToggleBtn = document.getElementById('playlistToggleBtn');
    const playlistPanel = document.getElementById('playlistPanel');
    const closePlaylistBtn = document.getElementById('closePlaylistBtn');
    const playlistItems = document.getElementById('playlistItems');
    const searchResultPanel = document.getElementById('searchResultPanel');
    const closeSearchResultBtn = document.getElementById('closeSearchResultBtn');
    const searchResultList = document.getElementById('searchResultList');
    const searchLoading = document.getElementById('searchLoading');

    /* ---------- 状态变量 ---------- */
    let currentSong = null;                 // 当前播放歌曲对象
    let playlist = [];                      // 播放列表
    let currentIndex = -1;                 // 当前播放索引
    let playMode = 0;                      // 0:列表循环,1:单曲循环,2:随机
    let currentSource = 'netease';          // 'netease' 或 'kuwo'
    let lyrics = [];                        // 解析后的歌词数组 [{time, text}]
    let searchPage = 1;
    let searchKeyword = '';
    let isLoadingSearch = false;
    let hasMoreSearch = true;
    let theme = localStorage.getItem('theme') || 'light';

    // 初始化主题
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon();

    /* ---------- 工具函数 ---------- */
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function parseLrc(lrcText) {
        const lines = lrcText.split('\n');
        const result = [];
        const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
        for (let line of lines) {
            const match = line.match(timeReg);
            if (!match) continue;
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const millis = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + millis / 1000;
            const text = line.replace(timeReg, '').trim();
            if (text) result.push({ time, text });
        }
        return result.sort((a,b) => a.time - b.time);
    }

    function renderLyrics(lyricData) {
        lyricsContainer.innerHTML = '';
        if (!lyricData || lyricData.length === 0) {
            lyricsContainer.innerHTML = '<div class="lyrics-placeholder">暂无歌词</div>';
            return;
        }
        lyricData.forEach((line, idx) => {
            const div = document.createElement('div');
            div.className = 'lyric-line';
            div.dataset.index = idx;
            div.dataset.time = line.time;
            div.textContent = line.text;
            lyricsContainer.appendChild(div);
        });
    }

    function updateLyricsHighlight(currentTime) {
        const items = lyricsContainer.querySelectorAll('.lyric-line');
        let activeIndex = -1;
        for (let i=0; i<items.length; i++) {
            const time = parseFloat(items[i].dataset.time);
            if (currentTime >= time) activeIndex = i;
        }
        items.forEach((item, idx) => {
            item.classList.toggle('active', idx === activeIndex);
        });
        if (activeIndex !== -1) {
            const activeEl = items[activeIndex];
            activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    /* ---------- 播放器核心 ---------- */
    function loadSong(song, autoplay = true) {
        if (!song) return;
        currentSong = song;
        songTitle.textContent = song.name || '未知歌曲';
        songArtist.textContent = song.artist || '未知歌手';
        coverImg.src = song.pic || '';
        audio.src = song.url;
        if (autoplay) {
            audio.play().catch(e => console.warn('播放失败', e));
        }
        updatePlayPauseIcon(true);
        coverImg.classList.add('playing');
        tonearm.classList.add('playing');
        // 获取歌词
        fetchLyrics(song);
        // 更新播放列表激活状态
        renderPlaylist();
    }

    function updatePlayPauseIcon(isPlaying) {
        const icon = playPauseBtn.querySelector('i');
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    function playNext() {
        if (playlist.length === 0) return;
        let nextIndex;
        if (playMode === 2) { // 随机
            nextIndex = Math.floor(Math.random() * playlist.length);
        } else {
            nextIndex = (currentIndex + 1) % playlist.length;
        }
        currentIndex = nextIndex;
        loadSong(playlist[currentIndex], true);
    }

    function playPrev() {
        if (playlist.length === 0) return;
        let prevIndex;
        if (playMode === 2) {
            prevIndex = Math.floor(Math.random() * playlist.length);
        } else {
            prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }
        currentIndex = prevIndex;
        loadSong(playlist[currentIndex], true);
    }

    /* ---------- 播放列表 ---------- */
    function renderPlaylist() {
        playlistItems.innerHTML = '';
        playlist.forEach((song, idx) => {
            const li = document.createElement('li');
            li.className = `playlist-item ${idx === currentIndex ? 'active' : ''}`;
            li.innerHTML = `
                <div class="item-info">
                    <div class="item-title">${song.name}</div>
                    <div class="item-artist">${song.artist}</div>
                </div>
                <div class="item-remove" data-index="${idx}"><i class="fas fa-times"></i></div>
            `;
            li.addEventListener('click', (e) => {
                if (e.target.closest('.item-remove')) {
                    e.stopPropagation();
                    const index = parseInt(e.target.closest('.item-remove').dataset.index);
                    removeFromPlaylist(index);
                } else {
                    currentIndex = idx;
                    loadSong(playlist[idx], true);
                    renderPlaylist();
                }
            });
            playlistItems.appendChild(li);
        });
    }

    function addToPlaylist(song) {
        // 简单去重
        if (!playlist.some(s => s.id === song.id)) {
            playlist.push(song);
            if (playlist.length === 1) {
                currentIndex = 0;
                loadSong(song, true);
            }
            renderPlaylist();
        } else {
            alert('歌曲已在播放列表中');
        }
    }

    function removeFromPlaylist(index) {
        if (index === currentIndex) {
            audio.pause();
            currentSong = null;
            coverImg.classList.remove('playing');
            tonearm.classList.remove('playing');
        }
        playlist.splice(index, 1);
        if (index < currentIndex) currentIndex--;
        else if (index === currentIndex) {
            if (playlist.length > 0) {
                currentIndex = Math.min(currentIndex, playlist.length - 1);
                loadSong(playlist[currentIndex], true);
            } else {
                currentIndex = -1;
                songTitle.textContent = '未播放歌曲';
                songArtist.textContent = '-';
                coverImg.src = 'data:image/svg+xml,...'; // 默认封面
                lyricsContainer.innerHTML = '<div class="lyrics-placeholder">暂无歌词</div>';
            }
        }
        renderPlaylist();
    }

    /* ---------- API 搜索 ---------- */
    async function searchSongs(keyword, isLoadMore = false) {
        if (!keyword) return;
        if (!isLoadMore) {
            searchPage = 1;
            searchResultList.innerHTML = '';
            hasMoreSearch = true;
        }
        if (isLoadingSearch || !hasMoreSearch) return;
        isLoadingSearch = true;
        searchLoading.classList.remove('hidden');
        try {
            const apiUrl = currentSource === 'netease'
                ? `https://oiapi.net/API/CloudMusic/?msg=${encodeURIComponent(keyword)}&n=1&p=${searchPage}`
                : `https://api.codetabs.com/v1/proxy/?quest=http://kuwo.cn/api/www/search/searchMusicBykeyWord?key=${encodeURIComponent(keyword)}&pn=${searchPage}&rn=20`;
            
            let response = await fetch(apiUrl);
            let data = await response.json();
            let songs = [];
            if (currentSource === 'netease') {
                if (data.code === 200 && data.data) {
                    songs = data.data.map(item => ({
                        id: 'ne_' + item.id,
                        name: item.name,
                        artist: item.artists,
                        pic: item.pic,
                        url: item.url
                    }));
                }
            } else {
                if (data.code === 200 && data.data && data.data.list) {
                    songs = data.data.list.map(item => ({
                        id: 'kw_' + item.rid,
                        name: item.name,
                        artist: item.artist,
                        pic: item.pic,
                        url: `https://api.codetabs.com/v1/proxy/?quest=http://kuwo.cn/url?format=mp3&rid=${item.rid}&response=url&type=convert_url3`
                    }));
                }
            }
            if (songs.length === 0) hasMoreSearch = false;
            renderSearchResults(songs, isLoadMore);
            searchPage++;
        } catch (e) {
            console.error('搜索出错', e);
        } finally {
            isLoadingSearch = false;
            searchLoading.classList.add('hidden');
        }
    }

    function renderSearchResults(songs, append = false) {
        if (!append) searchResultList.innerHTML = '';
        songs.forEach(song => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `
                <div class="item-info">
                    <div class="item-title">${song.name}</div>
                    <div class="item-artist">${song.artist}</div>
                </div>
                <i class="fas fa-plus"></i>
            `;
            div.addEventListener('click', () => {
                addToPlaylist(song);
                searchResultPanel.classList.add('hidden');
            });
            searchResultList.appendChild(div);
        });
    }

    async function fetchLyrics(song) {
        try {
            let lrcUrl = '';
            if (currentSource === 'netease') {
                const id = song.id.replace('ne_', '');
                lrcUrl = `https://oiapi.net/API/CloudMusic/?msg=${id}&n=1&type=lrc`;
            } else {
                // 酷我歌词略复杂，简化处理
                lyrics = [];
                renderLyrics([]);
                return;
            }
            const resp = await fetch(lrcUrl);
            const data = await resp.json();
            if (data.lrc) {
                lyrics = parseLrc(data.lrc);
                renderLyrics(lyrics);
            } else {
                lyrics = [];
                renderLyrics([]);
            }
        } catch (e) {
            lyrics = [];
            renderLyrics([]);
        }
    }

    /* ---------- 事件绑定 ---------- */
    audio.addEventListener('timeupdate', () => {
        const current = audio.currentTime;
        const duration = audio.duration || 0;
        const percent = duration ? (current / duration) * 100 : 0;
        progressFill.style.width = percent + '%';
        progressHandle.style.left = percent + '%';
        currentTimeSpan.textContent = formatTime(current);
        if (duration) durationSpan.textContent = formatTime(duration);
        updateLyricsHighlight(current);
    });

    audio.addEventListener('loadedmetadata', () => {
        durationSpan.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('play', () => {
        updatePlayPauseIcon(true);
        coverImg.classList.add('playing');
        tonearm.classList.add('playing');
    });

    audio.addEventListener('pause', () => {
        updatePlayPauseIcon(false);
        coverImg.classList.remove('playing');
        tonearm.classList.remove('playing');
    });

    audio.addEventListener('ended', playNext);

    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });

    playPauseBtn.addEventListener('click', () => {
        if (audio.paused) audio.play(); else audio.pause();
    });

    prevBtn.addEventListener('click', playPrev);
    nextBtn.addEventListener('click', playNext);

    modeBtn.addEventListener('click', () => {
        playMode = (playMode + 1) % 3;
        const icons = ['fa-redo-alt', 'fa-undo-alt', 'fa-random'];
        modeBtn.querySelector('i').className = `fas ${icons[playMode]}`;
    });

    searchBtn.addEventListener('click', () => {
        searchKeyword = searchInput.value.trim();
        if (!searchKeyword) return;
        searchResultPanel.classList.remove('hidden');
        searchSongs(searchKeyword);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    sourceNetease.addEventListener('click', () => {
        currentSource = 'netease';
        sourceNetease.classList.add('active');
        sourceKuwo.classList.remove('active');
    });

    sourceKuwo.addEventListener('click', () => {
        currentSource = 'kuwo';
        sourceKuwo.classList.add('active');
        sourceNetease.classList.remove('active');
    });

    themeToggle.addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon();
    });

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    playlistToggleBtn.addEventListener('click', () => {
        playlistPanel.classList.toggle('hidden');
    });

    closePlaylistBtn.addEventListener('click', () => {
        playlistPanel.classList.add('hidden');
    });

    closeSearchResultBtn.addEventListener('click', () => {
        searchResultPanel.classList.add('hidden');
    });

    // 搜索滚动加载
    searchResultList.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = searchResultList;
        if (scrollHeight - scrollTop - clientHeight < 50 && !isLoadingSearch && hasMoreSearch) {
            searchSongs(searchKeyword, true);
        }
    });

    // 初始化示例数据 (可选)
    (function initDemo() {
        // 可添加一首默认歌曲，方便测试
    })();

})();