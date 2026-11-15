import type {CharacterAppearance} from './appearance';
import type {CombatReplay,LifeCharacter,LifeGameState} from './lifeEngine';
export type GuildRole='leader'|'elder'|'member';
export interface Guild {id:string;name:string;intro:string;leader:string;level:number;materials:number;createdAt:number;log:{at:number;text:string}[]}
export interface GuildMember {id:string;guildId:string;name:string;appearance:CharacterAppearance;role:GuildRole;joinedAt:number;lastAttackAt:number;day:number;attacks:number}
export interface GuildApplication {user:string;guildId:string;name:string;appearance:CharacterAppearance;at:number}
export interface GuildCity {id:string;guildId:string|null;defenderId:string|null;defender:LifeCharacter|null;heldSince:number;accruedAt:number;protectedUntil:number}
export interface GuildWorld {revision:number;payload:{guilds:Record<string,Guild>;members:Record<string,GuildMember>;activity:Record<string,{day:number;attacks:number;lastAttackAt:number}>;applications:Record<string,GuildApplication>;cities:Record<string,GuildCity>;reports:GuildReportSummary[]}}
export interface GuildReportSummary {id:string;city:string;at:number;guilds:[string,string];names:[string,string];captured:boolean}
export interface GuildReport extends GuildReportSummary {replay:CombatReplay;look:{sectId:string|null;weaponId:string|null}}
export interface GuildSnapshot {revision:number;serverNow:number;me:GuildMember|null;guild:Guild|null;capacity:number;attackRemaining:number;members:GuildMember[];applications:GuildApplication[];application:GuildApplication|null;guilds:{id:string;name:string;intro:string;level:number;count:number;capacity:number}[];cities:{id:string;guildId:string|null;defenderName:string|null;heldSince:number;protectedUntil:number}[];reports:GuildReportSummary[]}
export interface GuildReceipt {user_id:string;request_id:string;input:string;result:unknown}
export interface GuildRepository {load():Promise<GuildWorld>;profiles(ids:string[]):Promise<Record<string,LifeGameState>>;receipt(user:string,id:string):Promise<GuildReceipt|null>;report(id:string):Promise<GuildReport|null>;save(world:GuildWorld,expected:number,report:GuildReport|null,receipt:GuildReceipt):Promise<boolean>}
