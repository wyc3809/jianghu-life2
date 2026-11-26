import type { FoeEntry, FoeLook, FoeRegion } from './roster';
import type { FoeTraitId } from './traits';

type Fighter = readonly [name: string, look: FoeLook];
type Chapter = readonly [
  bg: string, place: string, theme: string, accent: string,
  trait: FoeTraitId, rivalTrait: FoeTraitId,
  minions: readonly [Fighter, Fighter, Fighter], elites: readonly [Fighter, Fighter],
  warden: Fighter, boss: Fighter,
];

export interface SparCampaignRegion extends FoeRegion {
  /** 門將守平常關口，章末才見章主。 */
  warden: FoeEntry;
  rivalTrait: FoeTraitId;
}

/** 金庸小說的江湖母題：市井恩義、走鏢、門派內鬥、護卷、結盟及守關。人物同地名屬本作。 */
const chapters: readonly Chapter[] = [
  ['road','回雁驛','失鏢疑雲','155,106,62','charge','guard',
    [['截鏢刀手','daoke'],['翻嶺探子','shadow'],['伏驛鉤客','gouke']], [['叛鏢副手','daoke'],['重車把總','toutuo']],['斷路鏢頭','gouke'],['回雁總鏢頭','chifa']],
  ['inn','沙河渡','渡口恩仇','158,120,70','combo','charge',
    [['渡河刀客','daoke'],['長索撐船人','gouke'],['蘆間快影','nvcike']], [['翻船客','gouke'],['沉舟刀衛','tiemian']],['沙河司渡','shadow'],['飛索舵主','chifa']],
  ['bamboo','青蘆澤','水寨迷蹤','64,118,100','drain','combo',
    [['澤中探哨','shadow'],['蘆衣短刃','nvcike'],['踏浪雙鉤','gouke']], [['藥煙客','nvcike'],['潛潮護衛','tiemian']],['澤口香主','daoke'],['青蘆寨主','tiemian']],
  ['gate','分劍臺','兩脈爭名','127,137,71','guard','combo',
    [['守帖劍徒','daoke'],['巡臺弟子','shadow'],['折鋒鉤手','gouke']], [['東脈劍師','nvcike'],['西脈護院','toutuo']],['分劍執事','tiemian'],['雙脈仲裁人','daoke']],
  ['nightpeak','獨炬寨','夜圍山寨','140,50,42','enrage','charge',
    [['夜炬刀卒','daoke'],['背火山卒','toutuo'],['繞寨鉤手','gouke']], [['舉炬狂徒','chifa'],['獨炬先鋒','tiemian']],['寨前火頭','chifa'],['獨炬寨首','toutuo']],
  ['town','青瓦街','市井俠義','160,121,56','guard','thorns',
    [['封街打手','daoke'],['查鋪探子','shadow'],['追債雙鉤','gouke']], [['青瓦護商','toutuo'],['暗契掌櫃','tiemian']],['封街管事','daoke'],['青瓦街盟主','toutuo']],
  ['inn','暮雨樓','密信易手','73,107,151','combo','drain',
    [['簷下快刀','nvcike'],['截信影衛','shadow'],['樓外鉤客','gouke']], [['雨幕信使','nvcike'],['暮雨樓衛','tiemian']],['密信收使','shadow'],['暮雨樓主','tiemian']],
  ['road','響石峽','商道決裂','181,108,57','charge','thorns',
    [['響石刀徒','daoke'],['拋索伏手','gouke'],['扛木巡卒','toutuo']], [['斷輪力士','toutuo'],['折石護衛','tiemian']],['峽路把頭','gouke'],['響石刀魁','chifa']],
  ['bamboo','藥廬後谷','護藥尋方','67,128,95','drain','guard',
    [['背簍探藥人','shadow'],['青衣伏衛','nvcike'],['攔藥鉤手','gouke']], [['試藥邪客','tiemian'],['搶方壯士','toutuo']],['藥廬門衛','daoke'],['後谷毒郎中','tiemian']],
  ['gate','聽松院','藏卷之爭','130,124,78','thorns','guard',
    [['巡院棍徒','toutuo'],['竊卷快影','shadow'],['掠頁鉤徒','gouke']], [['護卷武僧','toutuo'],['翻閣劍師','daoke']],['藏卷院監','tiemian'],['聽松院主','toutuo']],
  ['nightpeak','白鹿隘','雪夜救援','109,129,150','charge','combo',
    [['雪地刀卒','daoke'],['雪簷快影','nvcike'],['長索伏兵','gouke']], [['封隘鐵衛','tiemian'],['踏雪隊長','shadow']],['白鹿守隘人','toutuo'],['雪隘鎮將','chifa']],
  ['road','三旗關','聯盟試鋒','174,125,60','guard','enrage',
    [['巡旗刀手','daoke'],['倒旗鉤客','gouke'],['執旗力士','toutuo']], [['青旗副將','tiemian'],['赤旗副將','chifa']],['三旗執令','daoke'],['三旗盟主','toutuo']],
  ['inn','問潮港','私鹽暗流','69,123,132','drain','charge',
    [['港口影探','shadow'],['問潮短刃','nvcike'],['棧橋鉤客','gouke']], [['破船暗衛','tiemian'],['鹽棧力士','toutuo']],['潮棧巡首','daoke'],['問潮提舵','chifa']],
  ['bamboo','霧弦林','暗號逐影','100,104,143','combo','thorns',
    [['折弦手','shadow'],['斷竹快影','nvcike'],['牽絲鉤客','gouke']], [['霧中雙影','nvcike'],['封徑鐵衛','tiemian']],['霧弦傳令','shadow'],['霧弦領主','tiemian']],
  ['town','金橋市','比武奪帖','174,126,66','guard','combo',
    [['金橋擂徒','daoke'],['連步陪練','nvcike'],['守帖打手','gouke']], [['擂臺鐵臂','toutuo'],['奪帖快刃','nvcike']],['金橋擂主','tiemian'],['金橋帖主','daoke']],
  ['gate','石鐘庭','護院破圍','156,128,73','thorns','enrage',
    [['攔鐘僧兵','toutuo'],['翻牆夜影','shadow'],['折柱刀卒','daoke']], [['護鐘鐵僧','toutuo'],['破庭狂徒','chifa']],['石鐘護庭使','tiemian'],['石鐘堂主','toutuo']],
  ['nightpeak','雙崖索道','孤橋生死','146,67,49','charge','drain',
    [['走索探子','shadow'],['鎖橋鉤手','gouke'],['斷橋刀卒','daoke']], [['兩崖重衛','toutuo'],['奪索邪客','tiemian']],['雙崖掌索人','gouke'],['雙崖鎮首','chifa']],
  ['road','折戟坡','護關守盟','166,106,59','enrage','guard',
    [['拾戟刀客','daoke'],['山坡伏手','shadow'],['守戟雙鉤','gouke']], [['守約重衛','toutuo'],['折戟狂客','chifa']],['折戟副將','tiemian'],['坡上守盟人','chifa']],
  ['bamboo','青隱臺','群俠論心','85,125,106','combo','thorns',
    [['守臺輕衛','nvcike'],['受帖劍徒','daoke'],['掠影雙鉤','gouke']], [['論劍快手','nvcike'],['論心鐵衛','toutuo']],['青隱司試','shadow'],['青隱臺主','tiemian']],
  ['nightpeak','照世峰','守諾終局','158,83,58','enrage','charge',
    [['峰口刀衛','daoke'],['映峰雙鉤','gouke'],['背旗鐵衛','toutuo']], [['照世副將','tiemian'],['守約先鋒','chifa']],['照世守關人','toutuo'],['照世峰盟主','chifa']],
];

export const SPAR_CAMPAIGN_REGIONS: readonly SparCampaignRegion[] = chapters.map((chapter, i) => {
  const [bg, place, theme, accent, trait, rivalTrait, minions, elites, warden, boss] = chapter;
  const entry = ([name, look]: Fighter, tier: FoeEntry['tier'], slot: string): FoeEntry => ({
    id: `spar_chapter_${i + 7}_${slot}`, name, look, tier, accent, title: theme, blurb: `${place}的${name}`,
  });
  return {
    bg, place, theme, trait, rivalTrait,
    minions: minions.map((foe, n) => entry(foe, 'minion', `minion_${n}`)),
    elites: elites.map((foe, n) => entry(foe, 'elite', `elite_${n}`)),
    warden: entry(warden, 'boss', 'warden'),
    boss: entry(boss, 'boss', 'boss'),
  };
});
