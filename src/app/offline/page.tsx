"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────

interface Brick {
    col: number;
    row: number;
    hp: number;
    maxHp: number;
    type: "normal" | "extra_ball" | "pierce";
    shade: number;
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
    launched: boolean;
    delay: number;
}

interface FloatingText {
    x: number;
    y: number;
    text: string;
    life: number;
}

interface Sparkle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
}

interface BallDef {
    id: string;
    name: string;
    price: number;
    radius: number;
    emoji: string | null;
}

// ─── Constants ────────────────────────────────────────────────────

const COLS = 6;
const BALL_SPEED = 11;
const BALL_DELAY = 5;
const EXTRA_BALL_CHANCE = 0.13;
const PIERCE_CHANCE = 0.08;
const BEST_KEY = "hosej_ballz_best";
const STARS_KEY = "hosej_ballz_stars";
const OWNED_KEY = "hosej_ballz_owned";
const ACTIVE_KEY = "hosej_ballz_active";
const MIN_FRAME_MS = 14;

const BALL_DEFS: BallDef[] = [
    { id: "standard", name: "Standard", price: 0, radius: 7, emoji: null },
    { id: "pants", name: "Pants", price: 10000, radius: 9, emoji: "\uD83D\uDC56" },
];

function readPalette() {
    const s = getComputedStyle(document.documentElement);
    const v = (n: string) => s.getPropertyValue(n).trim();
    const hsl = (n: string) => {
        const [h, sat, l] = v(n).split(/\s+/);
        return `hsl(${h}, ${sat}, ${l})`;
    };
    const hsla = (n: string, a: number) => {
        const [h, sat, l] = v(n).split(/\s+/);
        return `hsla(${h}, ${sat}, ${l}, ${a})`;
    };

    return {
        bg: hsl("--background"),
        text: hsl("--foreground"),
        muted: hsl("--muted-foreground"),
        accent: hsl("--accent"),
        accentDim: hsla("--accent", 0.3),
        textDim: hsla("--foreground", 0.15),
    };
}

function loadStars(): number {
    if (typeof window === "undefined") return 0;
    return parseInt(localStorage.getItem(STARS_KEY) || "0");
}

// ─── Component ────────────────────────────────────────────────────

export default function OfflinePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showShop, setShowShop] = useState(false);
    const [stars, setStars] = useState(() => loadStars());
    const [ownedBalls, setOwnedBalls] = useState<string[]>(() => {
        if (typeof window === "undefined") return ["standard"];
        try {
            return JSON.parse(localStorage.getItem(OWNED_KEY) || '["standard"]');
        } catch {
            return ["standard"];
        }
    });
    const [activeBall, setActiveBall] = useState(() =>
        typeof window === "undefined" ? "standard" : localStorage.getItem(ACTIVE_KEY) || "standard"
    );

    // Refs for game loop to read
    const activeBallRef = useRef(activeBall);
    useEffect(() => {
        activeBallRef.current = activeBall;
    }, [activeBall]);

    const addStarsRef = useRef((_amount: number) => {});
    useEffect(() => {
        addStarsRef.current = (amount: number) => {
            setStars((prev) => {
                const next = prev + amount;
                localStorage.setItem(STARS_KEY, String(next));
                return next;
            });
        };
    });

    const buyBall = useCallback(
        (def: BallDef) => {
            if (stars < def.price || ownedBalls.includes(def.id)) return;
            const newStars = stars - def.price;
            const newOwned = [...ownedBalls, def.id];
            setStars(newStars);
            setOwnedBalls(newOwned);
            setActiveBall(def.id);
            localStorage.setItem(STARS_KEY, String(newStars));
            localStorage.setItem(OWNED_KEY, JSON.stringify(newOwned));
            localStorage.setItem(ACTIVE_KEY, def.id);
        },
        [stars, ownedBalls]
    );

    const selectBall = useCallback((id: string) => {
        setActiveBall(id);
        localStorage.setItem(ACTIVE_KEY, id);
    }, []);

    useEffect(() => {
        const reload = () => window.location.reload();
        window.addEventListener("online", reload);
        return () => window.removeEventListener("online", reload);
    }, []);

    // ── Game engine ────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const P = readPalette();

        const gs = {
            phase: "idle" as "idle" | "aiming" | "shooting" | "settling" | "gameover",
            level: 1,
            ballCount: 1,
            score: 0,
            stars: 0,
            bricks: [] as Brick[],
            balls: [] as Ball[],
            floats: [] as FloatingText[],
            sparkles: [] as Sparkle[],
            aimAngle: 0,
            homeX: 0,
            homeY: 0,
            returned: 0,
            newHomeX: 0,
            raf: 0,
            pointerDown: false,
            best: 0,
            ballR: 7,
            ballEmoji: null as string | null,
            starsAdded: false,
        };

        let settleTimeout: ReturnType<typeof setTimeout> | null = null;

        function getLayout() {
            const W = canvas.offsetWidth;
            const H = canvas.offsetHeight;
            const margin = 10;
            const cellW = (W - margin * 2) / COLS;
            const cellH = cellW * 0.85;
            const gridTop = 56;
            const groundY = H - 72;
            return { W, H, margin, cellW, cellH, gridTop, groundY };
        }

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = canvas.offsetWidth * dpr;
            canvas.height = canvas.offsetHeight * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (gs.phase !== "idle" && gs.phase !== "gameover") {
                const { groundY, W } = getLayout();
                gs.homeY = groundY;
                if (gs.homeX === 0) gs.homeX = W / 2;
            }
        }
        resize();
        window.addEventListener("resize", resize);

        function spawnRow(rowIndex: number): Brick[] {
            const level = gs.level;
            const bricks: Brick[] = [];
            const count = Math.min(COLS, 2 + Math.floor(level / 2) + Math.floor(Math.random() * 3));
            const cols = Array.from({ length: COLS }, (_, i) => i)
                .sort(() => Math.random() - 0.5)
                .slice(0, count);

            for (const col of cols) {
                const roll = Math.random();
                let type: Brick["type"] = "normal";
                if (roll < EXTRA_BALL_CHANCE) type = "extra_ball";
                else if (roll < EXTRA_BALL_CHANCE + PIERCE_CHANCE) type = "pierce";

                const hp =
                    type === "normal"
                        ? Math.max(1, Math.floor(level * (0.8 + Math.random() * 0.7)))
                        : 1;

                bricks.push({
                    col,
                    row: rowIndex,
                    hp,
                    maxHp: hp,
                    type,
                    shade: Math.floor(Math.random() * 4),
                });
            }
            return bricks;
        }

        function initGame() {
            const { W, groundY } = getLayout();
            const def = BALL_DEFS.find((b) => b.id === activeBallRef.current) || BALL_DEFS[0];
            gs.ballR = def.radius;
            gs.ballEmoji = def.emoji;
            gs.starsAdded = false;
            gs.phase = "aiming";
            gs.level = 1;
            gs.ballCount = 1;
            gs.score = 0;
            gs.stars = 0;
            gs.balls = [];
            gs.floats = [];
            gs.sparkles = [];
            gs.returned = 0;
            gs.homeX = W / 2;
            gs.homeY = groundY;
            gs.newHomeX = W / 2;
            gs.pointerDown = false;
            gs.bricks = [];
            for (let r = 0; r < 3; r++) gs.bricks.push(...spawnRow(r));
        }

        function shoot() {
            if (gs.phase !== "aiming") return;
            if (Math.abs(gs.aimAngle) > Math.PI / 2 - 0.035) return;

            gs.phase = "shooting";
            gs.returned = 0;
            gs.newHomeX = gs.homeX;

            const vx = Math.sin(gs.aimAngle) * BALL_SPEED;
            const vy = -Math.cos(gs.aimAngle) * BALL_SPEED;

            gs.balls = Array.from({ length: gs.ballCount }, (_, i) => ({
                x: gs.homeX,
                y: gs.homeY - gs.ballR - 1,
                vx,
                vy,
                active: false,
                launched: false,
                delay: i * BALL_DELAY,
            }));
        }

        function advanceLevel() {
            settleTimeout = null;
            gs.level++;
            gs.score += gs.level * 10;
            gs.homeX = gs.newHomeX;
            gs.bricks.forEach((b) => b.row++);

            const { cellH, gridTop, groundY } = getLayout();
            const maxRows = Math.floor((groundY - gridTop - 8) / cellH);
            if (gs.bricks.some((b) => b.row >= maxRows)) {
                gs.phase = "gameover";
                const best = parseInt(localStorage.getItem(BEST_KEY) || "0");
                if (gs.score > best) localStorage.setItem(BEST_KEY, String(gs.score));
                gs.best = Math.max(best, gs.score);
                if (!gs.starsAdded) {
                    gs.starsAdded = true;
                    addStarsRef.current(gs.stars);
                }
                return;
            }

            gs.bricks.push(...spawnRow(0));
            gs.balls = [];
            gs.phase = "aiming";
        }

        function spawnSparkles(x: number, y: number, count = 5) {
            for (let i = 0; i < count; i++) {
                const a = Math.random() * Math.PI * 2;
                const spd = 1 + Math.random() * 2.5;
                gs.sparkles.push({
                    x,
                    y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    life: 1,
                    size: 1.5 + Math.random() * 2,
                });
            }
        }

        // ── Draw helpers ───────────────────────────────────────────
        function drawBrick(
            b: Brick,
            cellW: number,
            cellH: number,
            margin: number,
            gridTop: number
        ) {
            const x = margin + b.col * cellW;
            const y = gridTop + b.row * cellH;
            const pad = 3;
            const bx = x + pad,
                by = y + pad,
                bw = cellW - pad * 2,
                bh = cellH - pad * 2;

            const SHADE_ALPHA = [0.14, 0.22, 0.32, 0.44];

            if (b.type === "extra_ball") {
                ctx.save();
                ctx.fillStyle = P.accent;
                ctx.beginPath();
                ctx.arc(bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.42, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = P.bg;
                ctx.font = `bold ${Math.round(bh * 0.45)}px 'Courier New', monospace`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("+1", bx + bw / 2, by + bh / 2 + 1);
                ctx.restore();
                return;
            }

            if (b.type === "pierce") {
                // Rounded rect with ★ — stands out as special
                ctx.save();
                ctx.fillStyle = P.accent;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.roundRect(bx, by, bw, bh, 4);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = P.bg;
                ctx.font = `${Math.round(bh * 0.5)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("\u2605", bx + bw / 2, by + bh / 2);
                ctx.restore();
                return;
            }

            // Normal brick
            const hpRatio = b.hp / b.maxHp;
            const baseAlpha = SHADE_ALPHA[b.shade];
            ctx.save();
            ctx.globalAlpha = baseAlpha * (0.5 + hpRatio * 0.5);
            ctx.fillStyle = P.text;
            ctx.beginPath();
            ctx.roundRect(bx, by, bw, bh, 4);
            ctx.fill();

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = P.text;
            ctx.font = `bold ${b.hp > 99 ? Math.round(bh * 0.28) : Math.round(bh * 0.38)}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(String(b.hp), bx + bw / 2, by + bh / 2 + 1);
            ctx.restore();
        }

        function drawBall(ball: Ball) {
            if (!ball.active && !ball.launched) return;
            ctx.save();
            if (gs.ballEmoji) {
                const hue = (Date.now() / 8) % 360;
                ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
            } else {
                ctx.fillStyle = P.text;
            }
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, gs.ballR, 0, Math.PI * 2);
            ctx.fill();
            if (gs.ballEmoji) {
                ctx.font = `${Math.round(gs.ballR * 1.4)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(gs.ballEmoji, ball.x + 0.5, ball.y + 0.5);
            }
            ctx.restore();
        }

        function drawAimLine(
            homeX: number,
            homeY: number,
            angle: number,
            W: number,
            margin: number,
            gridTop: number,
            groundY: number
        ) {
            if (gs.phase !== "aiming" || !gs.pointerDown) return;

            let x = homeX,
                y = homeY - gs.ballR - 1;
            let vx = Math.sin(angle) * BALL_SPEED;
            let vy = -Math.cos(angle) * BALL_SPEED;
            const dots: { x: number; y: number }[] = [];

            for (let i = 0; i < 220; i++) {
                x += vx;
                y += vy;
                if (x - gs.ballR < margin) {
                    x = margin + gs.ballR;
                    vx = Math.abs(vx);
                }
                if (x + gs.ballR > W - margin) {
                    x = W - margin - gs.ballR;
                    vx = -Math.abs(vx);
                }
                if (y - gs.ballR < gridTop) {
                    y = gridTop + gs.ballR;
                    vy = Math.abs(vy);
                }
                if (y + gs.ballR > groundY) break;
                if (i % 7 === 0) dots.push({ x, y });
            }

            ctx.save();
            dots.forEach((d, i) => {
                ctx.globalAlpha = (1 - i / dots.length) * 0.5;
                ctx.fillStyle = P.muted;
                ctx.beginPath();
                ctx.arc(d.x, d.y, 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // ── Physics ────────────────────────────────────────────────
        function tickBalls(
            W: number,
            margin: number,
            gridTop: number,
            groundY: number,
            cellW: number,
            cellH: number
        ) {
            if (gs.phase !== "shooting") return;
            const R = gs.ballR;

            gs.balls.forEach((ball) => {
                if (!ball.launched) {
                    ball.delay--;
                    if (ball.delay <= 0) {
                        ball.launched = true;
                        ball.active = true;
                    }
                    return;
                }
                if (!ball.active) return;

                ball.x += ball.vx;
                ball.y += ball.vy;

                if (ball.x - R < margin) {
                    ball.x = margin + R;
                    ball.vx = Math.abs(ball.vx);
                }
                if (ball.x + R > W - margin) {
                    ball.x = W - margin - R;
                    ball.vx = -Math.abs(ball.vx);
                }
                if (ball.y - R < gridTop) {
                    ball.y = gridTop + R;
                    ball.vy = Math.abs(ball.vy);
                }

                if (ball.y + R >= groundY) {
                    ball.active = false;
                    if (gs.returned === 0) {
                        gs.newHomeX = Math.max(margin + R, Math.min(W - margin - R, ball.x));
                    }
                    gs.returned++;
                    return;
                }

                for (let i = gs.bricks.length - 1; i >= 0; i--) {
                    const b = gs.bricks[i];
                    const bx = margin + b.col * cellW + 3;
                    const by = gridTop + b.row * cellH + 3;
                    const bw = cellW - 6,
                        bh = cellH - 6;

                    const nearX = Math.max(bx, Math.min(ball.x, bx + bw));
                    const nearY = Math.max(by, Math.min(ball.y, by + bh));
                    const dx = ball.x - nearX;
                    const dy = ball.y - nearY;
                    if (dx * dx + dy * dy > R * R) continue;

                    if (b.type === "extra_ball") {
                        gs.ballCount++;
                        gs.bricks.splice(i, 1);
                        gs.floats.push({ x: bx + bw / 2, y: by, text: "+1", life: 1 });
                        spawnSparkles(bx + bw / 2, by + bh / 2);
                        continue;
                    }

                    if (b.type === "pierce") {
                        gs.bricks.splice(i, 1);
                        gs.stars++;
                        gs.floats.push({
                            x: bx + bw / 2,
                            y: by,
                            text: "+1 \u2605",
                            life: 1,
                        });
                        spawnSparkles(bx + bw / 2, by + bh / 2);
                        continue;
                    }

                    b.hp--;
                    spawnSparkles(nearX, nearY, 3);

                    if (b.hp <= 0) {
                        gs.bricks.splice(i, 1);
                        gs.score += b.maxHp;
                        gs.floats.push({
                            x: bx + bw / 2,
                            y: by,
                            text: `+${b.maxHp}`,
                            life: 1,
                        });
                        spawnSparkles(bx + bw / 2, by + bh / 2, 10);
                    }

                    const overlapL = ball.x + R - bx;
                    const overlapR = bx + bw - (ball.x - R);
                    const overlapT = ball.y + R - by;
                    const overlapB = by + bh - (ball.y - R);
                    const minOv = Math.min(overlapL, overlapR, overlapT, overlapB);
                    if (minOv === overlapL || minOv === overlapR) ball.vx *= -1;
                    else ball.vy *= -1;
                    break;
                }
            });

            if (gs.balls.every((b) => b.launched) && gs.balls.every((b) => !b.active)) {
                gs.phase = "settling";
                settleTimeout = setTimeout(advanceLevel, 320);
            }
        }

        // ── Main loop ──────────────────────────────────────────────
        let lastTick = 0;

        function loop(now: number) {
            gs.raf = requestAnimationFrame(loop);
            if (now - lastTick < MIN_FRAME_MS) return;
            lastTick = now;

            const { W, H, margin, cellW, cellH, gridTop, groundY } = getLayout();

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = P.bg;
            ctx.fillRect(0, 0, W, H);

            // ── Idle ──
            if (gs.phase === "idle") {
                const totalStars = loadStars();
                ctx.textAlign = "center";

                ctx.fillStyle = P.muted;
                ctx.font = "13px 'Courier New', monospace";
                ctx.fillText("you're offline", W / 2, H * 0.38);

                ctx.fillStyle = P.accent;
                ctx.font = "14px 'Courier New', monospace";
                ctx.fillText("tap to play", W / 2, H * 0.38 + 32);

                ctx.fillStyle = P.muted;
                ctx.font = "12px 'Courier New', monospace";
                ctx.fillText(`\u2605 ${totalStars.toLocaleString()}`, W / 2, H * 0.38 + 64);

                const best = parseInt(localStorage.getItem(BEST_KEY) || "0");
                if (best > 0) {
                    ctx.fillText(`best  ${best}`, W / 2, H * 0.38 + 86);
                }
                return;
            }

            // Ground line
            ctx.fillStyle = P.accentDim;
            ctx.fillRect(margin, groundY, W - margin * 2, 1);

            // Physics
            tickBalls(W, margin, gridTop, groundY, cellW, cellH);

            // Bricks
            gs.bricks.forEach((b) => drawBrick(b, cellW, cellH, margin, gridTop));

            // Aim
            drawAimLine(gs.homeX, gs.homeY, gs.aimAngle, W, margin, gridTop, groundY);

            // Home ball
            if (gs.phase === "aiming") {
                ctx.save();
                if (gs.ballEmoji) {
                    const hue = (Date.now() / 8) % 360;
                    ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
                } else {
                    ctx.fillStyle = P.text;
                }
                ctx.beginPath();
                ctx.arc(gs.homeX, gs.homeY, gs.ballR, 0, Math.PI * 2);
                ctx.fill();
                if (gs.ballEmoji) {
                    ctx.font = `${Math.round(gs.ballR * 1.4)}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(gs.ballEmoji, gs.homeX + 0.5, gs.homeY + 0.5);
                }
                ctx.restore();
            }

            // Active balls
            gs.balls.forEach(drawBall);

            // Sparkles
            gs.sparkles.forEach((sp) => {
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.vy += 0.08;
                sp.life -= 0.05;
                ctx.save();
                ctx.globalAlpha = Math.max(0, sp.life * 0.6);
                ctx.fillStyle = P.accent;
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            gs.sparkles = gs.sparkles.filter((sp) => sp.life > 0);

            // Floating texts
            gs.floats.forEach((f) => {
                f.y -= 1;
                f.life -= 0.025;
                ctx.save();
                ctx.globalAlpha = Math.max(0, f.life);
                ctx.fillStyle = P.text;
                ctx.font = "bold 12px 'Courier New', monospace";
                ctx.textAlign = "center";
                ctx.fillText(f.text, f.x, f.y);
                ctx.restore();
            });
            gs.floats = gs.floats.filter((f) => f.life > 0);

            // ── HUD ──
            ctx.fillStyle = P.bg;
            ctx.fillRect(0, 0, W, gridTop);

            ctx.textAlign = "left";
            ctx.fillStyle = P.muted;
            ctx.font = "9px 'Courier New', monospace";
            ctx.fillText("OFFLINE", margin + 4, 16);

            ctx.textAlign = "center";
            ctx.fillStyle = P.text;
            ctx.font = "bold 15px 'Courier New', monospace";
            ctx.fillText(`LVL ${gs.level}`, W / 2, 40);

            ctx.textAlign = "left";
            ctx.fillStyle = P.muted;
            ctx.font = "12px 'Courier New', monospace";
            ctx.fillText(`\u25CF ${gs.ballCount}   \u2605 ${gs.stars}`, margin + 4, 40);

            ctx.textAlign = "right";
            ctx.fillStyle = P.muted;
            ctx.font = "12px 'Courier New', monospace";
            ctx.fillText(`${gs.score}`, W - margin, 40);

            ctx.fillStyle = P.textDim;
            ctx.fillRect(0, gridTop - 1, W, 1);

            // ── Game over ──
            if (gs.phase === "gameover") {
                ctx.globalAlpha = 0.9;
                ctx.fillStyle = P.bg;
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;
                ctx.textAlign = "center";

                ctx.fillStyle = P.text;
                ctx.font = "bold 28px 'Courier New', monospace";
                ctx.fillText("GAME OVER", W / 2, H * 0.32);

                ctx.fillStyle = P.text;
                ctx.font = "bold 18px 'Courier New', monospace";
                ctx.fillText(`score  ${gs.score}`, W / 2, H * 0.32 + 42);

                ctx.fillStyle = P.accent;
                ctx.font = "bold 18px 'Courier New', monospace";
                ctx.fillText(`\u2605  +${gs.stars}`, W / 2, H * 0.32 + 68);

                ctx.fillStyle = P.muted;
                ctx.font = "12px 'Courier New', monospace";
                ctx.fillText(`total  \u2605 ${loadStars().toLocaleString()}`, W / 2, H * 0.32 + 96);

                const saved = parseInt(localStorage.getItem(BEST_KEY) || "0");
                if (gs.score >= saved && gs.score > 0) {
                    ctx.fillStyle = P.accent;
                    ctx.font = "bold 13px 'Courier New', monospace";
                    ctx.fillText("new best", W / 2, H * 0.32 + 118);
                } else {
                    ctx.fillStyle = P.muted;
                    ctx.font = "12px 'Courier New', monospace";
                    ctx.fillText(`best  ${saved}`, W / 2, H * 0.32 + 118);
                }

                ctx.fillStyle = P.muted;
                ctx.font = "13px 'Courier New', monospace";
                ctx.fillText("tap to play again", W / 2, H * 0.32 + 152);
            }
        }

        gs.raf = requestAnimationFrame(loop);

        // ── Pointer handling ───────────────────────────────────────
        function updateAim(px: number, py: number) {
            const maxAngle = Math.PI / 2 - 0.035;
            const dy = gs.homeY - py;
            if (dy < 10) return;
            const dx = px - gs.homeX;
            const raw = Math.atan2(dx, dy);
            gs.aimAngle = Math.max(-maxAngle, Math.min(maxAngle, raw));
        }

        function onPointerDown(e: PointerEvent) {
            if (gs.phase === "idle" || gs.phase === "gameover") {
                initGame();
                return;
            }
            if (gs.phase !== "aiming") return;
            gs.pointerDown = true;
            const rect = canvas.getBoundingClientRect();
            updateAim(e.clientX - rect.left, e.clientY - rect.top);
        }

        function onPointerMove(e: PointerEvent) {
            if (!gs.pointerDown || gs.phase !== "aiming") return;
            const rect = canvas.getBoundingClientRect();
            updateAim(e.clientX - rect.left, e.clientY - rect.top);
        }

        function onPointerUp() {
            if (!gs.pointerDown) return;
            gs.pointerDown = false;
            shoot();
        }

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointerleave", onPointerUp);

        return () => {
            cancelAnimationFrame(gs.raf);
            if (settleTimeout) clearTimeout(settleTimeout);
            window.removeEventListener("resize", resize);
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointermove", onPointerMove);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointerleave", onPointerUp);
        };
    }, []);

    // ── Shop ───────────────────────────────────────────────────────
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
                overflow: "hidden",
                overscrollBehavior: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    touchAction: "none",
                }}
            />

            <button
                onClick={() => window.location.reload()}
                style={{
                    position: "absolute",
                    top: 8,
                    right: 14,
                    zIndex: 10,
                    background: "none",
                    border: "none",
                    color: "hsl(var(--muted-foreground))",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                    cursor: "pointer",
                    padding: "4px 8px",
                    opacity: 0.6,
                }}
            >
                retry &#8635;
            </button>

            <button
                onClick={() => setShowShop(true)}
                style={{
                    position: "absolute",
                    bottom: 24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                    background: "none",
                    border: "none",
                    color: "hsl(var(--muted-foreground))",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 13,
                    cursor: "pointer",
                    padding: "6px 16px",
                    opacity: 0.6,
                }}
            >
                shop
            </button>

            {showShop && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 30,
                        background: "hsl(var(--background))",
                        display: "flex",
                        flexDirection: "column",
                        fontFamily: "'Courier New', monospace",
                        touchAction: "auto",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "16px 20px",
                        }}
                    >
                        <span
                            style={{
                                color: "hsl(var(--foreground))",
                                fontSize: 14,
                                fontWeight: "bold",
                            }}
                        >
                            &#9733; {stars.toLocaleString()}
                        </span>
                        <button
                            onClick={() => setShowShop(false)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "hsl(var(--muted-foreground))",
                                fontSize: 20,
                                cursor: "pointer",
                                padding: "4px 8px",
                                fontFamily: "'Courier New', monospace",
                            }}
                        >
                            &#10005;
                        </button>
                    </div>

                    {/* Ball list */}
                    <div style={{ flex: 1, padding: "0 20px" }}>
                        {BALL_DEFS.map((def) => {
                            const owned = ownedBalls.includes(def.id);
                            const isActive = activeBall === def.id;
                            const canAfford = stars >= def.price;
                            return (
                                <div
                                    key={def.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        padding: "16px 0",
                                        borderBottom: "1px solid hsl(var(--border))",
                                    }}
                                >
                                    {/* Preview */}
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: "50%",
                                            background: "hsl(var(--foreground))",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: def.emoji ? 18 : 10,
                                            flexShrink: 0,
                                            position: "relative",
                                            transform: def.radius > 7 ? "scale(1.15)" : undefined,
                                        }}
                                    >
                                        {def.emoji && <span>{def.emoji}</span>}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                color: "hsl(var(--foreground))",
                                                fontSize: 14,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {def.name}
                                        </div>
                                        <div
                                            style={{
                                                color: "hsl(var(--muted-foreground))",
                                                fontSize: 12,
                                                marginTop: 2,
                                            }}
                                        >
                                            {def.price === 0
                                                ? "free"
                                                : `\u2605 ${def.price.toLocaleString()}`}
                                            {def.radius > 7 && " \u00B7 larger hitbox"}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {isActive ? (
                                        <span
                                            style={{
                                                color: "hsl(var(--accent))",
                                                fontSize: 12,
                                            }}
                                        >
                                            equipped
                                        </span>
                                    ) : owned ? (
                                        <button
                                            onClick={() => selectBall(def.id)}
                                            style={{
                                                background: "none",
                                                border: "1px solid hsl(var(--accent))",
                                                color: "hsl(var(--accent))",
                                                borderRadius: 4,
                                                padding: "5px 14px",
                                                fontSize: 12,
                                                cursor: "pointer",
                                                fontFamily: "'Courier New', monospace",
                                            }}
                                        >
                                            equip
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => buyBall(def)}
                                            disabled={!canAfford}
                                            style={{
                                                background: canAfford
                                                    ? "hsl(var(--accent))"
                                                    : "hsl(var(--muted))",
                                                border: "none",
                                                color: canAfford
                                                    ? "hsl(var(--accent-foreground))"
                                                    : "hsl(var(--muted-foreground))",
                                                borderRadius: 4,
                                                padding: "5px 14px",
                                                fontSize: 12,
                                                cursor: canAfford ? "pointer" : "default",
                                                fontFamily: "'Courier New', monospace",
                                                opacity: canAfford ? 1 : 0.5,
                                            }}
                                        >
                                            buy
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
