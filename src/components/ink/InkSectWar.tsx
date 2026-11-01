import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SECT_CONTENT } from "@data/content/packs";
import { sectWarOffice, SECT_WAR_TEST } from "@data/redesign/sectWarTestParams";
import type {
  SectWarSnapshot,
  SectWarReport,
  SectSelectionResult,
} from "@interfaces/sectWar";
import type { SectReplayTape } from "@interfaces/sectTape";
import type {
  SectBattleFigure,
  SectBattleReplay,
} from "@interfaces/sectBattle";
import { useLifeStore } from "../../store/lifeStore";
import { sectWarRequest } from "../../cloud/sectWar";
import { loadWarAssets, type WarAssets } from "../../sectBattle/assets";
import { primeWarCharacters } from "../../sectBattle/character";
import { buildWarReplay } from "../../sectBattle/replay";
import { useWarPlayback } from "../../sectBattle/usePlayback";
import { sectBattleFixture } from "../../prototypes/sectBattle/fixtures";
import { readAppearance } from "@interfaces/appearance";
import { sectAssetUrl } from "../../prototypes/sectBattle/assets";
import mapping from "../../sectBattle/assets.json";
import "../../sectBattle/war.css";
import { watchVisualActivity } from "../../ui/visualActivity";
const Duel = lazy(() =>
  import("./InkAutoBattle").then((m) => ({ default: m.InkAutoBattle })),
);
const nameOf = (id: string) =>
  SECT_CONTENT.find((s) => s.id === id)?.name ?? "尚未選派";
const dummyFormation: SectBattleFigure[] = [];
type Sheet = "roster" | "rivals" | "history" | "rules" | null;

/** 真人門派會武入口及獨立試演；所有正式戰果由伺服器快照取得，不以示範人物補位。 */
export default function InkSectWar({
  onBack,
  onPrepare,
  initialTrial = false,
}: {
  onBack: () => void;
  onPrepare?: () => void;
  initialTrial?: boolean;
}) {
  const [assets, setAssets] = useState<WarAssets | null>(null),
    [assetError, setAssetError] = useState(""),
    [retry, setRetry] = useState(0),
    [snapshot, setSnapshot] = useState<SectWarSnapshot | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [building, setBuilding] = useState(false),
    [replay, setReplay] = useState<SectBattleReplay | null>(null),
    [report, setReport] = useState<SectWarReport | null>(null),
    [trial, setTrial] = useState(initialTrial);
  const [reduced, setReduced] = useState(readReducedMotion),
    [sheet, setSheet] = useState<Sheet>(null),
    [side, setSide] = useState(0),
    [rival, setRival] = useState("sect_wudang"),
    [duel, setDuel] = useState<SectSelectionResult | null>(null);
  const gate = useRef(false),
    mounted = useRef(true),
    job = useRef<{ cancel: () => void } | null>(null),
    trialRef = useRef(trial),
    autoplay = useRef(false);
  trialRef.current = trial;
  const own = useLifeStore((s) => s.state?.character),
    mySect = snapshot?.me?.sectId ?? own?.sectId ?? "";
  const sides: [string, string] = report
    ? report.sides
    : trial
      ? ["sect_qingyun", "sect_wudang"]
      : [
          mySect,
          rival === mySect
            ? SECT_CONTENT.find((s) => s.id !== mySect)!.id
            : rival,
        ];
  const refresh = async () => {
    const value = await sectWarRequest<SectWarSnapshot>("overview");
    if (mounted.current) setSnapshot(value);
  };
  const run = async (fn: () => Promise<void>) => {
    if (gate.current) return;
    gate.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      if (
        mounted.current &&
        !(e instanceof DOMException && e.name === "AbortError")
      )
        setError(e instanceof Error ? e.message : "會武暫時未能連線。");
    } finally {
      gate.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    const root = document.getElementById("root"),
      prior = root?.inert ?? false;
    if (root) root.inert = true;
    return () => {
      mounted.current = false;
      job.current?.cancel();
      if (root) root.inert = prior;
    };
  }, []);
  useEffect(() => {
    let gone = false;
    setAssetError("");
    void loadWarAssets()
      .then((value) => {
        if (!gone) setAssets(value);
      })
      .catch((e) => {
        if (!gone) setAssetError(e.message);
      });
    return () => {
      gone = true;
    };
  }, [retry]);
  useEffect(() => {
    if (initialTrial) return;
    void refresh().catch((e) => {
      if (mounted.current && !trialRef.current) setError(e.message);
    });
  }, []);
  useEffect(() => {
    if (trial || replay) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const unwatch = watchVisualActivity(
      (active) => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        if (active)
          timer = setInterval(() => {
            void refresh().catch(() => {});
          }, 15000);
      },
      { dialogs: true },
    );
    return () => {
      unwatch();
      if (timer) clearInterval(timer);
    };
  }, [trial, replay]);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setReduced(readReducedMotion()),
      observer = new MutationObserver(change);
    q.addEventListener("change", change);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-ink-motion"],
    });
    return () => {
      q.removeEventListener("change", change);
      observer.disconnect();
    };
  }, []);
  const loadReplay = async (
    roster: Parameters<typeof buildWarReplay>[0],
    seed: number,
    fingerprint?: string,
    timeline?: SectReplayTape,
  ) => {
    job.current?.cancel();
    setBuilding(true);
    const next = buildWarReplay(roster, seed, fingerprint, timeline);
    job.current = next;
    try {
      const value = await next.promise;
      if (!mounted.current || job.current !== next) return;
      const pack = assets ?? (await loadWarAssets());
      await primeWarCharacters(
        pack,
        value.frames[0].figures.map((u) => u.appearance),
        () => !mounted.current || job.current !== next,
      );
      if (mounted.current && job.current === next) setReplay(value);
    } finally {
      if (mounted.current && job.current === next) setBuilding(false);
    }
  };
  const openTrial = () =>
    void run(async () => {
      setSheet(null);
      setReport(null);
      setReplay(null);
      setTrial(true);
      const roster = sectBattleFixture();
      roster.forEach((u, i) => {
        const a = readAppearance(u.state.character.appearance);
        u.state.character.appearance = {
          ...a,
          tone: i < 10 ? (i % 3 ? "jade" : "ink") : i % 3 ? "cinnabar" : "sand",
        };
      });
      roster[0].state.character.appearance = {
        head: "topknot",
        outfit: "scholar",
        tone: "jade",
      };
      await loadReplay(roster, 5707);
    });
  const openReport = async (id: string) => {
    const next = await sectWarRequest<SectWarReport>("report", { id });
    if (next.engineVersion !== SECT_WAR_TEST.engineVersion || !next.timeline)
      throw new Error("戰報版本不一致，請更新遊戲後重試。");
    autoplay.current = true;
    setSheet(null);
    setTrial(false);
    setReport(next);
    setReplay(null);
    await loadReplay(next.roster, next.seed, next.fingerprint, next.timeline);
  };
  useEffect(() => {
    if (!initialTrial) return;
    const timer = setTimeout(openTrial, 0);
    return () => clearTimeout(timer);
  }, []);
  const formation = useMemo(() => {
    if (replay) return dummyFormation;
    if (!snapshot || trial) return dummyFormation;
    const list: SectBattleFigure[] = [];
    for (let s = 0; s < 2; s++) {
      const id = sides[s],
        ids =
          snapshot.teams[id]?.members ??
          (snapshot.ranks[id] ?? []).slice(0, 10);
      ids.forEach((user, i) => {
        const m = snapshot.members.find((v) => v.id === user);
        if (m)
          list.push({
            id: m.id,
            side: s as 0 | 1,
            rank: i + 1,
            name: m.name,
            appearance: m.appearance,
            artId: "qy_cloud_sword",
            x: s === 0 ? 56 + (9 - i) * 38 : 944 - (9 - i) * 38,
            y: 310,
            face: s === 0 ? 1 : -1,
            hp: 1,
            maxHp: 1,
            qi: 0,
            maxQi: 1,
            pose: "idle",
            poseAt: 0,
            target: null,
          });
      });
    }
    return list;
  }, [snapshot, replay, trial, sides[0], sides[1]]);
  const { canvas, controls, view } = useWarPlayback(
    assets,
    replay,
    formation,
    reduced,
  );
  useEffect(() => {
    if (replay && autoplay.current && controls.current) {
      autoplay.current = false;
      controls.current.toggle();
    }
  }, [replay, assets]);
  const frame =
      replay?.frames[
        Math.min(replay.frames.length - 1, Math.floor(view.seconds / 0.05))
      ],
    figures = frame?.figures ?? formation,
    selected = figures.find((u) => u.id === view.selected) ?? figures[0];
  const latest = replay?.events
      .filter((e) => e.at <= view.seconds && e.actor === selected?.id)
      .at(-1),
    counts = [0, 1].map(
      (s) => figures.filter((u) => u.side === s && u.hp > 0).length,
    );
  const myRank = snapshot?.me
    ? (snapshot.ranks[snapshot.me.sectId] ?? []).indexOf(snapshot.me.id) + 1
    : 0;
  const currentSeat = snapshot?.me
    ? (snapshot.teams[snapshot.me.sectId]?.members.indexOf(snapshot.me.id) ??
        -1) + 1
    : 0;
  const existingMatch = snapshot?.matches.find(
    (m) =>
      m.term === snapshot.term &&
      m.sides.includes(sides[0]) &&
      m.sides.includes(sides[1]),
  );
  const start = () => {
    if (replay) {
      controls.current?.toggle();
      return;
    }
    void run(async () => {
      if (existingMatch) {
        await openReport(existingMatch.id);
        return;
      }
      const r = await sectWarRequest<{ reportId: string }>("challenge", {
        target: sides[1],
      });
      await openReport(r.reportId);
      await refresh();
    });
  };
  const ready =
    !!existingMatch ||
    (!!snapshot?.me &&
      currentSeat > 0 &&
      !!snapshot.teams[sides[0]] &&
      !!snapshot.teams[sides[1]]);
  const image = (key: keyof typeof mapping.images) =>
    assets?.images[key]?.src ?? sectAssetUrl(mapping.images[key]);
  const closeToLobby = () => {
    job.current?.cancel();
    setTrial(false);
    setReplay(null);
    setReport(null);
    setBuilding(false);
    setSheet(null);
    void run(refresh);
  };
  const title =
    replay && view.status === "result"
      ? replay.winner === null
        ? "本場未分勝負"
        : `${nameOf(sides[replay.winner])}勝出`
      : trial
        ? "試演 · 不計戰績"
        : report
          ? "正式會武"
          : "門派代表集結";
  const content = (
    <main
      className="ink-sect-war"
      data-status={view.status}
      data-seconds={view.seconds.toFixed(2)}
      data-mode={trial ? "trial" : "live"}
      aria-label="門派會武"
    >
      <div className="war-paper" aria-hidden="true">
        <img src={image("backdrop")} alt="" />
      </div>
      <header className="war-header">
        <button type="button" className="war-back" onClick={onBack}>
          <img src={image("back")} alt="" />
          返回
        </button>
        <h1>門派會武</h1>
        <button
          className="war-mode"
          type="button"
          disabled={busy || building}
          onClick={trial ? closeToLobby : openTrial}
        >
          {trial ? "正式會武" : "觀摩試演"}
        </button>
        <p className="war-seal" role="status">
          {title}
        </p>
        <div className="war-teams" aria-label="雙方門派與在場人數">
          {sides.map((id, s) => (
            <button
              type="button"
              key={s}
              data-side={s}
              onClick={() => {
                setSide(s);
                setSheet(s === 1 && !report && !trial ? "rivals" : "roster");
              }}
              aria-label={
                s === 1 && !report && !trial
                  ? "選擇對陣門派"
                  : `${nameOf(id)}代表名冊`
              }
            >
              <img src={image(s === 0 ? "flag0" : "flag1")} alt="" />
              <h2>{nameOf(id)}</h2>
              <span>
                <b>{counts[s]}</b>／10 人在場
              </span>
            </button>
          ))}
          <div className="war-clock">
            <b>
              {String(Math.floor(view.seconds / 60)).padStart(2, "0")}:
              {String(Math.floor(view.seconds % 60)).padStart(2, "0")}
            </b>
          </div>
        </div>
      </header>
      <section className="war-stage" aria-label="同場交鋒">
        <canvas
          ref={canvas}
          aria-label="二十人單線會武；可點人物或從代表名冊選取。"
        />
        {(!assets || building) && (
          <div className="war-loading" role="status">
            <p>{assetError || (building ? "正在展開戰報……" : "正在備戰……")}</p>
            {assetError && (
              <button type="button" onClick={() => setRetry((n) => n + 1)}>
                重試素材
              </button>
            )}
          </div>
        )}
        {assets && !building && !replay && (
          <div className="war-lobby-note">
            <h3>{counts[0] || counts[1] ? "門人陸續赴會" : "靜候各派赴會"}</h3>
            <p>兩派各十名真人代表，離線亦可出戰。</p>
            {!snapshot?.me ? (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await sectWarRequest("join");
                    await refresh();
                    setNotice("已報名門內比武。");
                  })
                }
              >
                報名門內比武
              </button>
            ) : (
              <p>
                門內比武第 {myRank} 名 ·{" "}
                {currentSeat > 0
                  ? `本屆${sectWarOffice(currentSeat)}`
                  : "參選者"}
              </p>
            )}
            <small>未齊人不代填角色；可先觀摩試演。</small>
          </div>
        )}
        {view.status === "result" && replay && (
          <div className="war-result">
            <h3>{title}</h3>
            <p>
              在場 {replay.remaining[0]}：{replay.remaining[1]}
            </p>
            <small>
              {trial
                ? "示範人物，不更新戰績。"
                : "戰果已保存，重播不會再結算。"}
            </small>
          </div>
        )}
        {(error || notice) && (
          <div
            className={"war-feedback" + (error ? " is-error" : "")}
            role={error ? "alert" : "status"}
          >
            {error || notice}
            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
              }}
              aria-label="收起會武提示"
            >
              收起
            </button>
          </div>
        )}
      </section>
      <footer className="war-footer">
        <button
          type="button"
          className="war-focus"
          onClick={() => {
            setSide(selected?.side ?? 0);
            setSheet("roster");
          }}
          aria-label="查看選中代表詳情"
        >
          <span className="war-portrait">
            <WarPortrait
              assets={assets}
              appearance={selected?.appearance ?? own?.appearance}
            />
            <img src={image("portraitRing")} alt="" />
          </span>
          <span
            className="war-focus-copy"
            data-long-name={
              Array.from(selected?.name ?? own?.name ?? "江湖旅人").length > 6
            }
          >
            <strong>{selected?.name ?? own?.name ?? "江湖旅人"}</strong>
            <span>
              {selected
                ? (latest?.name ??
                  (view.status === "result" ? "會武已畢" : "候戰"))
                : "點名冊查看門內選拔"}
            </span>
          </span>
        </button>
        <div className="war-actions">
          <button
            type="button"
            disabled={!assets || busy || building || (!replay && !ready)}
            onClick={start}
          >
            <img
              src={image(view.status === "playing" ? "pause" : "play")}
              alt=""
            />
            {view.status === "playing"
              ? "暫停"
              : view.status === "paused"
                ? "繼續"
                : view.status === "result"
                  ? "重播"
                  : existingMatch && !replay
                    ? "觀戰"
                    : "開始"}
          </button>
          <button
            type="button"
            disabled={!replay || building || view.status === "result"}
            onClick={() => controls.current?.skip()}
          >
            <img src={image("skip")} alt="" />
            跳過
          </button>
          <button type="button" onClick={() => setSheet("roster")}>
            <img src={image("roster")} alt="" />
            名冊
          </button>
        </div>
      </footer>
      {sheet && (
        <WarSheet
          title={
            sheet === "rivals"
              ? "對陣門派"
              : sheet === "history"
                ? "會武戰報"
                : sheet === "rules"
                  ? "會武規則"
                  : "代表名冊"
          }
          onClose={() => setSheet(null)}
        >
          {sheet === "roster" && (
            <>
              <div
                className="war-sheet-tabs"
                role="tablist"
                aria-label="門派名冊"
              >
                {sides.map((id, s) => (
                  <button
                    type="button"
                    role="tab"
                    key={s}
                    aria-selected={side === s}
                    onClick={() => setSide(s)}
                  >
                    {nameOf(id)}
                  </button>
                ))}
              </div>
              {replay ? (
                <div className="war-roster-grid">
                  {figures
                    .filter((u) => u.side === side)
                    .map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        aria-pressed={selected?.id === u.id}
                        onClick={() => {
                          controls.current?.select(u.id);
                          setSheet(null);
                        }}
                      >
                        <WarPortrait
                          assets={assets}
                          appearance={u.appearance}
                        />
                        <span>
                          <b>
                            {sectWarOffice(u.rank)} · {u.name}
                          </b>
                          <small>
                            {u.hp > 0
                              ? `氣血 ${Math.round(u.hp)}／${u.maxHp}`
                              : "已退場"}
                          </small>
                          <small>
                            內力 {Math.round(u.qi)}／{u.maxQi}
                          </small>
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <>
                  <p>本屆代表鎖定至下次換屆；門內比武名次決定下屆席位。</p>
                  <div className="war-member-list">
                    {(snapshot?.ranks[sides[side]] ?? []).map((id, i) => {
                      const m = snapshot?.members.find((u) => u.id === id);
                      return (
                        m && (
                          <div key={id}>
                            <span>
                              <b>
                                {i + 1} · {m.name}
                              </b>
                              <small>
                                {snapshot?.teams[sides[side]]?.members.includes(
                                  id,
                                )
                                  ? "本屆代表"
                                  : "參選者"}
                              </small>
                            </span>
                            {side === 0 && id !== snapshot?.me?.id && (
                              <button
                                type="button"
                                disabled={busy || !snapshot?.me}
                                onClick={() =>
                                  void run(async () => {
                                    const r =
                                      await sectWarRequest<SectSelectionResult>(
                                        "selection",
                                        { target: id },
                                      );
                                    setSheet(null);
                                    setDuel(r);
                                    await refresh();
                                    setNotice(
                                      `門內比武：第${r.before}名 → 第${r.after}名。`,
                                    );
                                  })
                                }
                              >
                                比武
                              </button>
                            )}
                          </div>
                        )
                      );
                    })}
                    {!(snapshot?.ranks[sides[side]] ?? []).length && (
                      <p>尚無門人報名。</p>
                    )}
                  </div>
                  {snapshot?.me && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await sectWarRequest("join");
                          await refresh();
                          setNotice("已更新門派及造型資料。");
                        })
                      }
                    >
                      更新報名資料
                    </button>
                  )}
                </>
              )}
              <div className="war-sheet-options">
                <button type="button" onClick={() => setSheet("history")}>
                  會武戰報
                </button>
                <button type="button" onClick={() => setSheet("rules")}>
                  規則與設定
                </button>
                {onPrepare && (
                  <button type="button" onClick={onPrepare}>
                    前往對戰配搭
                  </button>
                )}
              </div>
            </>
          )}
          {sheet === "rivals" && (
            <div className="war-rivals">
              {SECT_CONTENT.filter((s) => s.id !== mySect).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setRival(s.id);
                    setSheet(null);
                  }}
                >
                  <strong>{s.name}</strong>
                  <span>
                    {snapshot?.teams[s.id]?.members.length ??
                      Math.min(10, snapshot?.ranks[s.id]?.length ?? 0)}
                    ／10 席
                  </span>
                </button>
              ))}
            </div>
          )}
          {sheet === "history" && (
            <div className="war-history">
              {snapshot?.matches.length ? (
                snapshot.matches.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    disabled={busy}
                    onClick={() => void run(() => openReport(m.id))}
                  >
                    <b>
                      {nameOf(m.sides[0])} · {nameOf(m.sides[1])}
                    </b>
                    <span>
                      {m.winner === null
                        ? "未分勝負"
                        : `${nameOf(m.sides[m.winner])}勝出`}{" "}
                      · 重播
                    </span>
                  </button>
                ))
              ) : (
                <p>尚無正式會武戰報。試演不計入紀錄。</p>
              )}
            </div>
          )}
          {sheet === "rules" && (
            <div className="war-rules">
              <p>
                依目前人物所屬門派報名。門內比武獲勝且對方名次較高時，交換名次；比武後須候一分鐘。
              </p>
              <p>
                每週一香港時間04:00依比武前十名選代表，鎖定一週。首屆滿十人先成隊；之後名次變化於下屆生效。
              </p>
              <p>
                掌門一席、長老兩席、執事三席、代表四席。這些會武職位不改單機地位或武學解鎖。
              </p>
              <p>
                兩派均有十名真人代表才可開戰。本屆代表可發起，同週同一對門派只保存一場。離派或無法出戰者不由其他角色代填。
              </p>
              <p>
                沿用已保存的對戰配搭、整門連招與耗內。切磋不造成受傷或死亡；本版會武沒有資源派獎。以上為封測規則。
              </p>
              <button
                type="button"
                disabled={!replay}
                onClick={() => controls.current?.speed()}
              >
                播放速度 ×{view.speed}
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) =>
                    setReduced(e.target.checked || readReducedMotion())
                  }
                />
                減少動態
              </label>
              {assets?.simplified && <p>部分素材使用同圖簡化後備。</p>}
              <button type="button" onClick={trial ? closeToLobby : openTrial}>
                {trial ? "返回正式會武" : "觀摩獨立試演"}
              </button>
            </div>
          )}
        </WarSheet>
      )}
      {duel && (
        <Suspense
          fallback={<div className="war-loading">正在展開門內比武……</div>}
        >
          <Duel
            replay={duel.replay}
            character={duel.character}
            rewardCoins={0}
            unified
            reduceMotion={reduced}
            onDone={() => setDuel(null)}
          />
        </Suspense>
      )}
    </main>
  );
  return createPortal(content, document.body);
}
function WarSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null,
      d = ref.current!;
    d.showModal();
    return () => {
      d.close();
      prior?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="war-sheet ink-person-sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button type="button" onClick={onClose} aria-label={"關閉" + title}>
          收起
        </button>
      </header>
      <div className="war-sheet-content">{children}</div>
    </dialog>
  );
}
function WarPortrait({
  assets,
  appearance,
}: {
  assets: WarAssets | null;
  appearance: unknown;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    a = readAppearance(appearance);
  useEffect(() => {
    if (!assets || !ref.current) return;
    const canvas = ref.current,
      image = assets.common.wardrobe.heads[a.head],
      ctx = canvas.getContext("2d")!;
    canvas.width = 200;
    canvas.height = 200;
    ctx.clearRect(0, 0, 200, 200);
    const scale = 210 / image.naturalHeight;
    ctx.drawImage(
      image,
      100 - image.naturalWidth * scale * 0.5,
      -3,
      image.naturalWidth * scale,
      210,
    );
  }, [assets, a.head]);
  return <canvas ref={ref} aria-label="選中代表肖像" />;
}
function readReducedMotion(): boolean {
  return (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.inkMotion === "reduce"
  );
}
