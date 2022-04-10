import moment from 'moment';
import Promise from 'bluebird';
import QuickBase from 'quickbase';

export = QBField;

declare class QBField<T = Record<string, any>> {
	static NewField(options: Partial<QBFieldSettings>, attributes: Record<string, any>): QBField;
	static ParseValue(field: QBField, value: any): any;
	static FormatValue(field: QBField, value: any): any;
    constructor(options: Partial<QBFieldSettings>);
    _id: string;
	_qb: QuickBase;
	_dbid: string;
	_fid: number;
	_data: T;
	_baselineChoices: string[];
    className: string;
    settings: QBFieldSettings;
	clear(): void;
	delete(): Promise<this>;
	get<K extends keyof T>(attribute: K): T[K];
	getDBID(): string;
	getFid():number;
	load(): Promise<this>;
	save(attributesToSave?: string[]): Promise<this>;
	set<K extends keyof T>(attribute: K, value?: T[K]): this;
	setDBID(dbid: string): this;
	setFid(fid: number): this;
	toJson(attributesToConvert?: (keyof T)[]): T;
}

declare namespace QBField {
	export const QBField: QBField;
    export const className: string;
    export const defaults: QBFieldSettings;
	export { moment };
}

declare interface QBFieldSettings {
	quickbase: QuickBase | typeof QuickBase.defaults;
	dbid: string;
	fid: number;
}
