/* ==========================================================================
   Pre-Radhashtami Devotional Invitation — Reveal Experience
   Vanilla JS. No frameworks, no external libraries.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * 1. DEVOTEE REGISTRY — scalable personalization system
   *    Primary URL format uses the devotee's full name, slugified:
   *      "H.G. Amitasan Prabhu" -> ?id=h.g.amitasan_prabhu
   *    Add new devotees by appending their full name (exactly matching
   *    their photo filename) to DEVOTEE_NAMES below.
   * ------------------------------------------------------------------ */
  var DEVOTEE_NAMES = [
    "H.G. Amitasan Prabhu",
    "H.G. Anantha Shesha Prabhu",
    "H.G. Nikhileshwar Krishna Prabhu",
    "H.G. Kirti Narayan Prabhu",
    "H.G. Gaur Sundar Prabhu",
    "H.G. Swaroop Krishna Prabhu",
    "H.G. Anandi Govind Prabhu",
    "H.G. Vamshi Mohan Prabhu",
    "H.G. Shri Vallabh Prabhu",
    "H.G. Purna Chandra Prabhu",
    "H.G. Abhaya Hari Prabhu",
    "H.G. Phanindra Prabhu",
    "H.G. Mahayogeshwar Prabhu",
    "H.G. Achyutatma Prabhu",
    "H.G. Vrishabhanu Prabhu",
    "H.G. Raghupati Prabhu",
    "H.G. Kurupraveer Prabhu",
    "H.G. Jagatbandhu Prabhu",
    "H.G. Balabhadra Prabhu",
    "H.G. Hrishikesh Prabhu",
    "H.G. Harikesh Prabhu",
    "H.G. Radha Madhav Prabhu",
    "H.G. Bharat Vandit Prabhu",
    "H.G. Radha Priya Prabhu",
    "H.G. Siddha Swaroop Prabhu"
    // Scale further by appending more full names here.
  ];

  function slugifyDevoteeName(name) {
    return name
      .toLowerCase()
      .replace(/^h\.g\.\s+/, "h.g.")
      .replace(/\s+/g, "_");
  }

  var DEVOTEES = {};
  DEVOTEE_NAMES.forEach(function (name) {
    DEVOTEES[slugifyDevoteeName(name)] = {
      name: name,
      photo: "assets/devotees/" + name + ".png"
    };
  });

  // Backward-compatible short-key aliases for the original links.
  var LEGACY_ALIASES = {
    amitasan: "H.G. Amitasan Prabhu",
    anantha: "H.G. Anantha Shesha Prabhu",
    nikhileshwar: "H.G. Nikhileshwar Krishna Prabhu"
  };
  Object.keys(LEGACY_ALIASES).forEach(function (shortKey) {
    DEVOTEES[shortKey] = DEVOTEES[slugifyDevoteeName(LEGACY_ALIASES[shortKey])];
  });

  var DEFAULT_DEVOTEE_KEY = slugifyDevoteeName(DEVOTEE_NAMES[0]);

  function resolveDevotee() {
    var params = new URLSearchParams(window.location.search);
    var id = (params.get("id") || "").trim().toLowerCase();
    if (id && DEVOTEES[id]) return DEVOTEES[id];
    if (id) console.warn('[invite] Unknown devotee id "' + id + '". Using default.');
    return DEVOTEES[DEFAULT_DEVOTEE_KEY];
  }

  function getInitials(name) {
    var clean = name.replace(/^H\.G\.\s*/i, "");
    var words = clean.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  /* ------------------------------------------------------------------ *
   * 2. DOM REFERENCES
   * ------------------------------------------------------------------ */
  var app             = document.getElementById("app");
  var matkiHit         = document.getElementById("matkiHit");
  var matkiGlowLayer   = document.getElementById("matkiGlowLayer");
  var crackOverlay    = document.getElementById("crackOverlay");
  var brokenMatki      = document.getElementById("brokenMatki");
  var revealCard       = document.getElementById("revealCard");
  var makhanCard       = document.getElementById("makhanCard");
  var feather          = document.getElementById("feather");
  var featherImg       = document.getElementById("featherImg");
  var petalField       = document.getElementById("petalField");
  var sfxBurst         = document.getElementById("sfxBurst");
  var bgMusic          = document.getElementById("bgMusic");

  var photoWrap    = document.getElementById("photoItem");
  var photoImg     = document.getElementById("devoteePhoto");
  var nameItem     = document.getElementById("nameItem");
  var messageItem  = document.getElementById("messageItem");
  var finalItem    = document.getElementById("finalItem");
  var restDock     = document.getElementById("featherDock");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ *
   * 3. PERSONALIZE CONTENT
   * ------------------------------------------------------------------ */
  var devotee = resolveDevotee();

  nameItem.textContent = devotee.name;
  document.title = devotee.name + " — Pre-Radhashtami Celebration";

  photoImg.alt = devotee.name;
  photoImg.addEventListener("error", function () {
    photoWrap.classList.add("fallback");
    photoWrap.innerHTML = '<span class="initials">' + getInitials(devotee.name) + "</span>";
  });
  photoImg.src = devotee.photo;

  /* ------------------------------------------------------------------ *
   * 4. HELPERS
   * ------------------------------------------------------------------ */
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ------------------------------------------------------------------ *
   * AUDIO — background flute (starts on first interaction, fades in,
   * loops at 15–20% volume) and a one-shot matki burst sound effect.
   * ------------------------------------------------------------------ */
  var BG_MUSIC_TARGET_VOLUME = 0.18;
  var bgMusicStarted = false;

  function fadeInBgMusic(durationMs) {
    var steps = 30;
    var stepMs = durationMs / steps;
    var stepVol = BG_MUSIC_TARGET_VOLUME / steps;
    var count = 0;
    var timer = setInterval(function () {
      count++;
      bgMusic.volume = Math.min(BG_MUSIC_TARGET_VOLUME, stepVol * count);
      if (count >= steps) clearInterval(timer);
    }, stepMs);
  }

  function startBgMusicOnce() {
    if (bgMusicStarted) return;
    bgMusicStarted = true;
    bgMusic.volume = 0;
    var playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(function () {
        fadeInBgMusic(2000);
      }).catch(function () {
        bgMusicStarted = false;
      });
    } else {
      fadeInBgMusic(2000);
    }
  }

  ["pointerdown", "click", "touchstart", "keydown"].forEach(function (evt) {
    document.addEventListener(evt, startBgMusicOnce, { once: true, passive: true });
  });

  function playBurstSfx() {
    try {
      sfxBurst.currentTime = 0;
      var p = sfxBurst.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) { /* ignore playback errors */ }
  }

  /**
   * Spawns a burst of small particles from a fixed-viewport point (x, y).
   * type: 'clay' | 'makhan' | 'petal' | 'spark'
   */
  function burstParticles(x, y, type, count, opts) {
    opts = opts || {};
    var spread = opts.spread || 90;
    var biasX = opts.biasX || 0;
    var biasY = opts.biasY || 0;
    var duration = opts.duration || 900;

    for (var i = 0; i < count; i++) {
      var p = document.createElement("div");
      p.className = "fx-particle " + type;
      var angle = Math.random() * Math.PI * 2;
      var dist = spread * (0.4 + Math.random() * 0.9);
      var dx = Math.cos(angle) * dist + biasX;
      var dy = Math.sin(angle) * dist + biasY;
      p.style.setProperty("--dx", dx + "px");
      p.style.setProperty("--dy", dy + "px");
      p.style.setProperty("--rot", rand(-140, 140) + "deg");
      p.style.setProperty("--sc", (type === "petal" ? 0.7 : 0.25).toString());
      p.style.setProperty("--dur", (duration + rand(-120, 220)) + "ms");
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.animationDelay = rand(0, 0.12) + "s";
      document.body.appendChild(p);
      p.addEventListener("animationend", function () { this.remove(); });
    }
  }

  function spawnAmbientPetals(count) {
    for (var i = 0; i < count; i++) {
      var p = document.createElement("span");
      p.className = "amb-petal";
      p.style.left = rand(4, 96) + "vw";
      p.style.animationDuration = rand(9, 16) + "s";
      p.style.animationDelay = "-" + rand(0, 14) + "s";
      p.style.transform = "scale(" + rand(0.7, 1.3).toFixed(2) + ")";
      petalField.appendChild(p);
    }
  }

  /* ------------------------------------------------------------------ *
   * 5. MATKI TAP -> SHAKE -> CRACK -> SPREAD -> CINEMATIC BURST
   * ------------------------------------------------------------------ */
  var unlocked = false;

  matkiHit.addEventListener("click", onMatkiTap);
  matkiHit.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onMatkiTap();
    }
  });

  function onMatkiTap() {
    if (unlocked) return;
    unlocked = true;
    matkiHit.classList.add("disabled");
    runBreakSequence();
  }

  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, rect: r };
  }

  function runBreakSequence() {
    if (reducedMotion) {
      app.classList.add("revealing");
      matkiHit.classList.add("hidden");
      matkiGlowLayer.classList.add("show");
      playBurstSfx();
      return wait(200).then(showBrokenMatki).then(beginMakhanReveal);
    }

    return Promise.resolve()
      // Stage 1 — tiny vibration (0.5s)
      .then(function () {
        matkiHit.classList.add("shake-1");
        return wait(500);
      })
      // Stage 2 — intensifying shake (1s)
      .then(function () {
        matkiHit.classList.remove("shake-1");
        matkiHit.classList.add("shake-2");
        return wait(1000);
      })
      // Stage 3 — crack appears (1s)
      .then(function () {
        matkiHit.classList.remove("shake-2");
        matkiHit.classList.add("shake-3");
        crackOverlay.classList.add("show-crack");
        return wait(1000);
      })
      // Stage 4 — crack spreads (0.5s)
      .then(function () {
        crackOverlay.classList.add("spread");
        return wait(500);
      })
      // Stage 5 — dramatic burst
      .then(function () {
        var c = centerOf(matkiHit);
        app.classList.add("revealing");
        matkiGlowLayer.classList.add("show", "flash");
        matkiHit.classList.add("burst");
        playBurstSfx();

        // clay fragments fly outward
        burstParticles(c.x, c.y, "clay", 18, { spread: 105, duration: 900 });
        // makhan erupts upward
        burstParticles(c.x, c.y - c.rect.height * 0.15, "makhan", 16, {
          spread: 85, biasY: -95, duration: 1000
        });
        // flower petals float outward, slower
        burstParticles(c.x, c.y, "petal", 10, { spread: 125, duration: 1500 });
        // fine sparkling particles
        burstParticles(c.x, c.y, "spark", 22, { spread: 150, duration: 800 });

        return wait(650);
      })
      .then(function () {
        matkiHit.classList.add("hidden");
        return wait(300);
      })
      .then(showBrokenMatki)
      .then(function () { return wait(300); })
      .then(beginMakhanReveal);
  }

  function showBrokenMatki() {
    brokenMatki.classList.add("show");
    return wait(10);
  }

  /* ------------------------------------------------------------------ *
   * 6. MAKHAN SPLASH REVEAL (organic invitation frame)
   * ------------------------------------------------------------------ */
  function beginMakhanReveal() {
    revealCard.classList.add("active");
    spawnAmbientPetals(9);
    return wait(150)
      .then(function () {
        makhanCard.classList.add("grow");
        return wait(reducedMotion ? 200 : 850);
      })
      .then(runFeatherSequence);
  }

  /* ------------------------------------------------------------------ *
   * 7. PEACOCK FEATHER — REVEAL WAND
   *    The feather TIP travels to each element; a golden spark marks
   *    its arrival, then the element fades in.
   * ------------------------------------------------------------------ */
  var revealSteps = [photoWrap, nameItem, messageItem, finalItem];

  // Feather art: tip sits at ~50.8% / 99.4% of the image's own box.
  var TIP_X_PCT = 0.5086;
  var TIP_Y_PCT = 0.9989;

  function runFeatherSequence() {
    if (reducedMotion) {
      return revealSteps.reduce(function (chain, el) {
        return chain.then(function () {
          var r = el.getBoundingClientRect();
          triggerSpark(r.left + r.width / 2, r.top + r.height / 2);
          return wait(190);
        }).then(function () {
          el.classList.add("revealed");
          return wait(280);
        });
      }, Promise.resolve()).then(dockFeatherInstant);
    }

    feather.classList.add("visible");
    var current = startPoint();
    setTipAt(current.x, current.y, -16);

    var chain = Promise.resolve();
    revealSteps.forEach(function (el) {
      chain = chain
        .then(function () {
          var target = pointNear(el);
          return flyTipTo(current, target);
        })
        .then(function (endPoint) {
          current = endPoint;
          return wait(90); // brief landing beat before the spark fires
        })
        .then(function () {
          triggerSpark(current.x, current.y);
          return wait(190); // content reveals immediately after the spark
        })
        .then(function () {
          el.classList.add("revealed");
          return wait(340);
        });
    });

    chain = chain.then(function () {
      var dock = dockPoint();
      return flyTipTo(current, dock, 800);
    }).then(function () {
      feather.classList.add("resting");
    });

    return chain;
  }

  function startPoint() {
    var rect = revealCard.getBoundingClientRect();
    return { x: -80, y: rect.top + Math.min(80, rect.height * 0.2) };
  }

  function pointNear(el) {
    var r = el.getBoundingClientRect();
    return {
      x: Math.max(10, r.left + Math.min(16, r.width * 0.14)),
      y: r.top + r.height / 2
    };
  }

  function dockPoint() {
    var r = restDock.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function dockFeatherInstant() {
    feather.classList.add("visible", "resting");
    var d = dockPoint();
    setTipAt(d.x, d.y, 0);
  }

  // Golden-spark reveal system — the real golden-spark.png asset,
  // placed exactly at the feather's tip. Always fires BEFORE the
  // content it marks is revealed (see runFeatherSequence).
  function triggerSpark(x, y) {
    var spark = document.createElement("img");
    spark.src = "assets/reveal/golden-spark.png";
    spark.alt = "";
    spark.className = "reveal-spark-img";
    spark.style.left = x + "px";
    spark.style.top = y + "px";
    document.body.appendChild(spark);
    spark.addEventListener("animationend", function () { this.remove(); });
  }

  function setTipAt(x, y, rotDeg) {
    var w = feather.getBoundingClientRect().width || 70;
    var h = feather.getBoundingClientRect().height || (w * (900 / 526));
    var tipLocalX = w * TIP_X_PCT;
    var tipLocalY = h * TIP_Y_PCT;
    feather.style.transform =
      "translate(" + (x - tipLocalX) + "px, " + (y - tipLocalY) + "px) rotate(" + rotDeg + "deg)";
  }

  function flyTipTo(from, to, durationOverride) {
    return new Promise(function (resolve) {
      var duration = durationOverride || (950 + Math.random() * 380);
      var start = null;

      // Two independent control points (cubic bezier) instead of one,
      // each with its own perpendicular bend and along-path stagger,
      // so the path reads as a hand-drawn curve rather than a single
      // symmetric arc.
      var dx = to.x - from.x, dy = to.y - from.y;
      var len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;

      var side = Math.random() > 0.5 ? 1 : -1;
      var bend1 = side * (26 + Math.random() * 46);
      var bend2 = side * (14 + Math.random() * 40) * (Math.random() > 0.6 ? -1 : 1);
      var t1 = 0.28 + Math.random() * 0.12;
      var t2 = 0.62 + Math.random() * 0.14;

      var p1x = from.x + dx * t1 + nx * bend1;
      var p1y = from.y + dy * t1 + ny * bend1 - 10;
      var p2x = from.x + dx * t2 + nx * bend2;
      var p2y = from.y + dy * t2 + ny * bend2 - 6;

      function cubic(a, b, c, d, t) {
        var mt = 1 - t;
        return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
      }
      function cubicTangent(a, b, c, d, t) {
        var mt = 1 - t;
        return 3 * mt * mt * (b - a) + 6 * mt * t * (c - b) + 3 * t * t * (d - c);
      }

      function frame(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / duration);
        var e = easeInOutCubic(t);

        var x = cubic(from.x, p1x, p2x, to.x, e);
        var y = cubic(from.y, p1y, p2y, to.y, e);

        var tx = cubicTangent(from.x, p1x, p2x, to.x, e);
        var ty = cubicTangent(from.y, p1y, p2y, to.y, e);
        var angle = Math.atan2(ty, tx) * (180 / Math.PI);
        var bob = Math.sin(t * Math.PI * 5) * 2.6;

        setTipAt(x, y + bob, (angle - 90) * 0.24);

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          setTipAt(to.x, to.y, 0);
          resolve({ x: to.x, y: to.y });
        }
      }
      requestAnimationFrame(frame);
    });
  }
})();
