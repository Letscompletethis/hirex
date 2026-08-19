"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
  brightness: number;
  phase: number;
};

type Dust = {
  angle: number;
  radius: number;
  depth: number;
  speed: number;
  size: number;
  phase: number;
};

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
if (!canvasElement) return;

const context = canvasElement.getContext("2d");
if (!context) return;

const canvas = canvasElement;
const ctx = context;

    let animationFrame = 0;
    let destroyed = false;

    let width = window.innerWidth;
    let height = window.innerHeight;

    /*
    ============================================================
    MOUSE
    ============================================================
    */

    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };

    /*
    ============================================================
    SCROLL / LOGO READABILITY
    ============================================================
    */

    let logoVisibility = 1;
    let targetLogoVisibility = 1;

    /*
      The logo lives around the center of the viewport.

      When normal website content occupies this central reading
      zone, the logo becomes softer and less visually dominant.

      We intentionally do this smoothly rather than switching
      between visible/hidden states.
    */

    function updateLogoVisibility() {
      const viewportCenter = window.innerHeight / 2;

      /*
        Find visible page content around the center of the screen.

        We look for sections/cards/headings that are currently
        crossing the logo area.
      */

      const elements = Array.from(
        document.querySelectorAll(
          "section, article, [data-hirex-content]"
        )
      );

      let strongestOverlap = 0;

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();

        /*
          Ignore elements completely outside the viewport.
        */

        if (
          rect.bottom < 0 ||
          rect.top > window.innerHeight
        ) {
          return;
        }

        /*
          Central reading zone.

          This is deliberately wider than the actual logo so
          the effect starts slightly before content reaches it.
        */

        const zoneTop =
          viewportCenter - Math.min(260, window.innerHeight * 0.28);

        const zoneBottom =
          viewportCenter + Math.min(260, window.innerHeight * 0.28);

        const overlapTop = Math.max(rect.top, zoneTop);
        const overlapBottom = Math.min(rect.bottom, zoneBottom);

        if (overlapBottom <= overlapTop) return;

        const overlap =
          (overlapBottom - overlapTop) /
          (zoneBottom - zoneTop);

        strongestOverlap = Math.max(
          strongestOverlap,
          Math.min(1, overlap)
        );
      });

      /*
        Never completely remove the logo.

        This gives the "faded behind content" appearance rather
        than making it disappear.
      */

      targetLogoVisibility =
        1 - strongestOverlap * 0.72;
    }

    function handleScroll() {
      updateLogoVisibility();
    }

    /*
    ============================================================
    STARS
    ============================================================
    */

    const stars: Star[] = [];

    const starCount =
      window.innerWidth < 700
        ? 55
        : 95;

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x:
          Math.random() * 2 - 1,

        y:
          Math.random() * 2 - 1,

        z:
          Math.random(),

        speed:
          Math.random() * 0.00075 +
          0.00018,

        size:
          Math.random() * 1.3 +
          0.25,

        brightness:
          Math.random() * 0.5 +
          0.2,

        phase:
          Math.random() *
          Math.PI *
          2,
      });
    }

    /*
    ============================================================
    COSMIC DUST
    ============================================================
    */

    const dust: Dust[] = [];

    const dustCount =
      window.innerWidth < 700
        ? 35
        : 65;

    for (let i = 0; i < dustCount; i++) {
      dust.push({
        angle:
          Math.random() *
          Math.PI *
          2,

        radius:
          Math.random() *
            1.1 +
          0.12,

        depth:
          Math.random(),

        speed:
          Math.random() *
            0.00065 +
          0.00012,

        size:
          Math.random() *
            1.5 +
          0.3,

        phase:
          Math.random() *
          Math.PI *
          2,
      });
    }

    /*
    ============================================================
    RESIZE
    ============================================================
    */

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      updateLogoVisibility();
    }

    /*
    ============================================================
    BASE
    ============================================================
    */

    function drawBase() {
      ctx.fillStyle = "#010208";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );
    }

    /*
    ============================================================
    NEBULA
    ============================================================
    */

    function drawNebula(time: number) {
      const driftX =
        Math.sin(
          time * 0.00007
        ) *
        width *
        0.045;

      const driftY =
        Math.cos(
          time * 0.000055
        ) *
        height *
        0.035;

      /*
      ==========================================================
      DEEP PURPLE
      ==========================================================
      */

      const purple =
        ctx.createRadialGradient(
          width * 0.08 + driftX,
          height * 0.45 + driftY,
          0,
          width * 0.08 + driftX,
          height * 0.45 + driftY,
          width * 0.58
        );

      purple.addColorStop(
        0,
        "rgba(150,35,255,0.32)"
      );

      purple.addColorStop(
        0.22,
        "rgba(120,20,220,0.24)"
      );

      purple.addColorStop(
        0.5,
        "rgba(75,15,150,0.12)"
      );

      purple.addColorStop(
        1,
        "rgba(20,0,55,0)"
      );

      ctx.fillStyle = purple;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      /*
      ==========================================================
      MAGENTA / PINK
      ==========================================================
      */

      const magenta =
        ctx.createRadialGradient(
          width * 0.48 +
            driftX * 0.7,
          height * 0.08 +
            driftY,
          0,
          width * 0.48 +
            driftX * 0.7,
          height * 0.08 +
            driftY,
          width * 0.48
        );

      magenta.addColorStop(
        0,
        "rgba(255,30,170,0.25)"
      );

      magenta.addColorStop(
        0.2,
        "rgba(225,20,155,0.18)"
      );

      magenta.addColorStop(
        0.48,
        "rgba(160,15,120,0.09)"
      );

      magenta.addColorStop(
        1,
        "rgba(70,0,50,0)"
      );

      ctx.fillStyle = magenta;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      /*
      ==========================================================
      ELECTRIC BLUE
      ==========================================================
      */

      const blue =
        ctx.createRadialGradient(
          width * 0.94 -
            driftX,
          height * 0.46 -
            driftY,
          0,
          width * 0.94 -
            driftX,
          height * 0.46 -
            driftY,
          width * 0.58
        );

      blue.addColorStop(
        0,
        "rgba(0,145,255,0.31)"
      );

      blue.addColorStop(
        0.24,
        "rgba(0,90,240,0.22)"
      );

      blue.addColorStop(
        0.5,
        "rgba(10,45,170,0.11)"
      );

      blue.addColorStop(
        1,
        "rgba(0,10,55,0)"
      );

      ctx.fillStyle = blue;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      /*
      ==========================================================
      CYAN
      ==========================================================
      */

      const cyan =
        ctx.createRadialGradient(
          width * 0.18,
          height * 0.86,
          0,
          width * 0.18,
          height * 0.86,
          width * 0.38
        );

      cyan.addColorStop(
        0,
        "rgba(0,220,255,0.16)"
      );

      cyan.addColorStop(
        0.35,
        "rgba(0,140,230,0.09)"
      );

      cyan.addColorStop(
        1,
        "rgba(0,40,90,0)"
      );

      ctx.fillStyle = cyan;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      /*
      ==========================================================
      ORANGE ACCENT
      ==========================================================
      */

      const orange =
        ctx.createRadialGradient(
          width * 0.78,
          height * 0.82,
          0,
          width * 0.78,
          height * 0.82,
          width * 0.27
        );

      orange.addColorStop(
        0,
        "rgba(255,110,35,0.13)"
      );

      orange.addColorStop(
        0.4,
        "rgba(220,50,25,0.055)"
      );

      orange.addColorStop(
        1,
        "rgba(80,10,0,0)"
      );

      ctx.fillStyle = orange;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );
    }

    /*
    ============================================================
    DARK CENTER
    ============================================================
    */

    function drawCenterDarkness(
      time: number
    ) {
      const pulse =
        Math.sin(
          time * 0.0008
        ) *
          0.5 +
        0.5;

      const gradient =
        ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.min(
            width,
            height
          ) * 0.45
        );

      gradient.addColorStop(
        0,
        `rgba(0,2,10,${
          0.72 +
          pulse * 0.03
        })`
      );

      gradient.addColorStop(
        0.28,
        "rgba(1,3,14,0.58)"
      );

      gradient.addColorStop(
        0.58,
        "rgba(1,3,12,0.28)"
      );

      gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
      );

      ctx.fillStyle = gradient;

      ctx.fillRect(
        0,
        0,
        width,
        height
      );
    }

    /*
    ============================================================
    STARS
    ============================================================
    */

    function drawStars(time: number) {
      const centerX = width / 2;
      const centerY = height / 2;

      stars.forEach((star) => {
        star.z -= star.speed;

        if (star.z < 0.015) {
          star.z = 1;

          star.x =
            Math.random() * 2 - 1;

          star.y =
            Math.random() * 2 - 1;
        }

        const perspective =
          1 / star.z;

        const x =
          centerX +
          star.x *
            width *
            0.47 *
            perspective *
            0.34;

        const y =
          centerY +
          star.y *
            height *
            0.47 *
            perspective *
            0.34;

        if (
          x < -100 ||
          x > width + 100 ||
          y < -100 ||
          y > height + 100
        ) {
          return;
        }

        const twinkle =
          Math.sin(
            time * 0.002 +
              star.phase
          );

        const alpha =
          Math.max(
            0.04,
            star.brightness +
              twinkle * 0.08
          ) *
          (1 - star.z);

        const radius =
          Math.min(
            2.6,
            star.size *
              (1 +
                (1 - star.z) *
                  2.2)
          );

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(230,235,255,${alpha})`;

        ctx.fill();
      });
    }

    /*
    ============================================================
    COSMIC DUST
    ============================================================
    */

    function drawDust(time: number) {
      const centerX = width / 2;
      const centerY = height / 2;

      dust.forEach((particle) => {
        particle.depth -=
          particle.speed;

        if (particle.depth < 0.02) {
          particle.depth = 1;

          particle.angle =
            Math.random() *
            Math.PI *
            2;

          particle.radius =
            Math.random() *
              1.1 +
            0.12;
        }

        const angle =
          particle.angle +
          time *
            particle.speed *
            2.2;

        const perspective =
          1 / particle.depth;

        const radius =
          particle.radius *
          perspective;

        const x =
          centerX +
          Math.cos(angle) *
            width *
            0.34 *
            radius;

        const y =
          centerY +
          Math.sin(angle) *
            height *
            0.24 *
            radius;

        if (
          x < -100 ||
          x > width + 100 ||
          y < -100 ||
          y > height + 100
        ) {
          return;
        }

        const choice =
          Math.floor(
            particle.depth * 10
          );

        let rgb =
          "150,180,255";

        if (choice <= 1) {
          rgb = "210,60,255";
        } else if (choice <= 3) {
          rgb = "150,60,255";
        } else if (choice <= 5) {
          rgb = "65,130,255";
        } else if (choice <= 7) {
          rgb = "30,210,255";
        } else if (choice === 9) {
          rgb = "255,145,70";
        }

        const alpha =
          (1 - particle.depth) *
          0.42;

        const size =
          Math.min(
            2.8,
            particle.size *
              (1 +
                (1 -
                  particle.depth) *
                  2)
          );

        ctx.beginPath();

        ctx.arc(
          x,
          y,
          size,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(${rgb},${alpha})`;

        ctx.fill();
      });
    }

    /*
    ============================================================
    HIREX LOGO
    ============================================================
    */

    function drawLogo(time: number) {
      const centerX = width / 2;
      const centerY = height / 2;

      const x =
        centerX +
        Math.sin(
          time * 0.00055
        ) *
          2;

      const y =
        centerY +
        Math.cos(
          time * 0.0006
        ) *
          1.5;

      const mobile =
        width < 700;

      const fontSize =
        mobile
          ? Math.min(
              width * 0.20,
              105
            )
          : Math.min(
              width * 0.115,
              165
            );

      /*
      ==========================================================
      SMOOTH LOGO RESPONSE
      ==========================================================
      */

      logoVisibility +=
        (targetLogoVisibility -
          logoVisibility) *
        0.055;

      /*
        Convert visibility into visual effects.

        Full visibility:
          sharp + bright + glow

        Overlapping content:
          softer + lighter + less glow
      */

      const fadeAmount =
        1 - logoVisibility;

      const blurAmount =
        fadeAmount * 4.5;

      const glowAmount =
        (mobile ? 20 : 34) *
        logoVisibility;

      ctx.save();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font =
        `700 ${fontSize}px Arial, Helvetica, sans-serif`;

      /*
      ==========================================================
      METALLIC LOGO
      ==========================================================
      */

      const chrome =
        ctx.createLinearGradient(
          x,
          y - fontSize * 0.62,
          x,
          y + fontSize * 0.62
        );

      chrome.addColorStop(
        0,
        "#FFFFFF"
      );

      chrome.addColorStop(
        0.15,
        "#E4E9F0"
      );

      chrome.addColorStop(
        0.30,
        "#7C8798"
      );

      chrome.addColorStop(
        0.45,
        "#FFFFFF"
      );

      chrome.addColorStop(
        0.53,
        "#FFFFFF"
      );

      chrome.addColorStop(
        0.68,
        "#9CA8B8"
      );

      chrome.addColorStop(
        0.83,
        "#F2F5F9"
      );

      chrome.addColorStop(
        1,
        "#6B7585"
      );

      /*
      ==========================================================
      CONTENT OVERLAP BLUR
      ==========================================================
      */

      if (blurAmount > 0.05) {
        ctx.filter =
          `blur(${blurAmount}px)`;
      }

      /*
        Fade the logo without completely hiding it.
      */

      ctx.globalAlpha =
        0.28 +
        logoVisibility * 0.72;

      /*
      ==========================================================
      SOFT BLUE GLOW
      ==========================================================
      */

      ctx.shadowColor =
        "rgba(90,130,255,0.7)";

      ctx.shadowBlur =
        glowAmount;

      ctx.fillStyle =
        chrome;

      ctx.fillText(
        "HireX",
        x,
        y
      );

      /*
      ==========================================================
      SHARP LAYER
      ==========================================================
      */

      ctx.shadowBlur = 0;

      /*
        When content overlaps, this layer is intentionally
        reduced so the website text remains dominant.
      */

      ctx.globalAlpha =
        0.18 +
        logoVisibility * 0.52;

      ctx.fillStyle =
        chrome;

      ctx.fillText(
        "HireX",
        x,
        y
      );

      /*
      ==========================================================
      MOVING METALLIC REFLECTION
      ==========================================================
      */

      const reflection =
        ctx.createLinearGradient(
          x - fontSize * 2,
          y,
          x + fontSize * 2,
          y
        );

      reflection.addColorStop(
        0,
        "rgba(255,255,255,0)"
      );

      reflection.addColorStop(
        0.44,
        "rgba(255,255,255,0)"
      );

      reflection.addColorStop(
        0.50,
        "rgba(255,255,255,0.55)"
      );

      reflection.addColorStop(
        0.56,
        "rgba(150,190,255,0)"
      );

      reflection.addColorStop(
        1,
        "rgba(255,255,255,0)"
      );

      const reflectionX =
        Math.sin(
          time * 0.0004
        ) *
        fontSize *
        1.6;

      ctx.save();

      ctx.globalAlpha =
        0.28 *
        logoVisibility;

      ctx.translate(
        reflectionX,
        0
      );

      ctx.fillStyle =
        reflection;

      ctx.fillText(
        "HireX",
        x,
        y
      );

      ctx.restore();

      /*
      ==========================================================
      STAR GLINT
      ==========================================================
      */

      const pulse =
        Math.sin(
          time * 0.002
        ) *
          0.5 +
        0.5;

      const glintX =
        x +
        fontSize * 1.20;

      const glintY =
        y -
        fontSize * 0.46;

      const glow =
        ctx.createRadialGradient(
          glintX,
          glintY,
          0,
          glintX,
          glintY,
          fontSize * 0.20
        );

      glow.addColorStop(
        0,
        `rgba(255,255,255,${
          (0.9 +
            pulse * 0.1) *
          logoVisibility
        })`
      );

      glow.addColorStop(
        0.2,
        `rgba(180,210,255,${
          0.8 *
          logoVisibility
        })`
      );

      glow.addColorStop(
        0.5,
        `rgba(100,140,255,${
          0.16 *
          logoVisibility
        })`
      );

      glow.addColorStop(
        1,
        "rgba(80,100,255,0)"
      );

      /*
        Restore filter before drawing the glint so it stays
        crisp even when the logo is softened.
      */

      ctx.filter = "none";

      ctx.fillStyle = glow;

      ctx.beginPath();

      ctx.arc(
        glintX,
        glintY,
        fontSize * 0.20,
        0,
        Math.PI * 2
      );

      ctx.fill();

      /*
      ==========================================================
      FOUR POINT SPARKLE
      ==========================================================
      */

      ctx.save();

      ctx.translate(
        glintX,
        glintY
      );

      ctx.globalAlpha =
        (0.65 +
          pulse * 0.35) *
        logoVisibility;

      ctx.shadowColor =
        "#FFFFFF";

      ctx.shadowBlur = 16;

      ctx.strokeStyle =
        "#FFFFFF";

      ctx.lineWidth = 1;

      ctx.beginPath();

      ctx.moveTo(
        0,
        -fontSize * 0.13
      );

      ctx.lineTo(
        0,
        fontSize * 0.13
      );

      ctx.moveTo(
        -fontSize * 0.13,
        0
      );

      ctx.lineTo(
        fontSize * 0.13,
        0
      );

      ctx.stroke();

      ctx.restore();

      ctx.restore();
    }

    /*
    ============================================================
    ANIMATION LOOP
    ============================================================
    */

    function animate() {
      if (destroyed) return;

      const time =
        performance.now();

      mouse.x +=
        (mouse.targetX -
          mouse.x) *
        0.035;

      mouse.y +=
        (mouse.targetY -
          mouse.y) *
        0.035;

      /*
        Re-check occasionally while scrolling.

        This keeps the effect responsive without forcing
        expensive DOM calculations on every animation frame.
      */

      if (
        Math.floor(time / 120) !==
        Math.floor(
          (time - 16) / 120
        )
      ) {
        updateLogoVisibility();
      }

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      drawBase();

      drawNebula(time);

      drawCenterDarkness(
        time
      );

      drawStars(time);

      drawDust(time);

      drawLogo(time);

      animationFrame =
        requestAnimationFrame(
          animate
        );
    }

    /*
    ============================================================
    EVENTS
    ============================================================
    */

    function handleMouseMove(
      event: MouseEvent
    ) {
      mouse.targetX =
        event.clientX;

      mouse.targetY =
        event.clientY;
    }

    function handleMouseLeave() {
      mouse.targetX =
        width / 2;

      mouse.targetY =
        height / 2;
    }

    /*
    ============================================================
    START
    ============================================================
    */

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseleave",
      handleMouseLeave
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    animate();

    /*
    ============================================================
    CLEANUP
    ============================================================
    */

    return () => {
      destroyed = true;

      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseleave",
        handleMouseLeave
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-screen w-screen pointer-events-none"
    />
  );
}