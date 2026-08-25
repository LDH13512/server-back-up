(() => {
  const NOTICE_ID = "arcade-copyright-notice";
  if (document.getElementById(NOTICE_ID)) return;

  const ensureMeta = (name, content) => {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  ensureMeta("author", "게시판 운영자");
  ensureMeta("copyright", "© 2026 게시판");
  ensureMeta(
    "rights",
    "운영자가 AI 도구를 제작 보조로 활용해 기획·구현·편집한 자체 콘텐츠"
  );

  const host = document.createElement("aside");
  host.id = NOTICE_ID;
  host.setAttribute("aria-label", "미니게임 제작 및 권리 안내");
  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        left: max(10px, env(safe-area-inset-left));
        bottom: max(10px, env(safe-area-inset-bottom));
        z-index: 2147483647;
        font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", Arial, sans-serif;
      }
      button, a { font: inherit; }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border: 1px solid rgba(255, 255, 255, 0.34);
        border-radius: 999px;
        padding: 7px 10px;
        background: rgba(15, 23, 42, 0.82);
        color: #fff;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
        cursor: pointer;
        font-size: 11px;
        font-weight: 800;
        line-height: 1;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: opacity 160ms ease, transform 160ms ease;
        opacity: 0.78;
      }
      .badge:hover, .badge:focus-visible {
        opacity: 1;
        transform: translateY(-1px);
        outline: none;
      }
      .panel {
        position: absolute;
        left: 0;
        bottom: calc(100% + 8px);
        width: min(320px, calc(100vw - 20px));
        border: 1px solid rgba(148, 163, 184, 0.32);
        border-radius: 16px;
        padding: 14px;
        background: rgba(255, 255, 255, 0.98);
        color: #334155;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.65;
      }
      .panel[hidden] { display: none; }
      .title {
        margin: 0 0 6px;
        color: #0f172a;
        font-size: 13px;
        font-weight: 900;
      }
      .text { margin: 0; }
      .rights {
        margin: 8px 0 0;
        color: #64748b;
        font-size: 10px;
      }
      .more {
        display: inline-block;
        margin-top: 8px;
        color: #0f766e;
        font-size: 11px;
        font-weight: 800;
        text-decoration: none;
      }
      .more:hover, .more:focus-visible { text-decoration: underline; }
    </style>
    <div class="panel" id="copyright-panel" hidden>
      <p class="title">© 2026 게시판</p>
      <p class="text">
        이 미니게임은 운영자가 AI 도구를 제작 보조로 활용하여 직접
        기획·구현·편집한 자체 콘텐츠입니다. 무단 복제 및 재배포를 금합니다.
      </p>
      <p class="rights">
        게임 명칭과 일반적인 게임 규칙에 관한 권리는 각 권리자에게 있을 수
        있으며, 본 서비스는 해당 권리자와 제휴하거나 후원받지 않습니다.
      </p>
      <a class="more" href="/minigame/NOTICE.txt" target="_blank" rel="noopener">
        전체 제작·권리 안내 보기
      </a>
    </div>
    <button
      class="badge"
      type="button"
      aria-expanded="false"
      aria-controls="copyright-panel"
      title="미니게임 제작 및 권리 안내"
    >
      © 자체 제작
    </button>
  `;

  const button = shadow.querySelector(".badge");
  const panel = shadow.querySelector(".panel");
  const closePanel = () => {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  };

  button.addEventListener("click", () => {
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.composedPath().includes(host)) closePanel();
  });

  document.body.appendChild(host);
})();
