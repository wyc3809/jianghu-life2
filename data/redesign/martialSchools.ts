/** 103門現有武學嘅主流派：用名義／實際特性人工核對，兼修適性仍由 schoolsOfSkill 保留。 */
import type { SchoolId } from './schools';

export const MARTIAL_SCHOOL_GROUPS: Record<SchoolId, readonly string[]> = {
  xueren: [
    'art_silk_hand', 'art_thunder_blade', 'art_shadow_needle', 'art_tiger_breath',
    'td_wind_slash', 'td_no_return', 'em_golden_palm', 'tm_flying_needle', 'tm_poison_dart',
    'mj_blood_palm', 'mj_devil_breath', 'mj_soul_drain', 'mj_asura_slash',
    'wg_embroidery_needle', 'wg_yin_soft_palm', 'wg_root_severed_creed', 'art_heretic_scripture',
    'pr_blood_lotus', 'pr_crimson_moon', 'pr_blood_sea',
  ],
  lianhuan: [
    '基礎吐納', 'art_rain_sword', 'art_void_breath', 'art_wind_chase', 'art_spring_well',
    'qg_swallow_turn', 'qg_reed_drift', 'qy_mist_step', 'qy_sky_intent', 'td_thunder_combo',
    'wd_pure_yang', 'wd_wuji_sword', 'tm_thousand_mech', 'hs_cloud_step', 'th_flute_sword',
    'th_falling_petals', 'art_guqin_song', 'pr_nine_chain', 'pr_wind_thread',
    'pr_star_fall', 'pr_thunder_heart',
  ],
  pojia: [
    'art_river_fist', 'art_stone_palm', 'art_tomb_sword', 'art_moon_sword', 'art_hook_silk',
    'art_spear_cloud', 'art_bow_star', 'art_heavy_halberd', 'qy_cloud_sword',
    'qy_piercing_needle', 'td_open_blade', 'wd_sword_form', 'hs_pine_sword', 'hs_split_peak',
    'hs_yue_breath', 'th_finger_flick', 'art_weiqi_trap', 'pr_mountain_split', 'pr_heaven_spear',
  ],
  zhidi: [
    'art_nine_shadow', 'art_cold_palm', 'art_meteor_palm', 'art_staff_iron', 'art_whip_silk',
    'art_sand_palm', 'jy_ash_manual', 'em_silk_wrap', 'sl_weituo', 'art_dao_breath',
    'pr_soul_lock', 'pr_mist_blind', 'pr_seal_meridian',
  ],
  jingang: [
    'art_lake_breath', 'art_iron_body', 'art_mirror_breath', 'em_soft_palm', 'em_heart_breath',
    'sl_luohan_fist', 'sl_iron_shirt', 'sl_yijin', 'wd_tai_push', 'art_buddha_heart',
    'pr_vajra_palm', 'pr_diamond_body',
  ],
  qingling: [
    'art_bridge_step', 'qg_snow_track', 'qg_feiyan', 'qg_canopy_void', 'qg_broken_bridge',
    'qg_wall_cat', 'qg_lotus_steps', 'tm_shadow_step', 'art_drunken_fist', 'th_qimen_array',
    'wg_silent_step', 'art_poetry_sword', 'art_ink_illusion', 'pr_floating_blade',
    'pr_void_breath', 'pr_cloud_step', 'pr_shadow_flash', 'pr_tide_step',
  ],
};

export const MARTIAL_PRIMARY_SCHOOL: Readonly<Record<string, SchoolId>> = Object.fromEntries(
  Object.entries(MARTIAL_SCHOOL_GROUPS).flatMap(([school, ids]) => ids.map(id => [id, school as SchoolId])),
);
