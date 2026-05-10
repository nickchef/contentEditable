// ==UserScript==
// @name         ContentEditable 切换悬浮球
// @namespace    https://github.com/zlyu
// @version      1.0.0
// @description  在页面上添加一个可拖动的悬浮球，点击可切换 document.body.contentEditable
// @author       zlyu
// @match        *://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (window.top !== window.self) return;
    if (document.getElementById('__ce_toggle_ball__')) return;

    const STORAGE_KEY = '__ce_toggle_ball_pos__';
    const BALL_SIZE = 48;
    const DRAG_THRESHOLD = 4;

    const ball = document.createElement('div');
    ball.id = '__ce_toggle_ball__';
    ball.textContent = 'CE';
    Object.assign(ball.style, {
        position: 'fixed',
        width: BALL_SIZE + 'px',
        height: BALL_SIZE + 'px',
        lineHeight: BALL_SIZE + 'px',
        textAlign: 'center',
        borderRadius: '50%',
        background: 'rgba(64, 158, 255, 0.9)',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: '2147483647',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
        transition: 'background 0.2s, transform 0.1s',
    });

    const saved = (() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
    })();
    const initX = saved && typeof saved.x === 'number' ? saved.x : window.innerWidth - BALL_SIZE - 20;
    const initY = saved && typeof saved.y === 'number' ? saved.y : window.innerHeight - BALL_SIZE - 80;
    ball.style.left = clamp(initX, 0, window.innerWidth - BALL_SIZE) + 'px';
    ball.style.top = clamp(initY, 0, window.innerHeight - BALL_SIZE) + 'px';

    document.documentElement.appendChild(ball);

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function updateAppearance() {
        const on = document.body.isContentEditable;
        ball.style.background = on ? 'rgba(103, 194, 58, 0.95)' : 'rgba(64, 158, 255, 0.9)';
        ball.title = on ? 'ContentEditable: ON（点击关闭）' : 'ContentEditable: OFF（点击开启）';
    }
    updateAppearance();

    let dragging = false;
    let moved = false;
    let startX = 0, startY = 0;
    let originLeft = 0, originTop = 0;

    ball.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        dragging = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = ball.getBoundingClientRect();
        originLeft = rect.left;
        originTop = rect.top;
        ball.setPointerCapture(e.pointerId);
        ball.style.cursor = 'grabbing';
        ball.style.transition = 'background 0.2s';
        e.preventDefault();
    });

    ball.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) moved = true;
        if (moved) {
            const nx = clamp(originLeft + dx, 0, window.innerWidth - BALL_SIZE);
            const ny = clamp(originTop + dy, 0, window.innerHeight - BALL_SIZE);
            ball.style.left = nx + 'px';
            ball.style.top = ny + 'px';
        }
    });

    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        ball.style.cursor = 'grab';
        try { ball.releasePointerCapture(e.pointerId); } catch (_) {}
        if (moved) {
            const rect = ball.getBoundingClientRect();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: rect.left, y: rect.top }));
            } catch (_) {}
        } else {
            toggleEditable();
        }
    }

    ball.addEventListener('pointerup', endDrag);
    ball.addEventListener('pointercancel', endDrag);

    function toggleEditable() {
        const next = !document.body.isContentEditable;
        document.body.contentEditable = next ? 'true' : 'false';
        updateAppearance();
    }

    window.addEventListener('resize', () => {
        const rect = ball.getBoundingClientRect();
        ball.style.left = clamp(rect.left, 0, window.innerWidth - BALL_SIZE) + 'px';
        ball.style.top = clamp(rect.top, 0, window.innerHeight - BALL_SIZE) + 'px';
    });
})();
