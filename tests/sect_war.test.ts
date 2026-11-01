import { describe, it, expect } from "vitest";
import {
  emptySectWar,
  SectWarService,
  sectWarTerm,
  sectReplayFingerprint,
  sectCombatSnapshot,
} from "../core/online/sectWar";
import { simulateSectBattle } from "../core/online/sectBattle";
import { sectBattleFixture } from "../src/prototypes/sectBattle/fixtures";
import { SECT_WAR_TEST as P } from "../data/redesign/sectWarTestParams";
import type {
  SectWarRepository,
  SectWarReport,
  SectWarReceipt,
  SectWarSnapshot,
  SectSelectionResult,
} from "../interfaces/sectWar";
import type { LifeGameState } from "../interfaces/lifeEngine";

function setup() {
  let now = Date.parse("2026-10-31T16:00:00Z"),
    world = emptySectWar(now),
    conflict = false,
    n = 0;
  const profiles: Record<string, LifeGameState> = Object.fromEntries(
    sectBattleFixture().map((u, i) => ["u" + i, u.state]),
  );
  const receipts = new Map<string, SectWarReceipt>(),
    reports = new Map<string, SectWarReport>();
  const repo: SectWarRepository = {
    load: async () => structuredClone(world),
    profiles: async (ids) =>
      structuredClone(
        Object.fromEntries(
          ids.filter((id) => profiles[id]).map((id) => [id, profiles[id]]),
        ),
      ),
    receipt: async (u, id) =>
      structuredClone(receipts.get(u + ":" + id) ?? null),
    report: async (id) => structuredClone(reports.get(id) ?? null),
    save: async (next, expected, report, receipt) => {
      if (conflict) {
        conflict = false;
        return false;
      }
      if (world.revision !== expected) return false;
      world = structuredClone({ ...next, revision: expected + 1 });
      if (report) reports.set(report.id, structuredClone(report));
      if (receipt)
        receipts.set(
          receipt.user_id + ":" + receipt.request_id,
          structuredClone(receipt),
        );
      return true;
    },
  };
  const service = new SectWarService(
    repo,
    () => now,
    () => ({
      seed: 5707,
      id: `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`,
    }),
  );
  const call = (
    user: string,
    action: string,
    data = {},
    requestId = `request-${++n}`,
  ) => service.execute(user, { action, data, requestId });
  const join = async () => {
    for (let i = 0; i < 20; i++) await call("u" + i, "join");
  };
  return {
    call,
    join,
    profiles,
    reports,
    receipts,
    read: () => world,
    advance: (ms: number) => {
      now += ms;
    },
    conflict: () => {
      conflict = true;
    },
  };
}
describe("真人門派會武", () => {
  it("test_sect_war_香港週一四時換屆_不跟裝置日期或星期日", () => {
    const a = Date.parse("2026-11-01T19:59:59Z");
    expect(sectWarTerm(a + 1000)).toBe(sectWarTerm(a) + 1);
  });
  it("test_sect_war_二十真人報名_各十席固定本屆名冊且不改舊人物", async () => {
    const t = setup(),
      before = structuredClone(t.profiles);
    await t.join();
    const s = (await t.call("u0", "overview")) as SectWarSnapshot;
    expect(s.teams.sect_qingyun.members).toHaveLength(10);
    expect(s.teams.sect_wudang.members).toHaveLength(10);
    expect(t.profiles).toEqual(before);
    expect(s.me?.id).toBe("u0");
    expect(s.members.every((m) => !("state" in m))).toBe(true);
  });
  it("test_sect_war_同週同對手及遺失回覆重試_只一場戰果且不派經濟", async () => {
    const t = setup();
    await t.join();
    const before = structuredClone(t.profiles);
    t.conflict();
    const first = (await t.call(
      "u0",
      "challenge",
      { target: "sect_wudang" },
      "same-command",
    )) as { reportId: string };
    expect(
      await t.call(
        "u0",
        "challenge",
        { target: "sect_wudang" },
        "same-command",
      ),
    ).toEqual(first);
    expect(
      await t.call("u10", "challenge", { target: "sect_qingyun" }),
    ).toEqual(first);
    expect(t.reports.size).toBe(1);
    expect(t.profiles).toEqual(before);
    const report = t.reports.get(first.reportId)!;
    const replay = simulateSectBattle(report.roster, report.seed, true, true);
    expect(sectReplayFingerprint(replay)).toBe(report.fingerprint);
    expect(replay.winner).toBe(report.winner);
    expect(replay.remaining).toEqual(report.remaining);
    expect(JSON.stringify(report)).not.toContain("fatherName");
    expect(
      report.roster.every(
        (u) => u.state.character.flags.caps_include_internal === true,
      ),
    ).toBe(true);
  });
  it("test_sect_war_門內比武勝方換位_本屆代表不變下週按新排名換屆", async () => {
    const t = setup();
    await t.join();
    t.profiles.u9.character.martial = 100000;
    t.profiles.u9.character.maxHealth = 100000;
    const current = [...t.read().payload.teams.sect_qingyun.members];
    const result = (await t.call("u9", "selection", {
      target: "u0",
    })) as SectSelectionResult;
    expect(result.replay.outcome).toBe("won");
    expect(result.before).toBe(10);
    expect(result.after).toBe(1);
    expect(t.read().payload.teams.sect_qingyun.members).toEqual(current);
    await expect(t.call("u9", "selection", { target: "u1" })).rejects.toThrow(
      "稍候",
    );
    t.advance(P.weekMs);
    const next = (await t.call("u9", "overview")) as SectWarSnapshot;
    expect(next.teams.sect_qingyun.members[0]).toBe("u9");
  });
  it("test_sect_war_未齊人退派異派與偽造結果_均不能開戰", async () => {
    const t = setup();
    await t.call("u0", "join");
    await expect(
      t.call("u0", "challenge", { target: "sect_wudang" }),
    ).rejects.toThrow("十名真人");
    await t.join();
    await expect(t.call("u0", "selection", { target: "u10" })).rejects.toThrow(
      "同門",
    );
    await expect(
      t.call("u0", "challenge", { target: "sect_wudang", winner: 0 }),
    ).rejects.toThrow();
    t.profiles.u1.character.sectId = null;
    await expect(
      t.call("u0", "challenge", { target: "sect_wudang" }),
    ).rejects.toThrow("離派");
    expect(t.reports.size).toBe(0);
  });
  it("test_sect_war_同編號改內容及假身份_拒絕且不改名冊", async () => {
    const t = setup();
    await t.join();
    await t.call("u0", "challenge", { target: "sect_wudang" }, "same-command");
    await expect(
      t.call("u0", "challenge", { target: "sect_emei" }, "same-command"),
    ).rejects.toThrow("不可變更");
    await expect(t.call("outsider", "join")).rejects.toThrow("先加入門派");
    expect(t.read().payload.members.outsider).toBeUndefined();
  });
  it("test_sect_war_下週重選_清除離派死亡或不存在人物不再卡舊席位", async () => {
    const t = setup();
    await t.join();
    t.profiles.u0.character.sectId = null;
    t.profiles.u1.character.alive = false;
    delete t.profiles.u2;
    t.advance(P.weekMs);
    const s = (await t.call("u9", "overview")) as SectWarSnapshot;
    expect(s.ranks.sect_qingyun).toHaveLength(7);
    expect(s.teams.sect_qingyun).toBeUndefined();
    expect(s.members.some((m) => ["u0", "u1", "u2"].includes(m.id))).toBe(
      false,
    );
    expect(s.teams.sect_wudang.members).toHaveLength(10);
  });
  it("test_sect_war_公開戰鬥快照_不複製玉石私事或人生旗標", () => {
    const state = sectBattleFixture()[0].state;
    state.character.flags.private_secret = "private-story";
    state.character.money = 999999;
    state.character.family.fatherName = "private-relative";
    const publicState = sectCombatSnapshot(state);
    expect(publicState.character.flags.private_secret).toBeUndefined();
    expect(publicState.character.family.fatherName).not.toBe(
      "private-relative",
    );
    expect(publicState.character.money).not.toBe(999999);
    expect(publicState.character.appearance).toEqual(
      state.character.appearance,
    );
  });
});
