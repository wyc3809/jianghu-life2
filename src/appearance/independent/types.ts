import type { CharacterAppearance } from '@interfaces/appearance';
export type PartRect=[number,number,number,number,number,number];
export interface MotionFrame {t:number;parts:PartRect[];upper:[number,number,number,number,number,number];head:number;grip:[number,number,number];farGrip:[number,number,number];wrist?:[number,number,number];contact?:'near'|'far'}
export interface MotionInfo {name:string;kind:string;family:string;duration:number;contacts:number[];state?:string;neutral:string}
export interface MotionClip extends MotionInfo {id:string;outfit:CharacterAppearance['outfit'];origin:[number,number];pixelsPerHeight:number;atlas:string;sha256:string;frames:MotionFrame[]}
export interface UpperSheet {outfit:CharacterAppearance['outfit'];head:CharacterAppearance['head'];origin:[number,number];pixelsPerHeight:number;turns:number[];parts:PartRect[];atlas:string;sha256:string}
export interface PreparedClip {meta:MotionClip;image:HTMLCanvasElement}
export interface PreparedUpper {meta:UpperSheet;image:HTMLCanvasElement}
export interface PropDef {src:string;w:number;h:number;grip:number[];tip:number[];ratio:number;flipX?:number}
export interface PreparedProp {def:PropDef;image:HTMLImageElement}
