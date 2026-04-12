document.addEventListener('DOMContentLoaded', function() {
    let playlist = [];

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
    const closePanelBtn = document.getElementById('closePanelBtn');
    const playlistPanel = document.getElementById('playlistPanel');
    const modeBtn = document.getElementById('modeBtn');
    
    const apiSource = document.getElementById('apiSource');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const tabPlaylist = document.getElementById('tabPlaylist');
    const tabSearch = document.getElementById('tabSearch');
    const searchResultsEl = document.getElementById('searchResults');

    if (apiSource) {
        apiSource.addEventListener('change', () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                searchMusic(keyword);
            }
        });
    }

    const customSelect = document.getElementById('customSelect');
    if (customSelect) {
        const trigger = customSelect.querySelector('.select-trigger');
        const options = customSelect.querySelectorAll('.custom-option');
        const selectValue = document.getElementById('selectValue');
        const realSelect = document.getElementById('apiSource');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelect.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                const value = option.dataset.value;
                const text = option.textContent;
                selectValue.textContent = text;
                if (realSelect) {
                    realSelect.value = value;
                    const event = new Event('change');
                    realSelect.dispatchEvent(event);
                }
                customSelect.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!customSelect.contains(e.target)) {
                customSelect.classList.remove('open');
            }
        });
    }

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            
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

            if (document.startViewTransition) {
                const transition = document.startViewTransition(() => {
                    performSwitch();
                });

                transition.ready.then(() => {
                    const endRadius = Math.hypot(
                        Math.max(x, window.innerWidth - x),
                        Math.max(y, window.innerHeight - y)
                    );

                    document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${endRadius}px at ${x}px ${y}px)`
                            ]
                        },
                        {
                            duration: 500,
                            easing: 'ease-out',
                            pseudoElement: '::view-transition-new(root)'
                        }
                    );
                });
            } else {
                performSwitch();
            }
        });
    }

    let currentindex = 0;
    let isPlaying = false;
    let playMode = 'loop';
    let searchResults = [];
    let currentSearchPage = 0;
    let currentSearchKeyword = '';
    let isLoadingMore = false;
    let hasMoreResults = true;

    let currentLyrics = [];
    let lyricsContainer = null;
    let currentLyricIndex = -1;

    async function fetchKuwoLyrics(musicId, retryCount = 0) {
        const cleanMusicId = musicId.toString().replace(/\D/g, '');
        
        if (retryCount === 0) {
            renderLyrics([]);
            const lyricsContainer = document.getElementById('lyricsContainer');
            if (lyricsContainer) {
                lyricsContainer.innerHTML = '<div class="no-lyrics">正在获取歌词...</div>';
            }
        }

        try {
            const targetUrl = `http://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${cleanMusicId}`;
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
            
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.status === 200 && data.data && data.data.lrclist) {
                const lrclist = data.data.lrclist;
                const lyrics = lrclist.map(item => ({
                    time: parseFloat(item.time),
                    text: item.lineLyric
                }));
                
                if (lyrics.length > 0) {
                    renderLyrics(lyrics);
                } else {
                    renderLyrics([]);
                }
            } else {
                if (retryCount < 10) {
                    fetchKuwoLyrics(musicId, retryCount + 1);
                } else {
                    const lyricsContainer = document.getElementById('lyricsContainer');
                    if (lyricsContainer) {
                        lyricsContainer.innerHTML = '<div class="no-lyrics">歌词获取失败</div>';
                    }
                }
            }
        } catch (error) {
            if (retryCount < 10) {
                fetchKuwoLyrics(musicId, retryCount + 1);
            } else {
                const lyricsContainer = document.getElementById('lyricsContainer');
                if (lyricsContainer) {
                    lyricsContainer.innerHTML = '<div class="no-lyrics">歌词获取失败</div>';
                }
            }
        }
    }

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
                const msStr = match[3];
                const milliseconds = msStr.length === 3 ? parseInt(msStr) : parseInt(msStr) * 10;
                
                const time = minutes * 60 + seconds + milliseconds / 1000;
                const text = line.replace(timeExp, '').trim();
                
                if (text) {
                    lyrics.push({ time, text });
                }
            }
        });
        return lyrics;
    }

    function renderLyrics(lyrics) {
        currentLyrics = lyrics;
        currentLyricIndex = -1;
        
        if (!lyricsContainer) {
            lyricsContainer = document.getElementById('lyricsContainer');
        }
        
        if (!lyricsContainer) return;

        if (!lyrics.length) {
            lyricsContainer.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            return;
        }

        let html = '<div class="lyrics-content">';
        lyrics.forEach((line, index) => {
            html += `<p class="lyrics-line" data-time="${line.time}">${line.text}</p>`;
        });
        html += '</div>';
        
        lyricsContainer.innerHTML = html;
        
        setTimeout(() => {
            const currentTime = audioPlayer.currentTime;
            updateLyrics(currentTime);
        }, 50);
    }

    function updateLyrics(currentTime) {
        if (!currentLyrics.length) return;
        
        if (!lyricsContainer) {
            lyricsContainer = document.getElementById('lyricsContainer');
            if (!lyricsContainer) return;
        }
        
        let index = currentLyrics.findIndex(line => line.time > currentTime);
        
        if (index === -1) {
            index = currentLyrics.length - 1;
        } else {
            index = index - 1;
        }
        
        if (index < 0) index = 0;

        if (index !== currentLyricIndex) {
            currentLyricIndex = index;
            
            const lines = lyricsContainer.querySelectorAll('.lyrics-line');
            lines.forEach(line => line.classList.remove('active'));
            
            if (lines[index]) {
                const activeLine = lines[index];
                activeLine.classList.add('active');
                
                const content = lyricsContainer.querySelector('.lyrics-content');
                if (content) {
                    const containerHeight = lyricsContainer.clientHeight;
                    const lineHeight = activeLine.clientHeight;
                    const offsetTop = activeLine.offsetTop;
                    let scrollY = offsetTop - (containerHeight / 2) + (lineHeight / 2);
                    content.style.transform = `translateY(-${scrollY}px)`;
                }
            }
        }
    }

    async function searchMusic(keyword, isLoadMore = false) {
        if (!keyword) return;
        
        const source = document.getElementById('apiSource').value;

        if (!isLoadMore) {
            currentSearchKeyword = keyword;
            searchResults = [];
            hasMoreResults = true;
            searchResultsEl.innerHTML = '';
            
            if (source === 'netease') {
                currentSearchPage = 0;
            } else {
                currentSearchPage = 1;
            }
            
            showSearchResults();
        }
        
        const searchBtnIcon = searchBtn.querySelector('i');
        
        if (!isLoadMore) {
            searchBtnIcon.className = 'fas fa-spinner fa-spin';
            searchBtn.disabled = true;
        } else {
            isLoadingMore = true;
        }
        
        try {
            let list = [];
            
            if (source === 'netease') {
                const url = `https://oiapi.net/api/Music_163?name=${encodeURIComponent(keyword)}&page=${currentSearchPage}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.code === 0 && data.data) {
                    list = data.data.map(item => ({
                        ...item,
                        source: 'netease'
                    }));
                    currentSearchPage += 10;
                }
            } else if (source === 'kuwo') {
                const url = `https://oiapi.net/api/Kuwo?msg=${encodeURIComponent(keyword)}&page=${currentSearchPage}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.code === 1 && data.data) {
                    list = data.data.map((item, index) => ({
                        name: item.song,
                        singers: [{ name: item.singer }],
                        picurl: item.picture,
                        id: item.rid,
                        source: 'kuwo',
                        page: currentSearchPage,
                        n: index + 1,
                        duration: item.time
                    }));
                    currentSearchPage += 1;
                }
            }
            
            if (list.length > 0) {
                searchResults = isLoadMore ? [...searchResults, ...list] : list;
                renderSearchResults(list, isLoadMore);
            } else {
                hasMoreResults = false;
                if (!isLoadMore) alert('未找到相关歌曲');
            }
        } catch (error) {
            console.error('搜索出错:', error);
            if (!isLoadMore) alert('搜索出错，请稍后重试');
        } finally {
            if (!isLoadMore) {
                searchBtnIcon.className = 'fas fa-search';
                searchBtn.disabled = false;
            } else {
                isLoadingMore = false;
            }
        }
    }

    function renderSearchResults(list, isAppend = false) {
        if (!isAppend) {
            searchResultsEl.innerHTML = '';
        }
        
        let startIndex = 0;
        if (isAppend) {
            startIndex = searchResults.length - list.length;
        }
        
        list.forEach((item, index) => {
            const globalIndex = startIndex + index + 1;
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
            `;
            
            li.addEventListener('click', () => {
                fetchAndPlaySong(item);
            });
            
            searchResultsEl.appendChild(li);
        });
    }
    
    searchResultsEl.addEventListener('scroll', () => {
        if (isLoadingMore || !hasMoreResults) return;
        
        const { scrollTop, scrollHeight, clientHeight } = searchResultsEl;
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            searchMusic(currentSearchKeyword, true);
        }
    });
    
    function showSearchResults() {
        playlistPanel.classList.add('active');
        tabPlaylist.classList.remove('active');
        tabSearch.classList.add('active');
        playlistEl.style.display = 'none';
        searchResultsEl.style.display = 'block';
    }
    
    function showPlaylist() {
        tabPlaylist.classList.add('active');
        tabSearch.classList.remove('active');
        playlistEl.style.display = 'block';
        searchResultsEl.style.display = 'none';
    }

    async function fetchAndPlaySong(item) {
        const prevTitle = document.title;
        document.title = '正在加载歌曲...';
        
        try {
            if (item.source === 'kuwo') {
                const url = `https://oiapi.net/api/Kuwo?msg=${encodeURIComponent(currentSearchKeyword)}&page=${item.page}&n=${item.n}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.code === 1 && data.data) {
                    const result = data.data;
                    const songData = {
                        title: result.song,
                        artist: result.singer,
                        cover: result.picture,
                        src: result.url,
                        id: result.rid || item.id,
                        lrc: '',
                        source: 'kuwo'
                    };
                    
                    addToPlaylistAndPlay(songData);
                    renderLyrics([]);
                    
                    if (songData.id) {
                        fetchKuwoLyrics(songData.id);
                    }

                    showPlaylist();
                    closePanel();
                } else {
                    throw new Error(data.message || '获取歌曲失败');
                }
            } else {
                const songId = item.id;
                const url = `https://oiapi.net/api/Music_163?id=${songId}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.code === 0 && data.data) {
                    const result = Array.isArray(data.data) ? data.data[0] : data.data;
                    
                    if (!result) {
                        throw new Error('歌曲数据为空');
                    }
    
                    const songData = {
                        title: result.name,
                        artist: result.singers ? result.singers[0].name : '未知歌手',
                        cover: result.picurl || result.picture || item.picurl || item.picture,
                        src: result.music_url || result.url,
                        id: songId,
                        lrc: result.lrc,
                        source: 'netease'
                    };
                    
                    addToPlaylistAndPlay(songData);
                    fetchLyrics(songId);
                    showPlaylist();
                    closePanel();
                } else {
                    alert('无法获取歌曲链接: ' + (data.message || '未知错误'));
                }
            }
        } catch (error) {
            console.error('获取详情失败:', error);
            alert('获取歌曲详情失败: ' + (error.message || ''));
        } finally {
            document.title = prevTitle;
        }
    }
    
    async function fetchLyrics(songId) {
        renderLyrics([]);
        
        try {
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

    function addToPlaylistAndPlay(song) {
        const existingIndex = playlist.findIndex(item => item.title === song.title && item.artist === song.artist);
        
        if (existingIndex !== -1) {
            loadSong(existingIndex);
            playSong();
        } else {
            playlist.push(song);
            initPlaylist();
            loadSong(playlist.length - 1);
            playSong();
        }
    }

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
                <button class="action-btn remove-btn" title="移除"><i class="fas fa-trash"></i></button>
            `;
            
            li.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) return;
                loadSong(index);
                playSong();
                updatePlaylistActive();
                closePanel();
            });

            const removeBtn = li.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeSong(index);
            });

            playlistEl.appendChild(li);
        });
    }

    function removeSong(index) {
        if (playlist.length <= 1) {
            alert('播放列表至少需要保留一首歌曲');
            return;
        }

        playlist.splice(index, 1);
        
        if (index === currentindex) {
            if (currentindex >= playlist.length) {
                currentindex = 0;
            }
            loadSong(currentindex);
            if (isPlaying) playSong();
        } else if (index < currentindex) {
            currentindex--;
        }
        
        initPlaylist();
    }

    function loadSong(index) {
        currentindex = index;
        const song = playlist[index];
        
        songTitle.innerText = song.title;
        artistName.innerText = song.artist;
        audioPlayer.src = song.src;
        
        progressBar.style.setProperty('--progress', '0%');
        if (currentTimeEl) currentTimeEl.innerText = '00:00';
        if (durationEl) durationEl.innerText = '00:00';
        
        if (song.cover) {
            coverArt.innerHTML = `<img src="${song.cover}" alt="Cover">`;
        } else {
            coverArt.innerHTML = `<i class="fas fa-music"></i>`;
        }

        updatePlaylistActive();

        renderLyrics([]);
        const lyricsContainer = document.getElementById('lyricsContainer');
        if (lyricsContainer) {
            lyricsContainer.innerHTML = '<div class="no-lyrics">正在获取歌词...</div>';
        }

        if (song.source === 'kuwo' && song.id) {
            fetchKuwoLyrics(song.id);
        } else if (song.id) {
            fetchLyrics(song.id);
        } else {
            if (lyricsContainer) {
                lyricsContainer.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            }
        }

        if (isPlaying) {
            const icon = playBtn.querySelector('i');
            if(icon) icon.className = 'fas fa-pause';
        } else {
            const icon = playBtn.querySelector('i');
            if(icon) icon.className = 'fas fa-play';
        }
    }

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

    function playSong() {
        const playPromise = audioPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                const icon = playBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-pause';
                
                record.style.animationPlayState = 'running';
                tonearm.style.transform = 'rotate(0deg)';
                playerWrapper.classList.add('playing');
                record.classList.add('playing');
                updatePlaylistActive();
            }).catch(error => {
                console.error('Play prevented:', error);
                isPlaying = false;
                const icon = playBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-play';
            });
        }
    }

    function pauseSong() {
        audioPlayer.pause();
        isPlaying = false;
        const icon = playBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-play';
        
        record.style.animationPlayState = 'paused';
        tonearm.style.transform = 'rotate(-30deg)';
        playerWrapper.classList.remove('playing');
        record.classList.remove('playing');
    }

    function openPanel() {
        playlistPanel.classList.add('active');
    }

    function closePanel() {
        playlistPanel.classList.remove('active');
    }
    
    if (playBtn) {
        let lastClickTime = 0;
        playBtn.onclick = (e) => {
            e.stopPropagation();
            
            const now = Date.now();
            if (now - lastClickTime < 300) {
                return;
            }
            lastClickTime = now;

            if (audioPlayer.paused) {
                playSong();
            } else {
                pauseSong();
            }
        };
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevSong);
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSong);
    }

    function prevSong() {
        currentindex--;
        if (currentindex < 0) {
            currentindex = playlist.length - 1;
        }
        loadSong(currentindex);
        if (isPlaying) playSong();
    }

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

    function updateProgress(e) {
        const { duration, currentTime } = audioPlayer;
        if (isNaN(duration)) {
            if (durationEl) durationEl.innerText = '00:00';
            return;
        }
        
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.setProperty('--progress', `${progressPercent}%`);
        
        if (currentTimeEl) currentTimeEl.innerText = formatTime(currentTime);
        if (durationEl) durationEl.innerText = formatTime(duration);
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        
        audioPlayer.currentTime = (clickX / width) * duration;
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }

    function toggleMode() {
        if (playMode === 'loop') {
            playMode = 'single';
            modeBtn.innerHTML = '<i class="fas fa-1"></i>';
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
    }

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

    listBtn.addEventListener('click', openPanel);
    closePanelBtn.addEventListener('click', closePanel);

    modeBtn.addEventListener('click', toggleMode);
    
    searchBtn.addEventListener('click', () => {
        searchMusic(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchMusic(searchInput.value.trim());
        }
    });
    
    tabPlaylist.addEventListener('click', showPlaylist);
    tabSearch.addEventListener('click', showSearchResults);

    document.addEventListener('click', (e) => {
        if (playlistPanel.classList.contains('active') && 
            !playlistPanel.contains(e.target) && 
            !listBtn.contains(e.target)) {
            closePanel();
        }
    });

    initPlaylist();
    if (playlist.length > 0) {
        loadSong(currentindex);
    } else {
        songTitle.innerText = "EggyMusic";
        artistName.innerText = "快去搜索歌曲吧~";
        if (durationEl) durationEl.innerText = "0:00";
    }
});
