import type { CombatReplay } from './lifeEngine';
export interface LiveMessage {id:string;seq:number;sender:string;recipient:string|null;name:string;body:string;created_at:string}
export interface LiveMessages {messages:LiveMessage[];blocked:string[]}
export interface LiveWatch {id:string;startedAt:number;endsAt:number;serverNow:number;replay:CombatReplay;look:{sectId:string|null;weaponId:string|null}}
