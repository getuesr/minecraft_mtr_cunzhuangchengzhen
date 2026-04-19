// ========= 加载超时检测 =========
let loadTimeout = setTimeout(() => {
    const skipLink = document.getElementById('loadingSkipLink');
    if (skipLink) skipLink.style.display = 'block';
}, 3000);

function skipLoading() {
    clearTimeout(loadTimeout);
    const loadingOverlay = document.getElementById('loadingOverlay');
    const mainContent = document.getElementById('mainContent');
    if (loadingOverlay && mainContent) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            mainContent.classList.add('visible');
        }, 400);
    }
}
document.getElementById('loadingSkipLink')?.addEventListener('click', skipLoading);

window.addEventListener('load', function() {
    clearTimeout(loadTimeout);
    const loadingOverlay = document.getElementById('loadingOverlay');
    const mainContent = document.getElementById('mainContent');
    if (loadingOverlay && mainContent) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            mainContent.classList.add('visible');
        }, 400);
    }
});

// ========= 服内风采图片 =========
const galleryData = [
    { img: "assets/images/img_bac_1.jpg", caption: "村城的列车站" },
    { img: "assets/images/img_bac_2.jpg", caption: "村城新大道" },
    { img: "assets/images/img_bac_3.jpg", caption: "玉金县城(火车站)" },
    { img: "assets/images/img_bac_4.jpg", caption: "云州北" },
    { img: "assets/images/img_bac_5.jpg", caption: "新海市车站" }
];
const galleryGrid = document.getElementById('galleryGrid');
if (galleryGrid) {
    galleryData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
            <div class="gallery-img" style="background-image: url('${item.img}');"></div>
            <div class="gallery-caption">${item.caption}</div>
        `;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            openImageModal(item.img, item.caption);
        });
        galleryGrid.appendChild(div);
    });
}

// 图片预览
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const modalClose = document.querySelector('.modal-close');

function openImageModal(imgSrc, caption) {
    modalImg.src = imgSrc;
    modalImg.alt = caption || '图片预览';
    modal.classList.add('active');
}
function closeImageModal() {
    modal.classList.remove('active');
    setTimeout(() => { modalImg.src = ''; }, 300);
}
modalClose?.addEventListener('click', closeImageModal);
modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeImageModal();
});

// Toast
function showToast(msg, duration = 2000) {
    let existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    let toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

// ========= 服务器状态查询 =========
let nextRefreshTime = 0;

async function doFetchStatus(isManual = false) {
    const statusSpan = document.getElementById('serverStatusValue'); // 旧版卡片（兼容）
    const statusTextSpan = document.getElementById('serverStatusText'); // 新版卡片状态文本
    const onlineSpan = document.getElementById('onlineCount');   // 在线人数
    const maxSpan = document.getElementById('maxCount');         // 最大人数

    if (!statusSpan && !statusTextSpan) return; // 如果两个状态元素都不存在则退出

    if (isManual) {
        const now = Date.now();
        if (nextRefreshTime > now) {
            const remaining = Math.ceil((nextRefreshTime - now) / 1000);
            showToast(`⏳ 请等待 ${remaining} 秒后再刷新`, 1500);
            return;
        }
        nextRefreshTime = now + 20000;
    }

    // 更新 UI 为“检测中”
    if (statusSpan) {
        statusSpan.innerHTML = '<span>检测中...</span> <button class="inline-android-btn small" id="refreshStatusBtn">🔄 刷新</button>';
    }
    if (statusTextSpan) {
        statusTextSpan.innerHTML = '<span>检测中...</span> <button class="inline-android-btn small" id="refreshStatusBtn">🔄 刷新</button>';
    }
    // 绑定刷新按钮事件（避免重复绑定）
    const refreshBtn = document.getElementById('refreshStatusBtn');
    if (refreshBtn && !refreshBtn._hasListener) {
        refreshBtn._hasListener = true;
        refreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            manualRefresh();
        });
    }

    const serverAddress = 'play.simpfun.cn:20070';
    const apis = [
        `https://api.mcsrvstat.us/3/${serverAddress}`,
        `https://api.mcstatus.io/v2/status/java/${serverAddress}`
    ];

    let success = false;
    let onlineCount = 0, maxPlayers = 0;

    for (const apiUrl of apis) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(apiUrl, { signal: controller.signal, headers: { 'User-Agent': 'MTR-Status' } });
            clearTimeout(timeoutId);
            if (!resp.ok) continue;
            const data = await resp.json();

            if (apiUrl.includes('mcsrvstat')) {
                if (data.online === true) {
                    onlineCount = data.players?.online || 0;
                    maxPlayers = data.players?.max || 0;
                    success = true;
                    break;
                }
            } else if (apiUrl.includes('mcstatus.io')) {
                if (data.online === true) {
                    onlineCount = data.players?.online || 0;
                    maxPlayers = data.players?.max || 0;
                    success = true;
                    break;
                }
            }
        } catch (err) {
            console.warn(err);
        }
    }

    // ---------- 统一更新所有 UI 组件 ----------
    const statusHtml = success
        ? `<span class="status-badge status-online"></span> 在线 · ${onlineCount}/${maxPlayers}人 <button class="inline-android-btn small" id="refreshStatusBtn">🔄 刷新</button>`
        : `<span class="status-badge status-offline"></span> 离线（查询失败） <button class="inline-android-btn small" id="refreshStatusBtn">🔄 刷新</button>`;

    // 更新旧版卡片状态区（如果存在）
    if (statusSpan) {
        statusSpan.innerHTML = statusHtml;
    }
    // 更新新版卡片状态区（如果存在）
    if (statusTextSpan) {
        statusTextSpan.innerHTML = statusHtml;
    }
    // 更新卡片标题栏的在线人数
    if (onlineSpan) {
        onlineSpan.textContent = onlineCount;
    }
    if (maxSpan) {
        maxSpan.textContent = maxPlayers;
    }

    // 更新侧边栏小状态（如果该函数已定义）
    if (typeof updateSidebarStatus === 'function') {
        updateSidebarStatus(success, onlineCount, maxPlayers);
    }

    // 重新绑定刷新按钮事件（因为 innerHTML 替换了旧按钮）
    const newRefreshBtn = document.getElementById('refreshStatusBtn');
    if (newRefreshBtn && !newRefreshBtn._hasListener) {
        newRefreshBtn._hasListener = true;
        newRefreshBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            manualRefresh();
        });
    }
}

function manualRefresh() {
    doFetchStatus(true);
}

// 页面加载时自动查询
doFetchStatus(false);

// 复制QQ群号
const QQ_NUMBER = "1070623105";
function copyQQNumber() {
    navigator.clipboard.writeText(QQ_NUMBER).then(() => showToast("✅ QQ群号已复制: " + QQ_NUMBER))
        .catch(() => {
            let ta = document.createElement('textarea');
            ta.value = QQ_NUMBER;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast("✅ QQ群号已复制: " + QQ_NUMBER);
        });
}
document.getElementById('copyQQInlineBtn')?.addEventListener('click', (e) => { e.preventDefault(); copyQQNumber(); });
document.getElementById('copyQQCardBtn')?.addEventListener('click', (e) => { e.preventDefault(); copyQQNumber(); });

// 合作跳转
document.getElementById('hezhouRow')?.addEventListener('click', () => window.open('http://mtrhz.xyz/', '_blank'));
document.getElementById('longtengRow')?.addEventListener('click', () => showToast("🚆 龙腾铁路 · 合作伙伴，敬请期待更多联动内容！"));
document.getElementById('jointBanBadge')?.addEventListener('click', () => window.open('https://mtrhz.xyz/ciyuan.html', '_blank'));
document.querySelectorAll('.tag').forEach(tag => tag.addEventListener('click', () => showToast("✨ 等待您加入建设者名单！")));

// ========= 涟漪效果 =========
(function() {
    const rippleElements = document.querySelectorAll('.item, .tag, .coop-row, .badge-link, .inline-android-btn, #jointBanBadge, #hezhouRow, #longtengRow, .gallery-item');
    function initRipple(el) {
        let lastRippleTime = 0, touchStartTime = 0, touchStartX = 0, touchStartY = 0, pendingRipple = null, moveCancelled = false;
        function removeAllRipples() { el.querySelectorAll('.ripple-effect').forEach(r => r.remove()); }
        function createSingleRipple(clientX, clientY) {
            removeAllRipples();
            const rect = el.getBoundingClientRect();
            let offsetX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
            let offsetY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
            const size = Math.max(rect.width, rect.height) * 1.5;
            const ripple = document.createElement('div');
            ripple.className = 'ripple-effect';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = offsetX - size/2 + 'px';
            ripple.style.top = offsetY - size/2 + 'px';
            el.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        }
        function scheduleRipple(x,y) { if (pendingRipple) clearTimeout(pendingRipple); pendingRipple = setTimeout(() => { if (!moveCancelled) createSingleRipple(x,y); pendingRipple = null; }, 50); }
        function cancelRipple() { if (pendingRipple) clearTimeout(pendingRipple); moveCancelled = false; }
        function handleTouchStart(e) { const touch = e.touches[0]; if (!touch) return; touchStartTime = Date.now(); touchStartX = touch.clientX; touchStartY = touch.clientY; moveCancelled = false; scheduleRipple(touch.clientX, touch.clientY); }
        function handleTouchMove(e) { if (!touchStartTime) return; const touch = e.touches[0]; if (!touch) return; if (Math.abs(touch.clientX - touchStartX) > 8 || Math.abs(touch.clientY - touchStartY) > 8) { moveCancelled = true; cancelRipple(); touchStartTime = 0; } }
        function handleTouchEnd() { cancelRipple(); touchStartTime = 0; if (window.navigator?.vibrate) try { window.navigator.vibrate(8); } catch(e) {} }
        function handleMouseDown(e) { const now = Date.now(); if (now - lastRippleTime < 150) return; lastRippleTime = now; createSingleRipple(e.clientX, e.clientY); }
        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: true });
        el.addEventListener('touchend', handleTouchEnd);
        el.addEventListener('mousedown', handleMouseDown);
    }
    rippleElements.forEach(el => { if (el) initRipple(el); });
})();

// 侧边栏
document.getElementById('sidebarCopyQQ')?.addEventListener('click', copyQQNumber);

// 更新侧边栏状态显示的函数（在 fetchServerStatus 中调用）
function updateSidebarStatus(online, count, max) {
    const statusEl = document.getElementById('sidebarOnlineStatus');
    if (statusEl) {
        if (online) {
            statusEl.innerHTML = `<span class="status-badge status-online"></span> ${count}/${max} 在线`;
        } else {
            statusEl.innerHTML = `<span class="status-badge status-offline"></span> 离线`;
        }
    }
}